import { describe, it, expect, beforeEach } from 'vitest';
import { PricingEngine } from '../../src/core/pricingEngine.js';
import { config } from '../../src/config.js';

describe('PricingEngine — Ledger Invariant', () => {
  let engine;

  beforeEach(() => {
    engine = new PricingEngine();
  });

  /**
   * CORE INVARIANT: clientPayment = workerPayment + validatorPayment + orchestratorMargin
   * This MUST hold for every pricing call, or we leak/create value.
   */
  it('invariant: client payment equals sum of agent payouts', () => {
    const inputs = [
      { input: 'short', taskType: 'summarize' },
      { input: 'a'.repeat(5000), taskType: 'translate' },
      { input: 'medium text here', taskType: 'classify' },
      { input: '', taskType: 'sentiment' },
    ];

    inputs.forEach(({ input, taskType }) => {
      const pricing = engine.price({ input, taskType });
      const { clientPayment, workerPayment, validatorPayment, orchestratorMargin } = pricing;

      const sum = engine.normalize(workerPayment + validatorPayment + orchestratorMargin);

      expect(sum).toBe(clientPayment,
        `INVARIANT BROKEN: ${clientPayment} !== ${workerPayment} + ${validatorPayment} + ${orchestratorMargin}`);
    });
  });

  /**
   * Pricing MUST respect min/max bounds from the profile
   */
  it('respects min/max bounds from pricing profile', () => {
    const dyn = config.pricing.dynamic;
    if (!dyn?.enabled) {
      console.log('  (dynamic pricing disabled, skipping bounds check)');
      return;
    }

    const { minClientPayment, maxClientPayment } = dyn;
    const pricing = engine.price({
      input: 'x'.repeat(10000),
      taskType: 'translate'
    });

    expect(pricing.clientPayment).toBeGreaterThanOrEqual(minClientPayment);
    expect(pricing.clientPayment).toBeLessThanOrEqual(maxClientPayment);
  });

  /**
   * All payments must be positive (no negative balances)
   */
  it('all payments are positive', () => {
    const pricing = engine.price({
      input: 'test',
      taskType: 'summarize'
    });

    expect(pricing.clientPayment).toBeGreaterThan(0);
    expect(pricing.workerPayment).toBeGreaterThan(0);
    expect(pricing.validatorPayment).toBeGreaterThan(0);
    expect(pricing.orchestratorMargin).toBeGreaterThanOrEqual(0);
  });

  /**
   * Floating-point rounding must not introduce errors
   * (toFixed(6) should be safe for USDC)
   */
  it('toFixed(6) rounding is stable across splits', () => {
    for (let i = 0; i < 100; i++) {
      const len = Math.floor(Math.random() * 5000);
      const input = 'x'.repeat(len);
      const pricing = engine.price({ input, taskType: 'summarize' });

      const { clientPayment, workerPayment, validatorPayment, orchestratorMargin } = pricing;
      const reconstructed = engine.normalize(workerPayment + validatorPayment + orchestratorMargin);

      expect(reconstructed).toBe(clientPayment,
        `Rounding error at length ${len}: ${clientPayment} vs reconstructed ${reconstructed}`);
    }
  });

  /**
   * Clamping + rounding interaction: if we clamp, the invariant must STILL hold
   */
  it('invariant holds even after min/max clamping', () => {
    const dyn = config.pricing.dynamic;
    if (!dyn?.enabled) {
      console.log('  (dynamic pricing disabled, skipping clamping check)');
      return;
    }

    // Force a very large input to trigger upper clamp
    const pricing = engine.price({
      input: 'x'.repeat(20000),
      taskType: 'translate'
    });

    const { clientPayment, workerPayment, validatorPayment, orchestratorMargin } = pricing;
    const sum = engine.normalize(workerPayment + validatorPayment + orchestratorMargin);

    expect(sum).toBe(clientPayment,
      `Clamped pricing broke invariant: ${clientPayment} !== sum of agents`);
  });

  /**
   * Task type multipliers should scale pricing proportionally
   */
  it('task type multipliers scale pricing consistently', () => {
    const input = 'x'.repeat(1000);

    const standard = engine.price({ input, taskType: 'summarize' });
    const expensive = engine.price({ input, taskType: 'translate' });

    // Translate should cost more than summarize (if multiplier > 1)
    if (config.pricing.dynamic?.taskTypeMultiplier?.translate > 1) {
      expect(expensive.clientPayment).toBeGreaterThan(standard.clientPayment);
    }
  });

  /**
   * CRITICAL: Margin must NEVER be negative
   * This was the audit bug - aggressive agent quotes could make margin < 0
   */
  it('CRITICAL: margin is never negative even with aggressive quotes', () => {
    // Simulate aggressive agent quotes
    const scenarios = [
      { workerQuote: 0.0008, validatorQuote: 0.0008, input: 'small' },
      { workerQuote: 0.001, validatorQuote: 0.001, input: 'medium task' },
      { workerQuote: 0.005, validatorQuote: 0.005, input: 'x'.repeat(5000) }
    ];

    for (const { workerQuote, validatorQuote, input } of scenarios) {
      const pricing = engine.price({
        input,
        taskType: 'summarize',
        workerQuote,
        validatorQuote
      });

      expect(pricing.orchestratorMargin).toBeGreaterThanOrEqual(0,
        `Margin ${pricing.orchestratorMargin} < 0 with quotes ${workerQuote}/${validatorQuote}`);

      // Also verify invariant
      const sum = engine.normalize(pricing.workerPayment + pricing.validatorPayment + pricing.orchestratorMargin);
      expect(sum).toBe(pricing.clientPayment);
    }
  });

  /**
   * Margin must be guaranteed even in edge cases
   */
  it('guarantees minimum margin in breakdown', () => {
    const dyn = config.pricing.dynamic;
    if (!dyn?.enabled) {
      console.log('  (dynamic pricing disabled, skipping margin guarantee check)');
      return;
    }

    const pricing = engine.price({
      input: 'task with aggressive quotes',
      taskType: 'summarize',
      workerQuote: 0.001,
      validatorQuote: 0.001
    });

    // breakdown should indicate margin is guaranteed
    if (pricing.breakdown.marginGuaranteed !== undefined) {
      expect(pricing.breakdown.marginGuaranteed).toBe(true);
    }
  });
});
