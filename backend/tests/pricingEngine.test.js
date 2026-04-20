import { describe, it, expect } from 'vitest';
import pricingEngine from '../src/core/pricingEngine.js';
import { config } from '../src/config.js';

const approxEq = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

describe('pricingEngine', () => {
  it('returns fixed pricing when dynamic is disabled', () => {
    const was = config.pricing.dynamic.enabled;
    config.pricing.dynamic.enabled = false;
    try {
      const p = pricingEngine.price({ input: 'abc', taskType: 'summarize' });
      expect(p.clientPayment).toBe(config.pricing.clientPayment);
      expect(p.workerPayment).toBe(config.pricing.workerPayment);
      expect(p.validatorPayment).toBe(config.pricing.validatorPayment);
      expect(p.orchestratorMargin).toBe(config.pricing.orchestratorMargin);
    } finally {
      config.pricing.dynamic.enabled = was;
    }
  });

  it('always respects the ledger invariant: client = worker + validator + margin', () => {
    const inputs = [
      { input: '', taskType: 'summarize' },
      { input: 'x'.repeat(10), taskType: 'keywords' },
      { input: 'x'.repeat(500), taskType: 'translate' },
      { input: 'x'.repeat(5000), taskType: 'rewrite' },
      { input: 'x'.repeat(2000), taskType: 'classify' },
      { input: 'x'.repeat(100), taskType: 'sentiment' }
    ];

    for (const i of inputs) {
      const p = pricingEngine.price(i);
      const sum = p.workerPayment + p.validatorPayment + p.orchestratorMargin;
      expect(approxEq(sum, p.clientPayment), `sum=${sum} client=${p.clientPayment}`).toBe(true);
      expect(p.workerPayment).toBeGreaterThan(0);
      expect(p.validatorPayment).toBeGreaterThan(0);
      expect(p.orchestratorMargin).toBeGreaterThanOrEqual(0);
    }
  });

  it('clamps clientPayment within [min, max]', () => {
    const d = config.pricing.dynamic;
    const small = pricingEngine.price({ input: '', taskType: 'summarize' });
    expect(small.clientPayment).toBeGreaterThanOrEqual(d.minClientPayment);

    const huge = pricingEngine.price({ input: 'x'.repeat(100000), taskType: 'translate' });
    expect(huge.clientPayment).toBeLessThanOrEqual(d.maxClientPayment);
  });

  it('honours worker/validator quotes while staying within budget', () => {
    const p = pricingEngine.price({
      input: 'x'.repeat(200),
      taskType: 'summarize',
      workerQuote: 0.0025,
      validatorQuote: 0.0012
    });
    expect(p.orchestratorMargin).toBeGreaterThanOrEqual(0);
    const sum = p.workerPayment + p.validatorPayment + p.orchestratorMargin;
    expect(approxEq(sum, p.clientPayment)).toBe(true);
  });
});
