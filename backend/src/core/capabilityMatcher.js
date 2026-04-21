/**
 * Capability Matcher for V2 Orchestration
 *
 * Evaluates agent-task compatibility based on:
 * - Required capabilities vs. agent capabilities
 * - Input/output type compatibility
 * - Performance requirements (latency, reliability)
 * - Cost constraints
 */

import CapabilityTaxonomy from './capabilityTaxonomy.js';
import AgentMetadata from './agentMetadata.js';

class CapabilityMatcher {
  constructor(taxonomy = null, metadata = null) {
    this.taxonomy = taxonomy || new CapabilityTaxonomy();
    this.metadata = metadata || new AgentMetadata();
  }

  /**
   * Evaluate if an agent can execute a task
   * Returns detailed compatibility report
   * @param {string} agentId - Agent identifier
   * @param {Object} taskSpec - Task specification
   * @returns {Object} Compatibility result with score and details
   */
  evaluateCompatibility(agentId, taskSpec) {
    const agent = this.metadata.getAgent(agentId);
    if (!agent) {
      return {
        compatible: false,
        score: 0,
        reason: 'Agent not found',
        details: {},
      };
    }

    const checks = {
      capabilityMatch: this.checkCapabilityMatch(agent, taskSpec),
      inputOutputMatch: this.checkInputOutputMatch(agent, taskSpec),
      performanceMatch: this.checkPerformanceRequirements(agent, taskSpec),
      costMatch: this.checkCostConstraints(agent, taskSpec),
      availabilityMatch: this.checkAvailability(agent, taskSpec),
    };

    const compatible =
      checks.capabilityMatch.passed &&
      checks.inputOutputMatch.passed &&
      checks.performanceMatch.passed &&
      checks.costMatch.passed &&
      checks.availabilityMatch.passed;

    const score = this.calculateCompatibilityScore(checks);

    return {
      compatible,
      score,
      checks,
      recommendation: this.getRecommendation(compatible, score),
    };
  }

  /**
   * Check if agent has required capabilities
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification
   * @returns {Object} Check result
   */
  checkCapabilityMatch(agent, taskSpec) {
    const requiredCapabilities = this.taxonomy.getCapabilitiesForTask(taskSpec.type);

    if (requiredCapabilities.length === 0) {
      return {
        passed: true,
        score: 1.0,
        reason: 'No specific capabilities required',
      };
    }

    const hasAllRequired = this.taxonomy.meetsRequirements(
      agent.capabilities,
      requiredCapabilities
    );

    const matchScore = this.taxonomy.calculateCapabilityScore(
      agent.capabilities,
      requiredCapabilities
    );

    return {
      passed: hasAllRequired,
      score: matchScore,
      required: requiredCapabilities.length,
      matched: agent.capabilities.filter(cap =>
        requiredCapabilities.some(req => req.id === cap)
      ).length,
      reason: hasAllRequired
        ? `Agent has all ${requiredCapabilities.length} required capabilities`
        : `Agent missing capabilities (${matchScore.toFixed(2)} match)`,
    };
  }

  /**
   * Check input/output type compatibility
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification
   * @returns {Object} Check result
   */
  checkInputOutputMatch(agent, taskSpec) {
    const requiredInput = taskSpec.inputType || 'string';
    const requiredOutput = taskSpec.outputType || 'string';

    const inputCompatible = agent.inputTypes.includes(requiredInput) ||
      agent.inputTypes.includes('*'); // Wildcard support
    const outputCompatible = agent.outputTypes.includes(requiredOutput) ||
      agent.outputTypes.includes('*');

    const compatible = inputCompatible && outputCompatible;

    return {
      passed: compatible,
      score: compatible ? 1.0 : 0.5,
      inputMatch: inputCompatible,
      outputMatch: outputCompatible,
      reason: compatible
        ? 'Input/output types compatible'
        : `Type mismatch: input=${inputCompatible}, output=${outputCompatible}`,
    };
  }

  /**
   * Check performance requirements
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification with performance requirements
   * @returns {Object} Check result
   */
  checkPerformanceRequirements(agent, taskSpec) {
    const maxLatency = taskSpec.maxLatency || agent.sla.maxLatencySLA || 2000;
    const minReliability = taskSpec.minReliability || 0.8;

    const latencyOK = agent.performance.avgLatency <= maxLatency;
    const reliabilityOK = agent.performance.reliability >= minReliability;

    const compatible = latencyOK && reliabilityOK;

    return {
      passed: compatible,
      score: compatible ? 1.0 : 0.5,
      latencyOK,
      reliabilityOK,
      agentLatency: agent.performance.avgLatency,
      maxLatencyRequired: maxLatency,
      agentReliability: agent.performance.reliability,
      minReliabilityRequired: minReliability,
      reason: compatible
        ? 'Performance requirements met'
        : `Performance mismatch: latency=${latencyOK}, reliability=${reliabilityOK}`,
    };
  }

  /**
   * Check cost constraints
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification with cost budget
   * @returns {Object} Check result
   */
  checkCostConstraints(agent, taskSpec) {
    const budget = taskSpec.budget || 0.001; // Default budget
    const estimatedCost = this.estimateTaskCost(agent, taskSpec);

    const withinBudget = estimatedCost <= budget;

    return {
      passed: withinBudget,
      score: withinBudget ? 1.0 : Math.max(0.1, budget / estimatedCost),
      estimatedCost,
      budget,
      reason: withinBudget
        ? `Cost within budget (${estimatedCost.toFixed(6)} ≤ ${budget.toFixed(6)})`
        : `Cost exceeds budget (${estimatedCost.toFixed(6)} > ${budget.toFixed(6)})`,
    };
  }

  /**
   * Check agent availability
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification
   * @returns {Object} Check result
   */
  checkAvailability(agent, taskSpec) {
    const available = agent.availability.available;
    const hasCapacity =
      agent.availability.currentLoad < agent.availability.maxConcurrent;

    const compatible = available && hasCapacity;

    return {
      passed: compatible,
      score: compatible ? 1.0 : 0,
      available,
      hasCapacity,
      currentLoad: agent.availability.currentLoad,
      maxConcurrent: agent.availability.maxConcurrent,
      reason: compatible
        ? 'Agent available with capacity'
        : `Agent unavailable or at capacity`,
    };
  }

  /**
   * Estimate cost for task execution
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification
   * @returns {number} Estimated cost in USDC
   */
  estimateTaskCost(agent, taskSpec) {
    const inputLength = taskSpec.inputLength || 100;
    const taskMultiplier = taskSpec.taskMultiplier || 1.0;

    const baseCost = agent.cost.base;
    const perCharCost = agent.cost.perChar;
    const rawCost = baseCost + inputLength * perCharCost * taskMultiplier;

    return Math.max(agent.cost.minCost, Math.min(agent.cost.maxCost, rawCost));
  }

  /**
   * Calculate overall compatibility score
   * @param {Object} checks - All check results
   * @returns {number} Overall score 0-1
   */
  calculateCompatibilityScore(checks) {
    const weights = {
      capabilityMatch: 0.3,
      inputOutputMatch: 0.15,
      performanceMatch: 0.25,
      costMatch: 0.2,
      availabilityMatch: 0.1,
    };

    const score =
      checks.capabilityMatch.score * weights.capabilityMatch +
      checks.inputOutputMatch.score * weights.inputOutputMatch +
      checks.performanceMatch.score * weights.performanceMatch +
      checks.costMatch.score * weights.costMatch +
      checks.availabilityMatch.score * weights.availabilityMatch;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Get human-readable recommendation
   * @param {boolean} compatible - Compatibility result
   * @param {number} score - Compatibility score
   * @returns {string} Recommendation text
   */
  getRecommendation(compatible, score) {
    if (!compatible && score < 0.5) {
      return 'Not recommended - significant compatibility issues';
    } else if (!compatible) {
      return 'Possible but may fail - consider alternatives';
    } else if (score < 0.7) {
      return 'Compatible but with caveats - monitor execution';
    } else if (score < 0.85) {
      return 'Good match - reasonable choice';
    } else {
      return 'Excellent match - strong recommendation';
    }
  }

  /**
   * Find best matching agents for a task
   * @param {Array} agentIds - List of agent IDs to evaluate
   * @param {Object} taskSpec - Task specification
   * @param {Object} options - Filter options
   * @returns {Array} Agents ranked by compatibility
   */
  findBestMatches(agentIds, taskSpec, options = {}) {
    const minScore = options.minScore || 0.6;
    const limit = options.limit || null;

    const evaluations = agentIds.map(agentId => ({
      agentId,
      ...this.evaluateCompatibility(agentId, taskSpec),
    }));

    const filtered = evaluations
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score);

    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Get specialized agents for capability
   * @param {string} capabilityId - Capability ID
   * @param {Object} taskSpec - Task specification
   * @returns {Array} Specialized agents ranked by score
   */
  getSpecializedAgents(capabilityId, taskSpec) {
    const agents = this.metadata.getAgentsByCapability(capabilityId);
    return this.findBestMatches(
      agents.map(a => a.id),
      taskSpec,
      { limit: 5 }
    );
  }

  /**
   * Suggest fallback agents
   * @param {string} primaryAgentId - Primary agent ID
   * @param {Object} taskSpec - Task specification
   * @returns {Array} Alternative agents that can handle the task
   */
  suggestFallbacks(primaryAgentId, taskSpec) {
    const primary = this.metadata.getAgent(primaryAgentId);
    if (!primary) return [];

    const allAgents = this.metadata.getAllAgents();
    const alternatives = allAgents
      .filter(agent => agent.id !== primaryAgentId)
      .map(agent => ({
        agentId: agent.id,
        ...this.evaluateCompatibility(agent.id, taskSpec),
      }))
      .filter(result => result.compatible)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 fallbacks

    return alternatives;
  }

  /**
   * Validate task specification
   * @param {Object} taskSpec - Task specification
   * @returns {Object} Validation result
   */
  validateTaskSpec(taskSpec) {
    const errors = [];

    if (!taskSpec.type) errors.push('Missing required field: type');
    if (!this.taxonomy.getCapabilitiesForTask(taskSpec.type).length &&
      taskSpec.type !== 'unknown') {
      errors.push('Unknown task type');
    }

    if (taskSpec.maxLatency && taskSpec.maxLatency < 50) {
      errors.push('maxLatency too low (minimum 50ms)');
    }

    if (taskSpec.minReliability && (taskSpec.minReliability < 0 ||
      taskSpec.minReliability > 1)) {
      errors.push('minReliability must be between 0 and 1');
    }

    if (taskSpec.budget && taskSpec.budget <= 0) {
      errors.push('budget must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default CapabilityMatcher;
