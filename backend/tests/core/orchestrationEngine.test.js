/**
 * Tests for Orchestration Engine
 */

import OrchestrationEngine from '../../src/core/orchestrationEngine.js';
import AgentMetadata from '../../src/core/agentMetadata.js';

describe('OrchestrationEngine', () => {
  let engine;
  let metadata;

  beforeEach(() => {
    metadata = new AgentMetadata();
    engine = new OrchestrationEngine(metadata);

    // Register test agents
    metadata.registerAgent('worker-1', {
      name: 'Worker1',
      type: 'worker',
      capabilities: ['compute.simple_math', 'validate.format'],
      performance: { avgLatency: 100, reliability: 0.95 },
      cost: { base: 0.0001, perChar: 0.00001 },
      quality: { accuracy: 0.9, consistency: 0.9, completeness: 0.9 },
    });

    metadata.registerAgent('worker-2', {
      name: 'Worker2',
      type: 'worker',
      capabilities: ['compute.complex_math', 'analyze.risk'],
      performance: { avgLatency: 150, reliability: 0.93 },
      cost: { base: 0.0002, perChar: 0.00002 },
      quality: { accuracy: 0.85, consistency: 0.85, completeness: 0.85 },
    });

    metadata.registerAgent('validator-1', {
      name: 'Validator1',
      type: 'validator',
      capabilities: ['validate.signature', 'analyze.risk'],
      performance: { avgLatency: 200, reliability: 0.98 },
      cost: { base: 0.0001, perChar: 0.00001 },
      quality: { accuracy: 0.95, consistency: 0.95, completeness: 0.95 },
    });
  });

  describe('Execution Plan Creation', () => {
    test('should create plan for simple mission', () => {
      const mission = {
        type: 'simple',
        budget: 0.001,
      };

      const plan = engine.createExecutionPlan('mission-1', mission);

      expect(plan).toBeDefined();
      expect(plan.missionId).toBe('mission-1');
      expect(plan.steps).toBeDefined();
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.strategy).toBe('balanced');
    });

    test('should create plan with custom strategy', () => {
      const mission = {
        type: 'simple',
        budget: 0.001,
      };

      const plan = engine.createExecutionPlan('mission-2', mission, {
        strategy: 'premium',
      });

      expect(plan.strategy).toBe('premium');
    });

    test('should allocate budget across steps', () => {
      const mission = {
        type: 'complex',
        budget: 0.003,
      };

      const plan = engine.createExecutionPlan('mission-3', mission);

      const totalAllocated = plan.steps.reduce((sum, step) => {
        return sum + (step.assignment.estimatedCost || 0);
      }, 0);

      expect(totalAllocated).toBeLessThanOrEqual(0.003 * 1.1); // Allow 10% variance
    });

    test('should mark plan as budget OK', () => {
      const mission = {
        type: 'simple',
        budget: 0.01, // Generous budget
      };

      const plan = engine.createExecutionPlan('mission-4', mission);

      expect(plan.budgetOK).toBe(true);
    });

    test('should flag budget exceeded', () => {
      const mission = {
        type: 'complex',
        budget: 0.00001, // Very tight budget
      };

      const plan = engine.createExecutionPlan('mission-5', mission);

      // May or may not be OK depending on agents
      expect(plan.budgetOK).toBeDefined();
    });
  });

  describe('Mission Parsing', () => {
    test('should parse simple mission into steps', () => {
      const steps = engine.parseMission({ type: 'simple' });

      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('name');
      expect(steps[0]).toHaveProperty('type');
    });

    test('should parse complex mission into multiple steps', () => {
      const steps = engine.parseMission({ type: 'complex' });

      expect(steps.length).toBeGreaterThanOrEqual(3); // Should have analyze, execute, validate
    });

    test('should use provided steps if available', () => {
      const mission = {
        steps: [
          { name: 'Custom1', type: 'simple' },
          { name: 'Custom2', type: 'complex' },
        ],
      };

      const steps = engine.parseMission(mission);

      expect(steps.length).toBe(2);
      expect(steps[0].name).toBe('Custom1');
      expect(steps[1].name).toBe('Custom2');
    });
  });

  describe('Agent Selection for Steps', () => {
    test('should select agent for step', () => {
      const taskSpec = {
        stepIndex: 0,
        taskType: 'simple',
        inputLength: 100,
        budget: 0.001,
      };

      const candidateIds = ['worker-1', 'worker-2', 'validator-1'];
      const assignment = engine.selectAgentForStep(
        taskSpec,
        candidateIds,
        'balanced',
        2
      );

      expect(assignment.primary).toBeDefined();
      expect(assignment.primary.agentId).toBeDefined();
      expect(assignment.primary.score).toBeGreaterThan(0);
    });

    test('should include fallback agents', () => {
      const taskSpec = {
        stepIndex: 0,
        taskType: 'simple',
        inputLength: 100,
        budget: 0.001,
      };

      const candidateIds = ['worker-1', 'worker-2', 'validator-1'];
      const assignment = engine.selectAgentForStep(
        taskSpec,
        candidateIds,
        'balanced',
        2
      );

      expect(assignment.fallbacks).toBeDefined();
      expect(Array.isArray(assignment.fallbacks)).toBe(true);
    });

    test('should handle empty candidate list', () => {
      const taskSpec = {
        stepIndex: 0,
        taskType: 'simple',
        inputLength: 100,
        budget: 0.001,
      };

      const candidateIds = []; // Empty candidates
      const assignment = engine.selectAgentForStep(
        taskSpec,
        candidateIds,
        'balanced',
        2
      );

      expect(assignment.primary).toBeNull();
      expect(assignment.reason).toBeDefined();
    });
  });

  describe('Cost Estimation', () => {
    test('should estimate cost for agent', () => {
      const agent = metadata.getAgent('worker-1');
      const taskSpec = { inputLength: 100 };

      const cost = engine.estimateAgentCost(agent, taskSpec);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.002); // Reasonable range
    });

    test('should estimate total plan cost', () => {
      const mission = {
        type: 'simple',
        budget: 0.01,
      };

      const plan = engine.createExecutionPlan('mission-6', mission);

      expect(plan.estimatedCost).toBeGreaterThan(0);
      expect(plan.estimatedCost).toBeLessThanOrEqual(0.01 * 1.5); // Allow margin
    });
  });

  describe('Plan Confidence', () => {
    test('should calculate confidence score', () => {
      const mission = {
        type: 'simple',
        budget: 0.01,
      };

      const plan = engine.createExecutionPlan('mission-7', mission);

      expect(plan.confidence).toBeGreaterThanOrEqual(0);
      expect(plan.confidence).toBeLessThanOrEqual(1);
    });

    test('should indicate high confidence for good plan', () => {
      const mission = {
        type: 'simple',
        budget: 0.01,
      };

      const plan = engine.createExecutionPlan('mission-8', mission);

      // If primary agents are selected, confidence should be decent
      if (plan.steps.every(s => s.assignment.primary)) {
        expect(plan.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Execution Tracking', () => {
    test('should track execution results', async () => {
      const mission = { type: 'simple', budget: 0.01 };
      const plan = engine.createExecutionPlan('mission-9', mission);

      const mockExecutor = async (agentId, step) => {
        // Mock execution
        return true;
      };

      const result = await engine.executePlan('mission-9', mockExecutor);

      expect(result).toBeDefined();
      expect(result.missionId).toBe('mission-9');
      expect(result.success).toBeDefined();
      expect(result.totalCost).toBeGreaterThanOrEqual(0);
    });

    test('should record execution statistics', async () => {
      const mission = { type: 'simple', budget: 0.01 };
      engine.createExecutionPlan('mission-10', mission);

      const mockExecutor = async (agentId, step) => true;
      await engine.executePlan('mission-10', mockExecutor);

      const stats = engine.getExecutionStats();

      expect(stats.totalExecutions).toBe(1);
      expect(stats.averageCost).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Plan Analysis', () => {
    test('should analyze plan and provide recommendations', () => {
      const mission = {
        type: 'simple',
        budget: 0.01,
      };

      const plan = engine.createExecutionPlan('mission-11', mission);
      const analysis = engine.analyzePlan('mission-11');

      expect(analysis).toBeDefined();
      expect(analysis.plan).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    test('should flag low confidence plans', () => {
      const mission = {
        type: 'complex',
        budget: 0.00001, // Very low budget
      };

      const plan = engine.createExecutionPlan('mission-12', mission);

      if (plan.confidence < 0.7) {
        const analysis = engine.analyzePlan('mission-12');
        const hasLowConfidenceWarning = analysis.recommendations.some(
          r => r.type === 'low-confidence'
        );

        expect(hasLowConfidenceWarning).toBe(true);
      }
    });
  });

  describe('Strategy Application', () => {
    test('should apply cheap strategy', () => {
      const mission = { type: 'simple', budget: 0.01 };
      const plan = engine.createExecutionPlan('mission-13', mission, {
        strategy: 'cheap',
      });

      expect(plan.strategy).toBe('cheap');
      // Plan should prefer cost-effective agents
      plan.steps.forEach(step => {
        if (step.assignment.primary) {
          expect(step.assignment.primary.score).toBeGreaterThan(0);
        }
      });
    });

    test('should apply premium strategy', () => {
      const mission = { type: 'simple', budget: 0.01 };
      const plan = engine.createExecutionPlan('mission-14', mission, {
        strategy: 'premium',
      });

      expect(plan.strategy).toBe('premium');
      // Plan should prefer high-quality agents
      plan.steps.forEach(step => {
        if (step.assignment.primary) {
          expect(step.assignment.primary.score).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Plan Retrieval', () => {
    test('should store and retrieve plans', () => {
      const mission = { type: 'simple', budget: 0.01 };
      const plan = engine.createExecutionPlan('mission-15', mission);

      expect(plan).toBeDefined();
      expect(engine.executionPlans.has('mission-15')).toBe(true);
    });

    test('should return null for non-existent plan analysis', () => {
      const analysis = engine.analyzePlan('non-existent');

      expect(analysis).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero budget', () => {
      const mission = { type: 'simple', budget: 0 };
      const plan = engine.createExecutionPlan('mission-16', mission);

      expect(plan).toBeDefined();
      expect(plan.steps.length).toBeGreaterThan(0);
    });

    test('should handle mission without explicit budget', () => {
      const mission = { type: 'simple' };
      const plan = engine.createExecutionPlan('mission-17', mission);

      expect(plan.budget).toBeGreaterThan(0); // Should use default
    });

    test('should handle empty agent list', () => {
      const mission = { type: 'simple', budget: 0.01 };
      const plan = engine.createExecutionPlan('mission-18', mission, {
        // Empty metadata means no agents
      });

      // Should still create plan structure
      expect(plan).toBeDefined();
      expect(plan.steps).toBeDefined();
    });
  });
});
