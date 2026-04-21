/**
 * Tests for Agent Metadata Manager
 */

import AgentMetadata from '../../src/core/agentMetadata.js';

describe('AgentMetadata', () => {
  let metadata;

  beforeEach(() => {
    metadata = new AgentMetadata();
  });

  describe('Agent Registration', () => {
    test('should register agent with metadata', () => {
      const agentData = {
        name: 'TestWorker',
        type: 'worker',
        capabilities: ['compute.simple_math', 'validate.format'],
        performance: { avgLatency: 100, reliability: 0.95 },
      };

      const registered = metadata.registerAgent('agent-1', agentData);

      expect(registered).toBeDefined();
      expect(registered.id).toBe('agent-1');
      expect(registered.name).toBe('TestWorker');
      expect(registered.type).toBe('worker');
      expect(registered.metadataVersion).toBe(2);
    });

    test('should normalize all metadata fields', () => {
      const agentData = {
        name: 'Worker',
        capabilities: ['compute.simple_math'],
      };

      const registered = metadata.registerAgent('agent-1', agentData);

      expect(registered.performance).toBeDefined();
      expect(registered.cost).toBeDefined();
      expect(registered.specialization).toBeDefined();
      expect(registered.quality).toBeDefined();
      expect(registered.availability).toBeDefined();
      expect(registered.history).toBeDefined();
      expect(registered.sla).toBeDefined();
    });

    test('should set default values for missing fields', () => {
      const registered = metadata.registerAgent('agent-1', { name: 'Worker' });

      expect(registered.type).toBe('worker');
      expect(registered.inputTypes).toEqual(['string']);
      expect(registered.outputTypes).toEqual(['string']);
      expect(registered.version).toBe('1.0.0');
      expect(registered.performance.reliability).toBeGreaterThan(0);
      expect(registered.availability.available).toBe(true);
    });
  });

  describe('Agent Retrieval', () => {
    test('should get registered agent', () => {
      metadata.registerAgent('agent-1', { name: 'Worker' });
      const agent = metadata.getAgent('agent-1');

      expect(agent).toBeDefined();
      expect(agent.id).toBe('agent-1');
      expect(agent.name).toBe('Worker');
    });

    test('should return null for unregistered agent', () => {
      const agent = metadata.getAgent('unknown-agent');
      expect(agent).toBeNull();
    });

    test('should get all registered agents', () => {
      metadata.registerAgent('agent-1', { name: 'Worker1' });
      metadata.registerAgent('agent-2', { name: 'Validator1' });
      const all = metadata.getAllAgents();

      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(2);
    });
  });

  describe('Agent Update', () => {
    test('should update agent metadata', () => {
      metadata.registerAgent('agent-1', { name: 'Worker' });
      const updated = metadata.updateAgent('agent-1', {
        name: 'UpdatedWorker',
      });

      expect(updated.name).toBe('UpdatedWorker');
      expect(updated.id).toBe('agent-1');
    });

    test('should handle nested object updates', () => {
      metadata.registerAgent('agent-1', { name: 'Worker' });
      const updated = metadata.updateAgent('agent-1', {
        performance: { reliability: 0.98 },
      });

      expect(updated.performance.reliability).toBe(0.98);
      expect(updated.performance.avgLatency).toBeDefined(); // Other fields preserved
    });

    test('should return null for non-existent agent', () => {
      const updated = metadata.updateAgent('unknown', { name: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('Execution Recording', () => {
    test('should record successful execution', () => {
      metadata.registerAgent('agent-1', { name: 'Worker' });
      const agent = metadata.getAgent('agent-1');
      const initialExecutions = agent.history.totalExecutions;

      metadata.recordExecution('agent-1', {
        success: true,
        executionTime: 100,
      });

      const updated = metadata.getAgent('agent-1');
      expect(updated.history.totalExecutions).toBe(initialExecutions + 1);
      expect(updated.history.successfulExecutions).toBe(1);
    });

    test('should record failed execution', () => {
      metadata.registerAgent('agent-1', { name: 'Worker' });

      metadata.recordExecution('agent-1', {
        success: false,
        executionTime: 200,
      });

      const updated = metadata.getAgent('agent-1');
      expect(updated.history.totalExecutions).toBe(1);
      expect(updated.history.successfulExecutions).toBe(0);
    });

    test('should update average execution time', () => {
      metadata.registerAgent('agent-1', { name: 'Worker' });

      metadata.recordExecution('agent-1', { success: true, executionTime: 100 });
      metadata.recordExecution('agent-1', { success: true, executionTime: 300 });

      const updated = metadata.getAgent('agent-1');
      expect(updated.history.avgExecutionTime).toBe(200); // (100 + 300) / 2
    });

    test('should recalculate reliability after executions', () => {
      metadata.registerAgent('agent-1', { name: 'Worker' });

      metadata.recordExecution('agent-1', { success: true, executionTime: 100 });
      metadata.recordExecution('agent-1', { success: true, executionTime: 100 });
      metadata.recordExecution('agent-1', { success: false, executionTime: 100 });

      const updated = metadata.getAgent('agent-1');
      expect(updated.performance.reliability).toBeCloseTo(2 / 3, 2); // 2 successes out of 3
    });
  });

  describe('Agent Filtering', () => {
    beforeEach(() => {
      metadata.registerAgent('agent-1', {
        name: 'Worker1',
        capabilities: ['compute.simple_math', 'validate.format'],
      });
      metadata.registerAgent('agent-2', {
        name: 'Validator1',
        type: 'validator',
        capabilities: ['validate.signature'],
      });
      metadata.registerAgent('agent-3', {
        name: 'Worker2',
        capabilities: ['compute.complex_math'],
      });
    });

    test('should filter by capability', () => {
      const agents = metadata.getAgentsByCapability('compute.simple_math');
      expect(agents.length).toBe(1);
      expect(agents[0].id).toBe('agent-1');
    });

    test('should filter by type', () => {
      const validators = metadata.getAgentsByType('validator');
      expect(validators.length).toBe(1);
      expect(validators[0].id).toBe('agent-2');

      const workers = metadata.getAgentsByType('worker');
      expect(workers.length).toBe(2);
    });

    test('should get available agents', () => {
      // Overload agent-1
      metadata.updateAgent('agent-1', {
        availability: { currentLoad: 10, maxConcurrent: 5 },
      });

      const available = metadata.getAvailableAgents();
      expect(available.length).toBe(2); // agent-2 and agent-3
      expect(available.find(a => a.id === 'agent-1')).toBeUndefined();
    });
  });

  describe('Performance Metrics', () => {
    test('should track latency bounds', () => {
      const agent = metadata.registerAgent('agent-1', {
        name: 'Worker',
        performance: {
          minLatency: 50,
          avgLatency: 100,
          maxLatency: 500,
        },
      });

      expect(agent.performance.minLatency).toBe(50);
      expect(agent.performance.avgLatency).toBe(100);
      expect(agent.performance.maxLatency).toBe(500);
    });

    test('should clamp reliability to 0-1', () => {
      const agent1 = metadata.registerAgent('agent-1', {
        name: 'Worker',
        performance: { reliability: -0.5 }, // Too low
      });
      expect(agent1.performance.reliability).toBe(0);

      const agent2 = metadata.registerAgent('agent-2', {
        name: 'Worker',
        performance: { reliability: 1.5 }, // Too high
      });
      expect(agent2.performance.reliability).toBe(1);
    });

    test('should track quality components', () => {
      const agent = metadata.registerAgent('agent-1', {
        name: 'Worker',
        quality: {
          accuracy: 0.95,
          consistency: 0.90,
          completeness: 0.85,
        },
      });

      expect(agent.quality.accuracy).toBe(0.95);
      expect(agent.quality.consistency).toBe(0.90);
      expect(agent.quality.completeness).toBe(0.85);
    });
  });

  describe('SLA Compliance', () => {
    test('should track SLA requirements', () => {
      const agent = metadata.registerAgent('agent-1', {
        name: 'Worker',
        sla: {
          maxLatencySLA: 1000,
          minUptime: 99.5,
        },
      });

      expect(agent.sla.maxLatencySLA).toBe(1000);
      expect(agent.sla.minUptime).toBe(99.5);
    });
  });

  describe('Metadata Versioning', () => {
    test('should track metadata version', () => {
      const agent = metadata.registerAgent('agent-1', { name: 'Worker' });
      expect(agent.metadataVersion).toBe(2);
    });

    test('should track registration timestamp', () => {
      const before = Date.now();
      const agent = metadata.registerAgent('agent-1', { name: 'Worker' });
      const after = Date.now();

      expect(agent.registeredAt).toBeGreaterThanOrEqual(before);
      expect(agent.registeredAt).toBeLessThanOrEqual(after);
    });
  });

  describe('Clear', () => {
    test('should clear all agents', () => {
      metadata.registerAgent('agent-1', { name: 'Worker1' });
      metadata.registerAgent('agent-2', { name: 'Worker2' });

      metadata.clear();

      expect(metadata.getAllAgents().length).toBe(0);
      expect(metadata.getAgent('agent-1')).toBeNull();
    });
  });
});
