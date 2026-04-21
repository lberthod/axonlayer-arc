/**
 * Tests for Strategy Definitions
 */

import StrategyDefinitions from '../../src/core/strategyDefinitions.js';

describe('StrategyDefinitions', () => {
  let strategies;

  beforeEach(() => {
    strategies = new StrategyDefinitions();
  });

  describe('Strategy Retrieval', () => {
    test('should get cheap strategy', () => {
      const cheap = strategies.getStrategy('cheap');
      expect(cheap.name).toBe('cheap');
      expect(cheap.description).toBeDefined();
      expect(cheap.objective).toBeDefined();
    });

    test('should get balanced strategy', () => {
      const balanced = strategies.getStrategy('balanced');
      expect(balanced.name).toBe('balanced');
      expect(balanced.weights).toBeDefined();
    });

    test('should get premium strategy', () => {
      const premium = strategies.getStrategy('premium');
      expect(premium.name).toBe('premium');
      expect(premium.weights).toBeDefined();
    });

    test('should get hybrid strategy', () => {
      const hybrid = strategies.getStrategy('hybrid');
      expect(hybrid.name).toBe('hybrid');
      expect(hybrid.weights).toBeDefined();
    });

    test('should handle case-insensitive strategy names', () => {
      const cheap1 = strategies.getStrategy('cheap');
      const cheap2 = strategies.getStrategy('CHEAP');
      const cheap3 = strategies.getStrategy('Cheap');

      expect(cheap1.name).toBe(cheap2.name);
      expect(cheap2.name).toBe(cheap3.name);
    });

    test('should default to balanced for unknown strategy', () => {
      const unknown = strategies.getStrategy('unknown_strategy');
      expect(unknown.name).toBe('balanced');
    });
  });

  describe('Strategy Structure', () => {
    test('should have all required properties', () => {
      const strategy = strategies.getStrategy('balanced');

      expect(strategy).toHaveProperty('name');
      expect(strategy).toHaveProperty('description');
      expect(strategy).toHaveProperty('objective');
      expect(strategy).toHaveProperty('weights');
      expect(strategy).toHaveProperty('constraints');
      expect(strategy).toHaveProperty('selection');
      expect(strategy).toHaveProperty('budget');
      expect(strategy).toHaveProperty('expectedOutcomes');
    });

    test('weights should have all dimensions', () => {
      const strategy = strategies.getStrategy('balanced');

      expect(strategy.weights).toHaveProperty('cost');
      expect(strategy.weights).toHaveProperty('quality');
      expect(strategy.weights).toHaveProperty('reliability');
      expect(strategy.weights).toHaveProperty('latency');
      expect(strategy.weights).toHaveProperty('specialization');
    });

    test('weights should sum to 1.0', () => {
      const allStrategies = ['cheap', 'balanced', 'premium', 'hybrid'];

      allStrategies.forEach(name => {
        const strategy = strategies.getStrategy(name);
        const sum = Object.values(strategy.weights).reduce((a, b) => a + b, 0);
        expect(Math.abs(sum - 1.0)).toBeLessThan(0.001); // Allow floating point error
      });
    });

    test('constraints should be reasonable', () => {
      const strategy = strategies.getStrategy('balanced');
      const c = strategy.constraints;

      expect(c.minQuality).toBeGreaterThan(0);
      expect(c.minQuality).toBeLessThanOrEqual(1);
      expect(c.minReliability).toBeGreaterThan(0);
      expect(c.minReliability).toBeLessThanOrEqual(1);
      expect(c.maxLatency).toBeGreaterThan(0);
      expect(c.maxCost).toBeGreaterThan(0);
    });
  });

  describe('CHEAP Strategy Characteristics', () => {
    test('should prioritize cost', () => {
      const cheap = strategies.getCheapStrategy();
      expect(cheap.weights.cost).toBeGreaterThan(0.4); // Cost is primary
      expect(cheap.weights.cost).toBeGreaterThan(cheap.weights.quality);
      expect(cheap.weights.cost).toBeGreaterThan(cheap.weights.latency);
    });

    test('should have lower quality requirements', () => {
      const cheap = strategies.getCheapStrategy();
      expect(cheap.constraints.minQuality).toBeLessThan(0.8);
    });

    test('should allow higher risk', () => {
      const cheap = strategies.getCheapStrategy();
      expect(cheap.budget.riskTolerance).toBe('high');
    });

    test('should have low expected cost', () => {
      const cheap = strategies.getCheapStrategy();
      expect(cheap.expectedOutcomes.avgCost).toBeLessThan(0.0005);
    });
  });

  describe('BALANCED Strategy Characteristics', () => {
    test('should balance multiple factors', () => {
      const balanced = strategies.getBalancedStrategy();
      const weights = Object.values(balanced.weights);
      // No single weight should dominate
      const max = Math.max(...weights);
      const min = Math.min(...weights);
      expect(max - min).toBeLessThan(0.2); // Relatively balanced
    });

    test('should have medium quality requirements', () => {
      const balanced = strategies.getBalancedStrategy();
      expect(balanced.constraints.minQuality).toBeGreaterThan(0.75);
      expect(balanced.constraints.minQuality).toBeLessThan(0.85);
    });

    test('should have medium risk tolerance', () => {
      const balanced = strategies.getBalancedStrategy();
      expect(balanced.budget.riskTolerance).toBe('medium');
    });
  });

  describe('PREMIUM Strategy Characteristics', () => {
    test('should prioritize quality and reliability', () => {
      const premium = strategies.getPremiumStrategy();
      expect(premium.weights.quality).toBeGreaterThan(0.3);
      expect(premium.weights.reliability).toBeGreaterThan(0.3);
      expect(premium.weights.quality + premium.weights.reliability).toBeGreaterThan(0.6);
    });

    test('should have high quality requirements', () => {
      const premium = strategies.getPremiumStrategy();
      expect(premium.constraints.minQuality).toBeGreaterThan(0.9);
      expect(premium.constraints.minReliability).toBeGreaterThan(0.95);
    });

    test('should accept higher costs', () => {
      const premium = strategies.getPremiumStrategy();
      expect(premium.budget.costMultiplier).toBeGreaterThan(1);
      expect(premium.budget.riskTolerance).toBe('low');
    });

    test('should use parallel execution', () => {
      const premium = strategies.getPremiumStrategy();
      expect(premium.selection.parallelization).toBe(true);
    });

    test('should have multiple fallbacks', () => {
      const premium = strategies.getPremiumStrategy();
      expect(premium.selection.fallbackChain).toBeGreaterThanOrEqual(2);
    });
  });

  describe('HYBRID Strategy Characteristics', () => {
    test('should have task-aware adjustments', () => {
      const hybrid = strategies.getHybridStrategy();
      expect(hybrid.taskAdjustments).toBeDefined();
      expect(hybrid.taskAdjustments['high-complexity']).toBeDefined();
      expect(hybrid.taskAdjustments['time-critical']).toBeDefined();
      expect(hybrid.taskAdjustments['cost-critical']).toBeDefined();
      expect(hybrid.taskAdjustments['high-stakes']).toBeDefined();
    });

    test('should adjust weights for high-complexity tasks', () => {
      const hybrid = strategies.getHybridStrategy();
      const adjustment = hybrid.taskAdjustments['high-complexity'];
      expect(adjustment.quality).toBeGreaterThan(adjustment.cost);
    });

    test('should adjust weights for time-critical tasks', () => {
      const hybrid = strategies.getHybridStrategy();
      const adjustment = hybrid.taskAdjustments['time-critical'];
      expect(adjustment.latency).toBeGreaterThan(adjustment.cost);
      expect(adjustment.latency).toBeGreaterThan(adjustment.quality);
    });

    test('should adjust weights for cost-critical tasks', () => {
      const hybrid = strategies.getHybridStrategy();
      const adjustment = hybrid.taskAdjustments['cost-critical'];
      expect(adjustment.cost).toBeGreaterThan(adjustment.latency);
    });

    test('should adjust weights for high-stakes tasks', () => {
      const hybrid = strategies.getHybridStrategy();
      const adjustment = hybrid.taskAdjustments['high-stakes'];
      expect(adjustment.quality + adjustment.reliability).toBeGreaterThan(0.7);
    });

    test('should have dynamic parallelization', () => {
      const hybrid = strategies.getHybridStrategy();
      expect(hybrid.selection.parallelization).toBe('dynamic');
    });
  });

  describe('Validation', () => {
    test('should validate strategy name', () => {
      expect(strategies.isValidStrategy('cheap')).toBe(true);
      expect(strategies.isValidStrategy('balanced')).toBe(true);
      expect(strategies.isValidStrategy('premium')).toBe(true);
      expect(strategies.isValidStrategy('hybrid')).toBe(true);
      expect(strategies.isValidStrategy('unknown')).toBe(false);
    });

    test('should handle case-insensitive validation', () => {
      expect(strategies.isValidStrategy('CHEAP')).toBe(true);
      expect(strategies.isValidStrategy('Balanced')).toBe(true);
    });
  });

  describe('Weight Retrieval', () => {
    test('should get weights for strategy', () => {
      const weights = strategies.getWeights('cheap');
      expect(weights).toBeDefined();
      expect(weights.cost).toBeDefined();
    });

    test('should apply task-specific adjustments for hybrid', () => {
      const baseWeights = strategies.getWeights('hybrid');
      const adjustedWeights = strategies.getWeights('hybrid', {
        taskType: 'time-critical',
      });

      expect(adjustedWeights.latency).toBeGreaterThan(baseWeights.latency);
    });

    test('should not adjust non-hybrid strategies', () => {
      const weights1 = strategies.getWeights('balanced');
      const weights2 = strategies.getWeights('balanced', {
        taskType: 'time-critical',
      });

      expect(weights1).toEqual(weights2);
    });
  });

  describe('Constraint Retrieval', () => {
    test('should get constraints for strategy', () => {
      const constraints = strategies.getConstraints('balanced');
      expect(constraints).toBeDefined();
      expect(constraints.minQuality).toBeDefined();
      expect(constraints.minReliability).toBeDefined();
      expect(constraints.maxLatency).toBeDefined();
      expect(constraints.maxCost).toBeDefined();
    });

    test('constraints should be strict for premium', () => {
      const balancedConstraints = strategies.getConstraints('balanced');
      const premiumConstraints = strategies.getConstraints('premium');

      expect(premiumConstraints.minQuality).toBeGreaterThan(
        balancedConstraints.minQuality
      );
      expect(premiumConstraints.minReliability).toBeGreaterThan(
        balancedConstraints.minReliability
      );
    });

    test('constraints should be relaxed for cheap', () => {
      const balancedConstraints = strategies.getConstraints('balanced');
      const cheapConstraints = strategies.getConstraints('cheap');

      expect(cheapConstraints.minQuality).toBeLessThan(balancedConstraints.minQuality);
    });
  });

  describe('Strategy Comparison', () => {
    test('should compare all strategies', () => {
      const compared = strategies.compareAll();
      expect(Array.isArray(compared)).toBe(true);
      expect(compared.length).toBe(4);
      expect(compared.map(s => s.name)).toEqual([
        'cheap',
        'balanced',
        'premium',
        'hybrid',
      ]);
    });

    test('all strategies should have different cost focus', () => {
      const compared = strategies.compareAll();
      const costWeights = compared.map(s => s.weights.cost);
      const unique = new Set(costWeights);
      expect(unique.size).toBeGreaterThan(1); // At least some variation
    });
  });

  describe('All Available Strategies', () => {
    test('should return all strategy names', () => {
      const all = strategies.getAllStrategies();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(4);
      expect(all).toContain('cheap');
      expect(all).toContain('balanced');
      expect(all).toContain('premium');
      expect(all).toContain('hybrid');
    });
  });
});
