/**
 * Orchestration Engine for V2
 *
 * Unified orchestrator that:
 * - Parses missions into execution steps
 * - Applies strategy across all agent selections
 * - Plans dynamic execution pipeline
 * - Selects best agents with intelligent fallbacks
 * - Tracks budget and adapts execution
 */

import CapabilityMatcher from './capabilityMatcher.js';
import AgentScorer from './agentScorer.js';
import StrategyDefinitions from './strategyDefinitions.js';
import AgentMetadata from './agentMetadata.js';

class OrchestrationEngine {
  constructor(metadata = null, matcher = null, scorer = null) {
    this.metadata = metadata || new AgentMetadata();
    this.matcher = matcher || new CapabilityMatcher(null, this.metadata);
    this.scorer = scorer || new AgentScorer(this.metadata);
    this.strategies = new StrategyDefinitions();

    // Execution history
    this.executionPlans = new Map();
    this.executionResults = [];
  }

  /**
   * Create execution plan for a mission
   * @param {string} missionId - Unique mission identifier
   * @param {Object} mission - Mission specification
   * @param {Object} options - Orchestration options
   * @returns {Object} Complete execution plan with agent assignments
   */
  createExecutionPlan(missionId, mission, options = {}) {
    const strategy = options.strategy || 'balanced';
    const budget = options.budget || mission.budget || 0.01; // 1 cent default
    const maxFallbacks = options.maxFallbacks || 2;

    // Parse mission into steps
    const steps = this.parseMission(mission);

    // Create task specifications for each step
    const taskSpecs = steps.map((step, idx) => ({
      stepIndex: idx,
      stepName: step.name,
      taskType: step.type,
      requirements: step.requirements,
      inputLength: step.inputLength || 100,
      maxLatency: step.maxLatency || 1000,
      minReliability: step.minReliability || 0.85,
      // Allocate budget evenly across steps
      budget: budget / steps.length,
    }));

    // Get available agents
    const allAgents = this.metadata.getAllAgents();
    const availableAgentIds = allAgents.map(a => a.id);

    // Select agents for each step
    const agentAssignments = taskSpecs.map(spec =>
      this.selectAgentForStep(
        spec,
        availableAgentIds,
        strategy,
        maxFallbacks
      )
    );

    // Create execution plan
    const plan = {
      missionId,
      strategy,
      budget,
      totalSteps: steps.length,
      steps: steps.map((step, idx) => ({
        ...step,
        assignment: agentAssignments[idx],
      })),
      estimatedCost: this.estimateTotalCost(agentAssignments, taskSpecs),
      confidence: this.calculatePlanConfidence(agentAssignments),
      budgetOK: this.estimateTotalCost(agentAssignments, taskSpecs) <= budget,
      createdAt: Date.now(),
    };

    // Store plan
    this.executionPlans.set(missionId, plan);

    return plan;
  }

  /**
   * Parse mission into execution steps
   * @param {Object} mission - Mission specification
   * @returns {Array} Array of step objects
   */
  parseMission(mission) {
    // Simple parsing: if steps array exists, use it
    if (Array.isArray(mission.steps)) {
      return mission.steps;
    }

    // Otherwise infer steps from mission type
    const defaultSteps = {
      'simple': [
        { name: 'Execute', type: 'simple', requirements: [] },
      ],
      'complex': [
        { name: 'Analyze', type: 'analytics', requirements: [] },
        { name: 'Execute', type: 'complex', requirements: [] },
        { name: 'Validate', type: 'security', requirements: [] },
      ],
      'security': [
        { name: 'Validate', type: 'security', requirements: [] },
        { name: 'Execute', type: 'complex', requirements: [] },
      ],
    };

    return defaultSteps[mission.type] || defaultSteps['simple'];
  }

  /**
   * Select best agent for a specific step
   * @param {Object} taskSpec - Task specification
   * @param {Array} candidateAgentIds - List of candidate agent IDs
   * @param {string} strategy - Strategy name
   * @param {number} maxFallbacks - Max fallback agents
   * @returns {Object} Agent assignment with primary and fallbacks
   */
  selectAgentForStep(taskSpec, candidateAgentIds, strategy, maxFallbacks) {
    // Find compatible agents
    const compatible = candidateAgentIds.filter(agentId => {
      const compatibility = this.matcher.evaluateCompatibility(agentId, taskSpec);
      return compatibility.compatible;
    });

    if (compatible.length === 0) {
      return {
        primary: null,
        fallbacks: [],
        score: 0,
        reason: 'No compatible agents found',
      };
    }

    // Score compatible agents
    const scored = this.scorer.scoreAndRank(
      compatible,
      taskSpec,
      strategy,
      { minScore: 0.5 }
    );

    if (scored.length === 0) {
      return {
        primary: null,
        fallbacks: [],
        score: 0,
        reason: 'No agents meet score threshold',
      };
    }

    // Primary assignment
    const primary = scored[0];

    // Fallback assignments
    const fallbacks = scored.slice(1, maxFallbacks + 1);

    return {
      primary: {
        agentId: primary.agentId,
        score: primary.score,
        recommendation: primary.recommendation,
      },
      fallbacks: fallbacks.map(f => ({
        agentId: f.agentId,
        score: f.score,
        reason: 'Fallback option',
      })),
      scoreBreakdown: primary.breakdown,
      estimatedCost: this.estimateAgentCost(
        this.metadata.getAgent(primary.agentId),
        taskSpec
      ),
    };
  }

  /**
   * Estimate cost for single agent task
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification
   * @returns {number} Estimated cost in USDC
   */
  estimateAgentCost(agent, taskSpec) {
    if (!agent) return 0;
    return this.scorer.calculateBudgetAdjustment !== undefined
      ? agent.cost.base + (taskSpec.inputLength || 100) * agent.cost.perChar
      : agent.cost.base;
  }

  /**
   * Estimate total cost for execution plan
   * @param {Array} assignments - Agent assignments
   * @param {Array} taskSpecs - Task specifications
   * @returns {number} Total estimated cost
   */
  estimateTotalCost(assignments, taskSpecs) {
    return assignments.reduce((total, assignment, idx) => {
      if (!assignment.primary) return total;
      return total + assignment.estimatedCost;
    }, 0);
  }

  /**
   * Calculate overall confidence in execution plan
   * @param {Array} assignments - Agent assignments
   * @returns {number} Confidence score 0-1
   */
  calculatePlanConfidence(assignments) {
    const scores = assignments
      .filter(a => a.primary)
      .map(a => a.primary.score);

    if (scores.length === 0) return 0;

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);

    // Confidence is average score, penalized by lowest score
    return (avgScore + minScore) / 2;
  }

  /**
   * Execute plan and track results
   * @param {string} missionId - Mission ID
   * @param {Function} executor - Execution function
   * @returns {Promise<Object>} Execution result
   */
  async executePlan(missionId, executor) {
    const plan = this.executionPlans.get(missionId);
    if (!plan) {
      throw new Error(`Plan not found: ${missionId}`);
    }

    const startTime = Date.now();
    const results = [];
    let totalCost = 0;
    let success = true;

    // Execute each step
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const assignment = step.assignment;

      if (!assignment.primary) {
        results.push({
          step: step.stepName,
          success: false,
          reason: 'No agent assigned',
        });
        success = false;
        break;
      }

      // Try primary agent
      let stepSuccess = false;
      let usedAgent = assignment.primary.agentId;
      let error = null;

      try {
        await executor(usedAgent, step);
        stepSuccess = true;
      } catch (err) {
        error = err.message;

        // Try fallback agents
        for (const fallback of assignment.fallbacks) {
          try {
            await executor(fallback.agentId, step);
            usedAgent = fallback.agentId;
            stepSuccess = true;
            break;
          } catch (fallbackErr) {
            // Continue to next fallback
          }
        }
      }

      const stepResult = {
        step: step.stepName,
        agentId: usedAgent,
        success: stepSuccess,
        error: error,
        cost: this.estimateAgentCost(
          this.metadata.getAgent(usedAgent),
          { inputLength: step.inputLength }
        ),
      };

      results.push(stepResult);
      totalCost += stepResult.cost;
      success = success && stepSuccess;
    }

    // Record execution result
    const executionResult = {
      missionId,
      planId: plan.missionId,
      success,
      steps: results.length,
      stepsCompleted: results.filter(r => r.success).length,
      totalCost,
      budgetOK: totalCost <= plan.budget,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };

    this.executionResults.push(executionResult);

    return executionResult;
  }

  /**
   * Get execution statistics
   * @returns {Object} Statistics about executions
   */
  getExecutionStats() {
    const total = this.executionResults.length;
    const successful = this.executionResults.filter(r => r.success).length;
    const avgCost = total > 0
      ? this.executionResults.reduce((sum, r) => sum + r.totalCost, 0) / total
      : 0;

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      successRate: total > 0 ? successful / total : 0,
      averageCost: avgCost,
      totalCost: this.executionResults.reduce((sum, r) => sum + r.totalCost, 0),
    };
  }

  /**
   * Analyze plan for optimization opportunities
   * @param {string} missionId - Mission ID
   * @returns {Object} Optimization recommendations
   */
  analyzePlan(missionId) {
    const plan = this.executionPlans.get(missionId);
    if (!plan) return null;

    const recommendations = [];

    // Check for unused fallbacks
    plan.steps.forEach((step, idx) => {
      if (step.assignment.fallbacks.length === 0 && step.assignment.primary) {
        recommendations.push({
          step: idx,
          type: 'no-fallback',
          message: 'No fallback agents available for step',
          severity: 'warning',
        });
      }
    });

    // Check budget allocation
    if (plan.estimatedCost > plan.budget * 0.9) {
      recommendations.push({
        type: 'budget-tight',
        message: 'Budget allocation is tight (>90%)',
        severity: 'warning',
      });
    }

    // Check confidence
    if (plan.confidence < 0.7) {
      recommendations.push({
        type: 'low-confidence',
        message: 'Plan confidence below 70%',
        severity: 'warning',
        confidence: plan.confidence,
      });
    }

    return {
      missionId,
      plan,
      recommendations,
      overall: recommendations.length === 0 ? 'healthy' : 'review-recommended',
    };
  }
}

export default OrchestrationEngine;
