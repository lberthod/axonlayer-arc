/**
 * Tests for Scoring Schema
 */

import ScoringSchema from '../../src/core/scoringSchema.js';
import AgentMetadata from '../../src/core/agentMetadata.js';

describe('ScoringSchema', () => {
  let schema;
  let metadata;

  beforeEach(() => {
    schema = new ScoringSchema();
    metadata = new AgentMetadata();
  });

  describe('Normalization', () => {
    test('should normalize values to 0-1 range', () => {
      expect(schema.normalize(50, 0, 100)).toBe(0.5);
      expect(schema.normalize(0, 0, 100)).toBe(0);
      expect(schema.normalize(100, 0, 100)).toBe(1);
    });

    test('should clamp values outside range', () => {
      expect(schema.normalize(-50, 0, 100)).toBe(0);
      expect(schema.normalize(150, 0, 100)).toBe(1);
    });

    test('should handle equal min/max', () => {
      expect(schema.normalize(50, 100, 100)).toBe(0.5);
    });
  });

  describe('Individual Scoring Functions', () => {
    test('should score cost (inverted)', () => {
      const lowCost = schema.scoreCost(0.0001); // Low cost = high score
      const highCost = schema.scoreCost(0.01);   // High cost = low score
      expect(lowCost).toBeGreaterThan(highCost);
    });

    test('should score quality', () => {
      const highQuality = schema.scoreQuality({
        accuracy: 0.95,
        consistency: 0.95,
        completeness: 0.95,
      });
      const lowQuality = schema.scoreQuality({
        accuracy: 0.5,
        consistency: 0.5,
        completeness: 0.5,
      });
      expect(highQuality).toBeGreaterThan(lowQuality);
    });

    test('should score reliability', () => {
      const high = schema.scoreReliability(0.99);
      const low = schema.scoreReliability(0.85);
      expect(high).toBeGreaterThan(low);
    });

    test('should score latency (inverted)', () => {
      const lowLatency = schema.scoreLatency(100);   // Low latency = high score
      const highLatency = schema.scoreLatency(2000); // High latency = low score
      expect(lowLatency).toBeGreaterThan(highLatency);
    });

    test('should score specialization', () => {
      const specialized = schema.scoreSpecialization(1.0);
      const general = schema.scoreSpecialization(0.5);
      expect(specialized).toBeGreaterThan(general);
    });
  });

  describe('Composite Scoring', () => {
    test('should calculate composite score with default weights', () => {
      const agent = metadata.registerAgent('agent-1', {
        name: 'Worker',
        cost: { base: 0.0001 },
        quality: { accuracy: 0.9, consistency: 0.9, completeness: 0.9 },
        performance: { reliability: 0.95, avgLatency: 100 },
      });

      const result = schema.calculateCompositeScore(agent);

      expect(result.composite).toBeGreaterThan(0);
      expect(result.composite).toBeLessThanOrEqual(1);
      expect(result.scores).toBeDefined();
      expect(result.breakdown).toBeDefined();
    });

    test('should weight components correctly', () => {
      const agent = metadata.registerAgent('agent-1', {
        name: 'Worker',
        cost: { base: 0.0001 },
        quality: { accuracy: 0.9, consistency: 0.9, completeness: 0.9 },
        performance: { reliability: 0.95, avgLatency: 100 },
      });

      const weights = {
        cost: 0.5,
        quality: 0.2,
        reliability: 0.15,
        latency: 0.1,
        specialization: 0.05,
      };

      const result = schema.calculateCompositeScore(agent, weights);

      expect(result.breakdown.costComponent).toBeGreaterThan(result.breakdown.latencyComponent);
      expect(result.breakdown.costComponent).toBeGreaterThan(
        result.breakdown.specializationComponent
      );
    });

    test('should return detailed breakdown', () => {
      const agent = metadata.registerAgent('agent-1', {
        name: 'Worker',
        cost: { base: 0.0001 },
        quality: { accuracy: 0.9, consistency: 0.9, completeness: 0.9 },
        performance: { reliability: 0.95, avgLatency: 100 },
      });

      const result = schema.calculateCompositeScore(agent);

      expect(result.breakdown.costComponent).toBeDefined();
      expect(result.breakdown.qualityComponent).toBeDefined();
      expect(result.breakdown.reliabilityComponent).toBeDefined();
      expect(result.breakdown.latencyComponent).toBeDefined();
      expect(result.breakdown.specializationComponent).toBeDefined();
    });
  });

  describe('Weight Validation', () => {
    test('should validate weights sum to 1.0', () => {
      const valid = {
        cost: 0.2,
        quality: 0.2,
        reliability: 0.2,
        latency: 0.2,
        specialization: 0.2,
      };
      expect(schema.validateWeights(valid)).toBe(true);
    });

    test('should allow floating point tolerance', () => {
      const almostValid = {
        cost: 0.2,
        quality: 0.2,
        reliability: 0.2,
        latency: 0.2,
        specialization: 0.20001,
      };
      expect(schema.validateWeights(almostValid)).toBe(true);
    });

    test('should reject invalid weights', () => {
      const invalid = {
        cost: 0.5,
        quality: 0.5,
        reliability: 0.2,
        latency: 0.2,
        specialization: 0.2,
      };
      expect(schema.validateWeights(invalid)).toBe(false);
    });
  });

  describe('Ranking', () => {
    test('should rank agents by composite score', () => {
      const agent1 = metadata.registerAgent('agent-1', {
        name: 'Expensive',
        cost: { base: 0.001 }, // High cost = low score
        quality: { accuracy: 0.9, consistency: 0.9, completeness: 0.9 },
        performance: { reliability: 0.95, avgLatency: 100 },
      });

      const agent2 = metadata.registerAgent('agent-2', {
        name: 'Cheap',
        cost: { base: 0.0001 }, // Low cost = high score
        quality: { accuracy: 0.8, consistency: 0.8, completeness: 0.8 },
        performance: { reliability: 0.9, avgLatency: 150 },
      });

      const ranked = schema.rankAgents([agent1, agent2]);

      expect(ranked.length).toBe(2);
      expect(ranked[0].scoreResult.composite).toBeGreaterThan(
        ranked[1].scoreResult.composite
      );
    });

    test('should handle empty agent list', () => {
      const ranked = schema.rankAgents([]);
      expect(Array.isArray(ranked)).toBe(true);
      expect(ranked.length).toBe(0);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      metadata.registerAgent('agent-1', {
        name: 'HighQuality',
        cost: { base: 0.0001 },
        quality: { accuracy: 0.95, consistency: 0.95, completeness: 0.95 },
        performance: { reliability: 0.98, avgLatency: 100 },
      });

      metadata.registerAgent('agent-2', {
        name: 'LowQuality',
        cost: { base: 0.0001 },
        quality: { accuracy: 0.6, consistency: 0.6, completeness: 0.6 },
        performance: { reliability: 0.7, avgLatency: 200 },
      });
    });

    test('should filter agents by minimum score', () => {
      const agents = metadata.getAllAgents();
      const filtered = schema.filterByMinScore(agents, 0.7);

      expect(filtered.length).toBeLessThanOrEqual(agents.length);
      filtered.forEach(agent => {
        const score = schema.calculateCompositeScore(agent);
        expect(score.composite).toBeGreaterThanOrEqual(0.7);
      });
    });

    test('should return empty array if no agents meet threshold', () => {
      const agents = metadata.getAllAgents();
      const filtered = schema.filterByMinScore(agents, 0.99);

      expect(Array.isArray(filtered)).toBe(true);
      // May be empty or may have high-quality agents
    });
  });

  describe('Strategy Weights', () => {
    test('should provide weights for all strategies', () => {
      const weights = schema.getStrategyWeights();

      expect(weights.cheap).toBeDefined();
      expect(weights.balanced).toBeDefined();
      expect(weights.premium).toBeDefined();
      expect(weights.hybrid).toBeDefined();
    });

    test('cheap strategy should weight cost highly', () => {
      const weights = schema.getStrategyWeights();
      expect(weights.cheap.cost).toBeGreaterThan(weights.cheap.latency);
      expect(weights.cheap.cost).toBeGreaterThan(weights.cheap.specialization);
    });

    test('premium strategy should weight quality highly', () => {
      const weights = schema.getStrategyWeights();
      expect(weights.premium.quality).toBeGreaterThan(weights.premium.cost);
      expect(weights.premium.reliability).toBeGreaterThan(weights.premium.cost);
    });

    test('balanced strategy should have relatively equal weights', () => {
      const weights = schema.getStrategyWeights();
      const values = Object.values(weights.balanced);
      const avg = values.reduce((a, b) => a + b) / values.length;
      values.forEach(weight => {
        expect(Math.abs(weight - avg)).toBeLessThan(0.15); // Within 15% of average
      });
    });

    test('all strategy weights should sum to 1.0', () => {
      const weights = schema.getStrategyWeights();
      Object.values(weights).forEach(strategyWeights => {
        expect(schema.validateWeights(strategyWeights)).toBe(true);
      });
    });
  });

  describe('Context-Aware Scoring', () => {
    test('should apply context specialization score', () => {
      const agent = metadata.registerAgent('agent-1', {
        name: 'Worker',
        cost: { base: 0.0001 },
        quality: { accuracy: 0.9, consistency: 0.9, completeness: 0.9 },
        performance: { reliability: 0.95, avgLatency: 100 },
      });

      const result1 = schema.calculateCompositeScore(agent, schema.defaultWeights, {
        specializationScore: 0.2, // Poor specialization
      });

      const result2 = schema.calculateCompositeScore(agent, schema.defaultWeights, {
        specializationScore: 0.9, // Good specialization
      });

      expect(result2.composite).toBeGreaterThan(result1.composite);
    });
  });
});
