/**
 * Agent Scorer for V2 Orchestration
 *
 * Evaluates and ranks agents based on:
 * - Multi-dimensional scoring (cost, quality, reliability, latency, specialization)
 * - Strategy-specific weights
 * - Task context
 * - Budget constraints
 */

import ScoringSchema from './scoringSchema.js';
import StrategyDefinitions from './strategyDefinitions.js';
import AgentMetadata from './agentMetadata.js';

class AgentScorer {
  constructor(metadata = null, scoringSchema = null, strategies = null) {
    this.metadata = metadata || new AgentMetadata();
    this.scoringSchema = scoringSchema || new ScoringSchema();
    this.strategies = strategies || new StrategyDefinitions();

    // Score history for trending
    this.scoreHistory = new Map();
  }

  /**
   * Score a single agent for a task
   * @param {string} agentId - Agent ID
   * @param {Object} taskSpec - Task specification
   * @param {string} strategy - Strategy name
   * @param {Object} context - Additional context
   * @returns {Object} Detailed scoring result
   */
  scoreAgent(agentId, taskSpec, strategy = 'balanced', context = {}) {
    const agent = this.metadata.getAgent(agentId);
    if (!agent) {
      return {
        agentId,
        scored: false,
        score: 0,
        reason: 'Agent not found',
      };
    }

    // Get strategy weights
    const weights = this.strategies.getWeights(strategy, {
      taskType: taskSpec.type,
    });

    // Calculate base score
    const scoreResult = this.scoringSchema.calculateCompositeScore(
      agent,
      weights,
      context
    );

    // Apply constraints
    const strategyDef = this.strategies.getStrategy(strategy);
    const constraintsOK = this.checkConstraints(agent, taskSpec, strategyDef);

    // Adjust for budget
    const budgetAdjustment = this.calculateBudgetAdjustment(
      agent,
      taskSpec,
      strategy
    );

    // Calculate final score
    const finalScore = scoreResult.composite * (constraintsOK ? 1.0 : 0.7) * budgetAdjustment;

    // Record in history
    this.recordScore(agentId, finalScore, strategy);

    return {
      agentId,
      scored: true,
      score: Math.min(1, Math.max(0, finalScore)),
      baseScore: scoreResult.composite,
      constraintsOK,
      budgetAdjustment,
      breakdown: scoreResult.breakdown,
      dimensionScores: scoreResult.scores,
      weights,
      constraints: {
        quality: agent.quality,
        reliability: agent.performance.reliability,
        latency: agent.performance.avgLatency,
        cost: agent.cost.base,
      },
      recommendation: this.getScoreRecommendation(finalScore, constraintsOK),
    };
  }

  /**
   * Score multiple agents and rank them
   * @param {Array} agentIds - List of agent IDs
   * @param {Object} taskSpec - Task specification
   * @param {string} strategy - Strategy name
   * @param {Object} options - Ranking options
   * @returns {Array} Ranked agents with scores
   */
  scoreAndRank(agentIds, taskSpec, strategy = 'balanced', options = {}) {
    const minScore = options.minScore || 0.5;
    const limit = options.limit || null;

    const scored = agentIds
      .map(agentId => this.scoreAgent(agentId, taskSpec, strategy, options.context))
      .filter(result => result.scored && result.score >= minScore)
      .sort((a, b) => b.score - a.score);

    return limit ? scored.slice(0, limit) : scored;
  }

  /**
   * Check if agent meets strategy constraints
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification
   * @param {Object} strategyDef - Strategy definition
   * @returns {boolean} True if constraints met
   */
  checkConstraints(agent, taskSpec, strategyDef) {
    const c = strategyDef.constraints;

    const qualityOK = this.getAverageQuality(agent) >= c.minQuality;
    const reliabilityOK = agent.performance.reliability >= c.minReliability;
    const latencyOK = agent.performance.avgLatency <= c.maxLatency;
    const costOK = agent.cost.base <= c.maxCost;

    return qualityOK && reliabilityOK && latencyOK && costOK;
  }

  /**
   * Calculate budget adjustment factor
   * @param {Object} agent - Agent metadata
   * @param {Object} taskSpec - Task specification
   * @param {string} strategy - Strategy name
   * @returns {number} Adjustment multiplier 0-1
   */
  calculateBudgetAdjustment(agent, taskSpec, strategy) {
    // No budget specified = no adjustment
    if (taskSpec.budget === undefined || taskSpec.budget === null) return 1.0;

    // Zero or negative budget = heavy penalty
    if (taskSpec.budget <= 0) return 0.5;

    const estimatedCost = taskSpec.inputLength
      ? agent.cost.base + taskSpec.inputLength * agent.cost.perChar
      : agent.cost.base;

    if (estimatedCost === 0) return 1.0; // Free agent, no penalty

    const budgetRatio = taskSpec.budget / estimatedCost;

    if (budgetRatio >= 1.0) {
      return 1.0; // Well within budget
    } else if (budgetRatio >= 0.8) {
      return 0.95; // Slightly over, minor penalty
    } else if (budgetRatio >= 0.6) {
      return 0.8; // Moderate over, penalty
    } else {
      return 0.5; // Significantly over, heavy penalty
    }
  }

  /**
   * Get average quality score for agent
   * @param {Object} agent - Agent metadata
   * @returns {number} Average quality 0-1
   */
  getAverageQuality(agent) {
    const q = agent.quality;
    return (q.accuracy + q.consistency + q.completeness) / 3;
  }

  /**
   * Get human-readable recommendation based on score
   * @param {number} score - Composite score
   * @param {boolean} constraintsOK - Constraints met
   * @returns {string} Recommendation text
   */
  getScoreRecommendation(score, constraintsOK) {
    if (!constraintsOK) {
      return 'Does not meet strategy constraints';
    } else if (score >= 0.9) {
      return 'Excellent choice - highly recommended';
    } else if (score >= 0.8) {
      return 'Very good choice - recommended';
    } else if (score >= 0.7) {
      return 'Good choice - acceptable';
    } else if (score >= 0.6) {
      return 'Acceptable choice - consider alternatives';
    } else if (score >= 0.5) {
      return 'Marginal choice - poor alternatives';
    } else {
      return 'Poor choice - not recommended';
    }
  }

  /**
   * Record score in history for trending
   * @param {string} agentId - Agent ID
   * @param {number} score - Score achieved
   * @param {string} strategy - Strategy used
   */
  recordScore(agentId, score, strategy) {
    if (!this.scoreHistory.has(agentId)) {
      this.scoreHistory.set(agentId, []);
    }

    const history = this.scoreHistory.get(agentId);
    history.push({
      score,
      strategy,
      timestamp: Date.now(),
    });

    // Keep last 100 scores
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get agent's average score across all strategies
   * @param {string} agentId - Agent ID
   * @returns {Object} Average score and trend
   */
  getScoreTrend(agentId) {
    if (!this.scoreHistory.has(agentId)) {
      return { avgScore: 0, trend: 'no-history' };
    }

    const history = this.scoreHistory.get(agentId);
    if (history.length === 0) return { avgScore: 0, trend: 'no-history' };

    const scores = history.map(h => h.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate trend
    const recent = scores.slice(-5);
    const older = scores.slice(0, Math.max(1, scores.length - 5));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const trend = recentAvg > olderAvg ? 'improving' :
      recentAvg < olderAvg ? 'declining' : 'stable';

    return {
      avgScore,
      trend,
      recentScore: recent[recent.length - 1],
      recordCount: history.length,
    };
  }

  /**
   * Compare multiple strategies for an agent
   * @param {string} agentId - Agent ID
   * @param {Object} taskSpec - Task specification
   * @returns {Object} Scores for each strategy
   */
  compareStrategies(agentId, taskSpec) {
    const strategies = this.strategies.getAllStrategies();

    const results = {};
    strategies.forEach(strategy => {
      results[strategy] = this.scoreAgent(agentId, taskSpec, strategy);
    });

    return results;
  }

  /**
   * Find best agent across multiple for a task
   * @param {Array} agentIds - Candidate agent IDs
   * @param {Object} taskSpec - Task specification
   * @param {string} strategy - Strategy name
   * @returns {Object} Best agent with full details
   */
  findBestAgent(agentIds, taskSpec, strategy = 'balanced') {
    // First try with standard threshold
    let ranked = this.scoreAndRank(agentIds, taskSpec, strategy, { limit: 1, minScore: 0.5 });

    // If no agents qualify, relax threshold
    if (ranked.length === 0) {
      ranked = this.scoreAndRank(agentIds, taskSpec, strategy, { limit: 1, minScore: 0 });
    }

    if (ranked.length === 0) {
      return null;
    }

    const best = ranked[0];
    const agent = this.metadata.getAgent(best.agentId);

    return {
      ...best,
      agent: agent ? {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
      } : null,
    };
  }

  /**
   * Score and explain reasoning
   * @param {string} agentId - Agent ID
   * @param {Object} taskSpec - Task specification
   * @param {string} strategy - Strategy name
   * @returns {Object} Detailed explanation
   */
  scoreAndExplain(agentId, taskSpec, strategy = 'balanced') {
    const result = this.scoreAgent(agentId, taskSpec, strategy);

    if (!result.scored) {
      return {
        ...result,
        explanation: result.reason,
      };
    }

    const agent = this.metadata.getAgent(agentId);
    const strategyDef = this.strategies.getStrategy(strategy);

    const explanation = {
      summary: result.recommendation,
      score: result.score,
      strategy: strategy,
      reasoning: [
        `Cost dimension: ${(result.dimensionScores.cost * 100).toFixed(1)}% (weight: ${(result.weights.cost * 100).toFixed(1)}%)`,
        `Quality dimension: ${(result.dimensionScores.quality * 100).toFixed(1)}% (weight: ${(result.weights.quality * 100).toFixed(1)}%)`,
        `Reliability: ${(agent.performance.reliability * 100).toFixed(1)}% (min required: ${(strategyDef.constraints.minReliability * 100).toFixed(1)}%)`,
        `Latency: ${agent.performance.avgLatency}ms (max allowed: ${strategyDef.constraints.maxLatency}ms)`,
        `Budget adjustment: ${(result.budgetAdjustment * 100).toFixed(1)}%`,
      ],
      constraints: {
        passed: result.constraintsOK,
        details: {
          quality: `${this.getAverageQuality(agent).toFixed(2)} >= ${strategyDef.constraints.minQuality}`,
          reliability: `${agent.performance.reliability.toFixed(2)} >= ${strategyDef.constraints.minReliability}`,
          latency: `${agent.performance.avgLatency}ms <= ${strategyDef.constraints.maxLatency}ms`,
          cost: `${agent.cost.base.toFixed(6)} <= ${strategyDef.constraints.maxCost}`,
        },
      },
    };

    return explanation;
  }

  /**
   * Clear scoring history
   */
  clearHistory() {
    this.scoreHistory.clear();
  }
}

export default AgentScorer;
