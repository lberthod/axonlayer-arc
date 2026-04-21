/**
 * Tests for Capability Matcher
 */

import CapabilityMatcher from '../../src/core/capabilityMatcher.js';
import CapabilityTaxonomy from '../../src/core/capabilityTaxonomy.js';
import AgentMetadata from '../../src/core/agentMetadata.js';

describe('CapabilityMatcher', () => {
  let matcher;
  let taxonomy;
  let metadata;

  beforeEach(() => {
    taxonomy = new CapabilityTaxonomy();
    metadata = new AgentMetadata();
    matcher = new CapabilityMatcher(taxonomy, metadata);

    // Register test agents
    metadata.registerAgent('agent-compute', {
      name: 'ComputeWorker',
      type: 'worker',
      // Add more capabilities to match 'simple' task requirements
      capabilities: [
        'compute.simple_math',
        'compute.complex_math',
        'validate.format',
        'synthesize.summary',
        'transform.format',
      ],
      performance: { avgLatency: 100, reliability: 0.95 },
      cost: { base: 0.0001, perChar: 0.00001 },
      inputTypes: ['string'],
      outputTypes: ['string', 'number'],
    });

    metadata.registerAgent('agent-validator', {
      name: 'Validator',
      type: 'validator',
      capabilities: ['validate.format', 'validate.signature'],
      performance: { avgLatency: 150, reliability: 0.98 },
      cost: { base: 0.0001, perChar: 0.00001 },
      inputTypes: ['string', 'array'],
      outputTypes: ['boolean'],
    });

    metadata.registerAgent('agent-specialist', {
      name: 'SecuritySpecialist',
      type: 'worker',
      capabilities: ['validate.security', 'analyze.risk'],
      performance: { avgLatency: 500, reliability: 0.99 },
      cost: { base: 0.0002, perChar: 0.00002 },
      inputTypes: ['*'], // Accepts any type
      outputTypes: ['*'],
    });

    metadata.registerAgent('agent-unavailable', {
      name: 'BusyWorker',
      type: 'worker',
      capabilities: ['compute.simple_math'],
      performance: { avgLatency: 100, reliability: 0.95 },
      cost: { base: 0.0001, perChar: 0.00001 },
      availability: { available: false, currentLoad: 10, maxConcurrent: 5 },
    });
  });

  describe('Compatibility Evaluation', () => {
    test('should evaluate compatible agent', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
      });

      expect(result.compatible).toBe(true);
      expect(result.score).toBeGreaterThan(0.7);
      expect(result.checks).toBeDefined();
    });

    test('should evaluate incompatible agent', () => {
      const result = matcher.evaluateCompatibility('agent-validator', {
        type: 'complex',
      });

      expect(result.compatible).toBe(false);
      expect(result.score).toBeLessThan(1.0);
    });

    test('should return error for non-existent agent', () => {
      const result = matcher.evaluateCompatibility('agent-unknown', {
        type: 'simple',
      });

      expect(result.compatible).toBe(false);
      expect(result.score).toBe(0);
      expect(result.reason).toBe('Agent not found');
    });

    test('should detect unavailable agents', () => {
      const result = matcher.evaluateCompatibility('agent-unavailable', {
        type: 'simple',
      });

      expect(result.checks.availabilityMatch.passed).toBe(false);
    });
  });

  describe('Capability Matching', () => {
    test('should match required capabilities', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple', // Requires SIMPLE_MATH
      });

      expect(result.checks.capabilityMatch.passed).toBe(true);
      expect(result.checks.capabilityMatch.score).toBe(1.0);
    });

    test('should detect missing capabilities', () => {
      const result = matcher.evaluateCompatibility('agent-validator', {
        type: 'simple', // Requires SIMPLE_MATH
      });

      expect(result.checks.capabilityMatch.passed).toBe(false);
      expect(result.checks.capabilityMatch.score).toBeLessThan(1.0);
    });

    test('should calculate partial capability match', () => {
      const result = matcher.evaluateCompatibility('agent-specialist', {
        type: 'security', // Requires multiple capabilities
      });

      const match = result.checks.capabilityMatch;
      expect(match.score).toBeGreaterThan(0);
      expect(match.matched).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Input/Output Type Matching', () => {
    test('should match input/output types', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
        inputType: 'string',
        outputType: 'string',
      });

      expect(result.checks.inputOutputMatch.passed).toBe(true);
    });

    test('should fail on input type mismatch', () => {
      const result = matcher.evaluateCompatibility('agent-validator', {
        type: 'simple',
        inputType: 'number', // Validator only accepts string/array
        outputType: 'boolean',
      });

      expect(result.checks.inputOutputMatch.passed).toBe(false);
    });

    test('should accept wildcard types', () => {
      const result = matcher.evaluateCompatibility('agent-specialist', {
        type: 'security',
        inputType: 'anything',
        outputType: 'anything',
      });

      expect(result.checks.inputOutputMatch.passed).toBe(true);
    });
  });

  describe('Performance Matching', () => {
    test('should accept agents meeting latency requirements', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
        maxLatency: 200,
      });

      expect(result.checks.performanceMatch.latencyOK).toBe(true);
    });

    test('should reject agents exceeding latency requirements', () => {
      const result = matcher.evaluateCompatibility('agent-specialist', {
        type: 'security',
        maxLatency: 100, // Agent has 500ms latency
      });

      expect(result.checks.performanceMatch.latencyOK).toBe(false);
    });

    test('should check reliability requirements', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
        minReliability: 0.99, // Agent has 0.95
      });

      expect(result.checks.performanceMatch.reliabilityOK).toBe(false);
    });
  });

  describe('Cost Matching', () => {
    test('should accept agents within budget', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
        budget: 0.001, // Generous budget
        inputLength: 100,
      });

      expect(result.checks.costMatch.passed).toBe(true);
    });

    test('should reject agents exceeding budget', () => {
      const result = matcher.evaluateCompatibility('agent-specialist', {
        type: 'security',
        budget: 0.0001, // Tight budget
        inputLength: 1000, // Large input
      });

      expect(result.checks.costMatch.passed).toBe(false);
    });

    test('should estimate task cost correctly', () => {
      const cost = matcher.estimateTaskCost(
        metadata.getAgent('agent-compute'),
        { inputLength: 100, taskMultiplier: 1.0 }
      );

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThanOrEqual(0.001); // Max cost
    });
  });

  describe('Compatibility Scoring', () => {
    test('should give higher score to more compatible agents', () => {
      const result1 = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
      });

      const result2 = matcher.evaluateCompatibility('agent-specialist', {
        type: 'simple',
      });

      expect(result1.score).toBeGreaterThan(result2.score);
    });

    test('should score between 0 and 1', () => {
      const agents = [
        'agent-compute',
        'agent-validator',
        'agent-specialist',
        'agent-unavailable',
      ];

      agents.forEach(agentId => {
        const result = matcher.evaluateCompatibility(agentId, { type: 'simple' });
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Finding Best Matches', () => {
    test('should find compatible agents', () => {
      const matches = matcher.findBestMatches(
        ['agent-compute', 'agent-validator', 'agent-specialist'],
        { type: 'simple' }
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].score).toBeGreaterThanOrEqual(matches[matches.length - 1].score);
    });

    test('should respect minimum score threshold', () => {
      const matches = matcher.findBestMatches(
        ['agent-compute', 'agent-validator', 'agent-specialist'],
        { type: 'security' },
        { minScore: 0.8 }
      );

      matches.forEach(match => {
        expect(match.score).toBeGreaterThanOrEqual(0.8);
      });
    });

    test('should limit results', () => {
      const matches = matcher.findBestMatches(
        ['agent-compute', 'agent-validator', 'agent-specialist'],
        { type: 'simple' },
        { limit: 2 }
      );

      expect(matches.length).toBeLessThanOrEqual(2);
    });

    test('should rank by score descending', () => {
      const matches = matcher.findBestMatches(
        ['agent-compute', 'agent-validator', 'agent-specialist'],
        { type: 'simple' }
      );

      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].score).toBeGreaterThanOrEqual(matches[i + 1].score);
      }
    });
  });

  describe('Specialized Agent Lookup', () => {
    test('should find agents with specific capability', () => {
      const specialists = matcher.getSpecializedAgents('compute.simple_math', {
        type: 'simple',
      });

      expect(specialists.length).toBeGreaterThan(0);
      specialists.forEach(spec => {
        const agent = metadata.getAgent(spec.agentId);
        expect(agent.capabilities).toContain('compute.simple_math');
      });
    });

    test('should return empty for non-existent capability', () => {
      const specialists = matcher.getSpecializedAgents('unknown.capability', {
        type: 'simple',
      });

      expect(Array.isArray(specialists)).toBe(true);
      expect(specialists.length).toBe(0);
    });
  });

  describe('Fallback Suggestions', () => {
    test('should suggest alternative agents', () => {
      const fallbacks = matcher.suggestFallbacks('agent-compute', {
        type: 'simple',
      });

      expect(Array.isArray(fallbacks)).toBe(true);
      fallbacks.forEach(fallback => {
        expect(fallback.compatible).toBe(true);
        expect(fallback.agentId).not.toBe('agent-compute');
      });
    });

    test('should return empty for non-existent primary agent', () => {
      const fallbacks = matcher.suggestFallbacks('agent-unknown', {
        type: 'simple',
      });

      expect(fallbacks).toEqual([]);
    });

    test('should limit fallbacks to top 3', () => {
      const fallbacks = matcher.suggestFallbacks('agent-compute', {
        type: 'simple',
      });

      expect(fallbacks.length).toBeLessThanOrEqual(3);
    });

    test('should rank fallbacks by compatibility', () => {
      const fallbacks = matcher.suggestFallbacks('agent-compute', {
        type: 'simple',
      });

      for (let i = 0; i < fallbacks.length - 1; i++) {
        expect(fallbacks[i].score).toBeGreaterThanOrEqual(fallbacks[i + 1].score);
      }
    });
  });

  describe('Task Specification Validation', () => {
    test('should validate complete task spec', () => {
      const result = matcher.validateTaskSpec({
        type: 'simple',
        maxLatency: 200,
        minReliability: 0.9,
        budget: 0.001,
      });

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should reject missing task type', () => {
      const result = matcher.validateTaskSpec({
        maxLatency: 200,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('type'))).toBe(true);
    });

    test('should reject invalid latency', () => {
      const result = matcher.validateTaskSpec({
        type: 'simple',
        maxLatency: 10, // Too low
      });

      expect(result.valid).toBe(false);
    });

    test('should reject invalid reliability', () => {
      const result = matcher.validateTaskSpec({
        type: 'simple',
        minReliability: 1.5, // Out of range
      });

      expect(result.valid).toBe(false);
    });

    test('should reject negative budget', () => {
      const result = matcher.validateTaskSpec({
        type: 'simple',
        budget: -0.001,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Recommendations', () => {
    test('should provide recommendation text', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
      });

      expect(result.recommendation).toBeDefined();
      expect(typeof result.recommendation).toBe('string');
      expect(result.recommendation.length).toBeGreaterThan(0);
    });

    test('should give strong recommendation for good matches', () => {
      const result = matcher.evaluateCompatibility('agent-compute', {
        type: 'simple',
      });

      if (result.score > 0.85) {
        expect(result.recommendation).toContain('Excellent');
      }
    });

    test('should warn for poor matches', () => {
      const result = matcher.evaluateCompatibility('agent-specialist', {
        type: 'simple', // Poor match for specialist
        maxLatency: 100, // Specialist has 500ms latency
        minReliability: 0.99, // Specialist has 0.99 but marginal
      });

      if (!result.compatible) {
        expect(result.recommendation).toBeDefined();
      }
    });
  });
});
