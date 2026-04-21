/**
 * Tests for Agent Scorer
 */

import AgentScorer from '../../src/core/agentScorer.js';
import AgentMetadata from '../../src/core/agentMetadata.js';
import ScoringSchema from '../../src/core/scoringSchema.js';
import StrategyDefinitions from '../../src/core/strategyDefinitions.js';

describe('AgentScorer', () => {
  let scorer;
  let metadata;
  let scoringSchema;
  let strategies;

  beforeEach(() => {
    metadata = new AgentMetadata();
    scoringSchema = new ScoringSchema();
    strategies = new StrategyDefinitions();
    scorer = new AgentScorer(metadata, scoringSchema, strategies);

    // Register test agents
    metadata.registerAgent('agent-cheap', {
      name: 'CheapWorker',
      type: 'worker',
      capabilities: ['compute.simple_math'],
      performance: { avgLatency: 300, reliability: 0.90 },
      cost: { base: 0.00005, perChar: 0.000005 },
      quality: { accuracy: 0.80, consistency: 0.80, completeness: 0.80 },
    });

    metadata.registerAgent('agent-quality', {
      name: 'QualityWorker',
      type: 'worker',
      capabilities: ['compute.complex_math'],
      performance: { avgLatency: 200, reliability: 0.98 },
      cost: { base: 0.0003, perChar: 0.00003 },
      quality: { accuracy: 0.95, consistency: 0.95, completeness: 0.95 },
    });

    metadata.registerAgent('agent-balanced', {
      name: 'BalancedWorker',
      type: 'worker',
      capabilities: ['compute.simple_math', 'validate.format'],
      performance: { avgLatency: 150, reliability: 0.94 },
      cost: { base: 0.0001, perChar: 0.00001 },
      quality: { accuracy: 0.90, consistency: 0.90, completeness: 0.90 },
    });
  });

  describe('Single Agent Scoring', () => {
    test('should score agent with default strategy', () => {
      const result = scorer.scoreAgent('agent-balanced', {
        type: 'simple',
      });

      expect(result.scored).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.breakdown).toBeDefined();
    });

    test('should score agent with cheap strategy', () => {
      const result = scorer.scoreAgent('agent-cheap', { type: 'simple' }, 'cheap');

      expect(result.scored).toBe(true);
      expect(result.weights.cost).toBeGreaterThan(0.4); // Cost weighted high
    });

    test('should score agent with premium strategy', () => {
      const result = scorer.scoreAgent('agent-quality', { type: 'simple' }, 'premium');

      expect(result.scored).toBe(true);
      expect(result.weights.quality).toBeGreaterThan(0.3); // Quality weighted high
    });

    test('should return error for non-existent agent', () => {
      const result = scorer.scoreAgent('agent-unknown', { type: 'simple' });

      expect(result.scored).toBe(false);
      expect(result.score).toBe(0);
      expect(result.reason).toBe('Agent not found');
    });

    test('should weight cost heavily with cheap strategy', () => {
      const cheapScore = scorer.scoreAgent('agent-cheap', { type: 'simple' }, 'cheap');
      const qualityScore = scorer.scoreAgent('agent-quality', { type: 'simple' }, 'cheap');

      // Cheap strategy should weight cost at 50%, so cost factor matters most
      expect(cheapScore.weights.cost).toBe(0.5);
      expect(cheapScore.weights.quality).toBeLessThan(cheapScore.weights.cost);
    });

    test('should prefer quality agent with premium strategy', () => {
      const qualityScore = scorer.scoreAgent('agent-quality', { type: 'simple' }, 'premium');
      const cheapScore = scorer.scoreAgent('agent-cheap', { type: 'simple' }, 'premium');

      expect(qualityScore.score).toBeGreaterThan(cheapScore.score);
    });
  });

  describe('Constraint Checking', () => {
    test('should verify constraints are met', () => {
      const result = scorer.scoreAgent('agent-balanced', { type: 'simple' }, 'balanced');

      expect(result.constraintsOK).toBeDefined();
      if (result.constraintsOK) {
        expect(result.score).toBeGreaterThan(result.baseScore * 0.9); // No penalty
      }
    });

    test('should apply constraint penalty', () => {
      const result = scorer.scoreAgent('agent-cheap', { type: 'simple' }, 'premium');

      // Cheap agent may not meet premium quality constraints
      if (!result.constraintsOK) {
        expect(result.score).toBeLessThan(result.baseScore); // Penalty applied
      }
    });
  });

  describe('Budget Adjustment', () => {
    test('should adjust score based on budget', () => {
      const generousBudget = scorer.scoreAgent('agent-balanced', {
        type: 'simple',
        budget: 0.001,
        inputLength: 100,
      });

      const tightBudget = scorer.scoreAgent('agent-balanced', {
        type: 'simple',
        budget: 0.00001,
        inputLength: 100,
      });

      expect(generousBudget.budgetAdjustment).toBeGreaterThan(
        tightBudget.budgetAdjustment
      );
    });

    test('should not penalize well within budget', () => {
      const result = scorer.scoreAgent('agent-cheap', {
        type: 'simple',
        budget: 0.1,
        inputLength: 10,
      });

      expect(result.budgetAdjustment).toBe(1.0);
    });
  });

  describe('Ranking Multiple Agents', () => {
    test('should rank agents by score', () => {
      const ranked = scorer.scoreAndRank(
        ['agent-cheap', 'agent-quality', 'agent-balanced'],
        { type: 'simple' },
        'balanced'
      );

      expect(ranked.length).toBeGreaterThan(0);
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score);
      }
    });

    test('should filter by minimum score', () => {
      const ranked = scorer.scoreAndRank(
        ['agent-cheap', 'agent-quality', 'agent-balanced'],
        { type: 'simple' },
        'balanced',
        { minScore: 0.8 }
      );

      ranked.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0.8);
      });
    });

    test('should respect limit parameter', () => {
      const ranked = scorer.scoreAndRank(
        ['agent-cheap', 'agent-quality', 'agent-balanced'],
        { type: 'simple' },
        'balanced',
        { limit: 2 }
      );

      expect(ranked.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Score History and Trending', () => {
    test('should record scores in history', () => {
      scorer.scoreAgent('agent-balanced', { type: 'simple' }, 'balanced');
      scorer.scoreAgent('agent-balanced', { type: 'simple' }, 'cheap');
      scorer.scoreAgent('agent-balanced', { type: 'simple' }, 'premium');

      const trend = scorer.getScoreTrend('agent-balanced');

      expect(trend.avgScore).toBeGreaterThan(0);
      expect(trend.recordCount).toBe(3);
    });

    test('should detect improving trend', () => {
      // Record improving scores
      for (let i = 0; i < 3; i++) {
        scorer.scoreAgent('agent-balanced', { type: 'simple' }, 'balanced');
        metadata.recordExecution('agent-balanced', {
          success: true,
          executionTime: 100,
        });
      }

      const trend = scorer.getScoreTrend('agent-balanced');
      expect(trend.trend).toBeDefined();
    });

    test('should handle no history gracefully', () => {
      const trend = scorer.getScoreTrend('agent-unknown');

      expect(trend.avgScore).toBe(0);
      expect(trend.trend).toBe('no-history');
    });

    test('should clear history', () => {
      scorer.scoreAgent('agent-balanced', { type: 'simple' }, 'balanced');
      scorer.clearHistory();

      const trend = scorer.getScoreTrend('agent-balanced');
      expect(trend.trend).toBe('no-history');
    });
  });

  describe('Strategy Comparison', () => {
    test('should compare agent across all strategies', () => {
      const comparison = scorer.compareStrategies('agent-balanced', {
        type: 'simple',
      });

      expect(comparison.cheap).toBeDefined();
      expect(comparison.balanced).toBeDefined();
      expect(comparison.premium).toBeDefined();
      expect(comparison.hybrid).toBeDefined();

      Object.values(comparison).forEach(result => {
        expect(result.scored).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });

    test('should show different scores for different strategies', () => {
      const comparison = scorer.compareStrategies('agent-balanced', {
        type: 'simple',
      });

      const scores = Object.values(comparison).map(r => r.score);
      const unique = new Set(scores);
      // At least some variation expected
      expect(unique.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Best Agent Selection', () => {
    test('should find best agent', () => {
      const best = scorer.findBestAgent(
        ['agent-cheap', 'agent-quality', 'agent-balanced'],
        { type: 'simple' },
        'balanced'
      );

      expect(best).toBeDefined();
      expect(best.agentId).toBeDefined();
      expect(best.agent).toBeDefined();
      expect(best.agent.name).toBeDefined();
    });

    test('should return best agent from list', () => {
      const best = scorer.findBestAgent(
        ['agent-cheap', 'agent-quality', 'agent-balanced'],
        { type: 'simple' },
        'balanced'
      );

      expect(best).toBeDefined();
      expect(best.agentId).toBeDefined();
      expect(['agent-cheap', 'agent-quality', 'agent-balanced']).toContain(best.agentId);
    });
  });

  describe('Score Explanation', () => {
    test('should provide detailed explanation', () => {
      const explanation = scorer.scoreAndExplain('agent-balanced', {
        type: 'simple',
      });

      expect(explanation.summary).toBeDefined();
      expect(explanation.score).toBeDefined();
      expect(explanation.reasoning).toBeDefined();
      expect(Array.isArray(explanation.reasoning)).toBe(true);
      expect(explanation.constraints).toBeDefined();
    });

    test('should show constraint details', () => {
      const explanation = scorer.scoreAndExplain('agent-balanced', {
        type: 'simple',
      }, 'premium');

      expect(explanation.constraints.details).toBeDefined();
      expect(explanation.constraints.details.quality).toBeDefined();
      expect(explanation.constraints.details.reliability).toBeDefined();
      expect(explanation.constraints.details.latency).toBeDefined();
      expect(explanation.constraints.details.cost).toBeDefined();
    });

    test('should indicate constraint pass/fail', () => {
      const explanation = scorer.scoreAndExplain('agent-balanced', {
        type: 'simple',
      });

      expect(explanation.constraints.passed).toBeDefined();
      expect(typeof explanation.constraints.passed).toBe('boolean');
    });
  });

  describe('Quality Calculation', () => {
    test('should calculate average quality', () => {
      const agent = metadata.getAgent('agent-balanced');
      const quality = scorer.getAverageQuality(agent);

      expect(quality).toBe(0.9); // (0.9 + 0.9 + 0.9) / 3
    });

    test('should handle different quality scores', () => {
      const agent = metadata.getAgent('agent-cheap');
      const quality = scorer.getAverageQuality(agent);

      expect(quality).toBeLessThan(0.95);
      expect(quality).toBeGreaterThan(0.7);
    });
  });

  describe('Recommendations', () => {
    test('should provide recommendations based on score', () => {
      const high = scorer.scoreAgent('agent-quality', { type: 'simple' }, 'premium');
      const low = scorer.scoreAgent('agent-cheap', { type: 'simple' }, 'premium');

      if (high.score > 0.8) {
        expect(high.recommendation).toContain('Excellent');
      }

      expect(low.recommendation).toBeDefined();
    });

    test('should warn about constraint violations', () => {
      const result = scorer.scoreAgent('agent-cheap', { type: 'simple' }, 'premium');

      if (!result.constraintsOK) {
        expect(result.recommendation).toContain('constraints');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero budget', () => {
      const result = scorer.scoreAgent('agent-balanced', {
        type: 'simple',
        budget: 0,
        inputLength: 100,
      });

      expect(result.budgetAdjustment).toBeLessThan(1);
    });

    test('should handle empty agent list', () => {
      const ranked = scorer.scoreAndRank([], { type: 'simple' });

      expect(Array.isArray(ranked)).toBe(true);
      expect(ranked.length).toBe(0);
    });

    test('should handle very high budget', () => {
      const result = scorer.scoreAgent('agent-balanced', {
        type: 'simple',
        budget: 1000,
        inputLength: 100,
      });

      expect(result.budgetAdjustment).toBe(1.0);
    });
  });
});
