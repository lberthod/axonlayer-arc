import { config } from '../config.js';

/**
 * Dynamic pricing: computes per-task payments based on input length and task
 * type. Keeps the legacy (fixed) pricing available for backwards compatibility
 * when config.pricing.dynamic.enabled is false.
 *
 * The produced price is always split deterministically across worker,
 * validator and orchestrator so the ledger invariant holds:
 *     clientPayment = workerPayment + validatorPayment + orchestratorMargin
 */
class PricingEngine {
  normalize(value) {
    return Number(Number(value).toFixed(6));
  }

  /**
   * @param {object} params
   * @param {string} params.input
   * @param {string} params.taskType
   * @param {number} [params.workerQuote]  optional price proposed by chosen worker
   * @param {number} [params.validatorQuote] optional price proposed by chosen validator
   * @returns {{clientPayment:number, workerPayment:number, validatorPayment:number, orchestratorMargin:number, breakdown:object}}
   */
  price({ input = '', taskType = 'summarize', workerQuote, validatorQuote } = {}) {
    const dyn = config.pricing.dynamic;

    if (!dyn?.enabled) {
      return {
        clientPayment: config.pricing.clientPayment,
        workerPayment: config.pricing.workerPayment,
        validatorPayment: config.pricing.validatorPayment,
        orchestratorMargin: config.pricing.orchestratorMargin,
        breakdown: { strategy: 'fixed' }
      };
    }

    const length = typeof input === 'string' ? input.length : 0;
    const multiplier = dyn.taskTypeMultiplier[taskType] ?? 1.0;

    const rawClient = (config.pricing.clientPayment) + (length * dyn.basePerChar * multiplier);
    const clientPayment = this.normalize(
      Math.min(Math.max(rawClient, dyn.minClientPayment), dyn.maxClientPayment)
    );

    // If agents supplied quotes, honour them but clamp within the client budget.
    let workerPayment = this.normalize(
      typeof workerQuote === 'number' ? workerQuote : clientPayment * dyn.workerShare
    );
    let validatorPayment = this.normalize(
      typeof validatorQuote === 'number' ? validatorQuote : clientPayment * dyn.validatorShare
    );

    const maxAgentCost = this.normalize(clientPayment * (1 - dyn.marginRatio));
    if (workerPayment + validatorPayment > maxAgentCost) {
      const ratio = maxAgentCost / (workerPayment + validatorPayment);
      workerPayment = this.normalize(workerPayment * ratio);
      validatorPayment = this.normalize(validatorPayment * ratio);
    }

    const orchestratorMargin = this.normalize(
      clientPayment - workerPayment - validatorPayment
    );

    return {
      clientPayment,
      workerPayment,
      validatorPayment,
      orchestratorMargin,
      breakdown: {
        strategy: 'dynamic',
        inputLength: length,
        taskType,
        multiplier,
        workerQuote: workerQuote ?? null,
        validatorQuote: validatorQuote ?? null
      }
    };
  }
}

export { PricingEngine };
export default new PricingEngine();
