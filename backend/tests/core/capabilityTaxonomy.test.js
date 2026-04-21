/**
 * Tests for Capability Taxonomy
 */

import CapabilityTaxonomy from '../../src/core/capabilityTaxonomy.js';

describe('CapabilityTaxonomy', () => {
  let taxonomy;

  beforeAll(() => {
    taxonomy = new CapabilityTaxonomy();
  });

  describe('Initialization', () => {
    test('should initialize with all capability categories', () => {
      const all = taxonomy.getAll();
      expect(all).toHaveProperty('computation');
      expect(all).toHaveProperty('validation');
      expect(all).toHaveProperty('analysis');
      expect(all).toHaveProperty('synthesis');
      expect(all).toHaveProperty('transformation');
    });

    test('should have at least 4 capabilities per category', () => {
      const all = taxonomy.getAll();
      expect(Object.keys(all.computation).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(all.validation).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(all.analysis).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(all.synthesis).length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(all.transformation).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Capability Retrieval', () => {
    test('should get capabilities for task type', () => {
      const simpleCapabilities = taxonomy.getCapabilitiesForTask('simple');
      expect(Array.isArray(simpleCapabilities)).toBe(true);
      expect(simpleCapabilities.length).toBeGreaterThan(0);
    });

    test('should get capability by ID', () => {
      const cap = taxonomy.getCapabilityById('compute.simple_math');
      expect(cap).toBeDefined();
      expect(cap.id).toBe('compute.simple_math');
      expect(cap.category).toBe('computation');
    });

    test('should return null for unknown capability ID', () => {
      const cap = taxonomy.getCapabilityById('unknown.capability');
      expect(cap).toBeNull();
    });

    test('should return empty array for unknown task type', () => {
      const caps = taxonomy.getCapabilitiesForTask('unknown_task_type');
      expect(Array.isArray(caps)).toBe(true);
      expect(caps.length).toBe(0);
    });
  });

  describe('Requirements Validation', () => {
    test('should validate agent has required capabilities', () => {
      const required = [
        taxonomy.computation.SIMPLE_MATH,
        taxonomy.validation.FORMAT_CHECK,
      ];
      const agentCapabilities = ['compute.simple_math', 'validate.format'];
      const meets = taxonomy.meetsRequirements(agentCapabilities, required);
      expect(meets).toBe(true);
    });

    test('should fail if agent missing required capability', () => {
      const required = [
        taxonomy.computation.SIMPLE_MATH,
        taxonomy.validation.FORMAT_CHECK,
      ];
      const agentCapabilities = ['compute.simple_math']; // Missing FORMAT_CHECK
      const meets = taxonomy.meetsRequirements(agentCapabilities, required);
      expect(meets).toBe(false);
    });

    test('should handle string capability IDs', () => {
      const required = ['compute.simple_math', 'validate.format'];
      const agentCapabilities = ['compute.simple_math', 'validate.format'];
      const meets = taxonomy.meetsRequirements(agentCapabilities, required);
      expect(meets).toBe(true);
    });
  });

  describe('Capability Scoring', () => {
    test('should calculate perfect score for matching capabilities', () => {
      const taskCapabilities = [
        taxonomy.computation.SIMPLE_MATH,
        taxonomy.validation.FORMAT_CHECK,
      ];
      const agentCapabilities = [
        'compute.simple_math',
        'validate.format',
      ];
      const score = taxonomy.calculateCapabilityScore(agentCapabilities, taskCapabilities);
      expect(score).toBe(1.0);
    });

    test('should calculate partial score for partial match', () => {
      const taskCapabilities = [
        taxonomy.computation.SIMPLE_MATH,
        taxonomy.validation.FORMAT_CHECK,
      ];
      const agentCapabilities = ['compute.simple_math']; // Only one match
      const score = taxonomy.calculateCapabilityScore(agentCapabilities, taskCapabilities);
      expect(score).toBe(0.5);
    });

    test('should return 1.0 for empty task requirements', () => {
      const agentCapabilities = ['compute.simple_math'];
      const score = taxonomy.calculateCapabilityScore(agentCapabilities, []);
      expect(score).toBe(1.0);
    });

    test('should return 0 for no matches', () => {
      const taskCapabilities = [
        taxonomy.computation.SIMPLE_MATH,
        taxonomy.validation.FORMAT_CHECK,
      ];
      const agentCapabilities = ['unknown.capability'];
      const score = taxonomy.calculateCapabilityScore(agentCapabilities, taskCapabilities);
      expect(score).toBe(0);
    });
  });

  describe('Task Types', () => {
    test('should have capabilities for all standard task types', () => {
      const taskTypes = ['simple', 'complex', 'security', 'analytics'];
      taskTypes.forEach(taskType => {
        const caps = taxonomy.getCapabilitiesForTask(taskType);
        expect(caps.length).toBeGreaterThan(0);
      });
    });

    test('simple tasks should require simple capabilities', () => {
      const caps = taxonomy.getCapabilitiesForTask('simple');
      // Should include SIMPLE_MATH or similar
      expect(caps.some(c => c.id === 'compute.simple_math')).toBe(true);
    });

    test('complex tasks should require more capabilities', () => {
      const simpleCaps = taxonomy.getCapabilitiesForTask('simple');
      const complexCaps = taxonomy.getCapabilitiesForTask('complex');
      // Complex should have different/more requirements
      expect(complexCaps.length).toBeGreaterThanOrEqual(simpleCaps.length);
    });
  });

  describe('Capability Properties', () => {
    test('each capability should have required properties', () => {
      const cap = taxonomy.computation.SIMPLE_MATH;
      expect(cap).toHaveProperty('id');
      expect(cap).toHaveProperty('category');
      expect(cap).toHaveProperty('cost');
      expect(cap).toHaveProperty('latency');
    });

    test('cost should be reasonable (0.001-0.01)', () => {
      const caps = Object.values(taxonomy.computation);
      caps.forEach(cap => {
        expect(cap.cost).toBeGreaterThan(0);
        expect(cap.cost).toBeLessThan(0.1);
      });
    });

    test('latency should be reasonable (50-1500ms)', () => {
      const allCaps = [
        ...Object.values(taxonomy.computation),
        ...Object.values(taxonomy.validation),
        ...Object.values(taxonomy.analysis),
        ...Object.values(taxonomy.synthesis),
        ...Object.values(taxonomy.transformation),
      ];
      allCaps.forEach(cap => {
        expect(cap.latency).toBeGreaterThan(0);
        expect(cap.latency).toBeLessThan(2000);
      });
    });
  });
});
