/**
 * Scoring Schema for V2 Agent Evaluation
 *
 * Multi-dimensional scoring across:
 * 1. Cost (lower is better)
 * 2. Quality (higher is better)
 * 3. Reliability (higher is better)
 * 4. Latency (lower is better)
 * 5. Specialization (higher is better for task)
 */

class ScoringSchema {
  constructor() {
    // Scoring dimension weights (will be modified by strategy)
    this.dimensions = {
      COST: 'cost',
      QUALITY: 'quality',
      RELIABILITY: 'reliability',
      LATENCY: 'latency',
      SPECIALIZATION: 'specialization',
    };

    // Default weights (equal distribution)
    this.defaultWeights = {
      cost: 0.2,
      quality: 0.2,
      reliability: 0.2,
      latency: 0.2,
      specialization: 0.2,
    };

    // Normalization ranges for each dimension
    this.ranges = {
      cost: { min: 0.00005, max: 0.01 }, // USDC
      quality: { min: 0.5, max: 1.0 }, // 0-1 scale
      reliability: { min: 0.8, max: 1.0 }, // 0-1 scale
      latency: { min: 50, max: 2000 }, // milliseconds
      specialization: { min: 0, max: 1 }, // 0-1 scale
    };
  }

  /**
   * Normalize a value to 0-1 range
   * @param {number} value - Raw value
   * @param {number} min - Minimum bound
   * @param {number} max - Maximum bound
   * @returns {number} Normalized value 0-1
   */
  normalize(value, min, max) {
    if (min === max) return 0.5;
    const clamped = Math.max(min, Math.min(max, value));
    return (clamped - min) / (max - min);
  }

  /**
   * Calculate cost score (lower cost = higher score)
   * @param {number} cost - Agent cost in USDC
   * @returns {number} Cost score 0-1 (inverted)
   */
  scoreCost(cost) {
    const normalized = this.normalize(cost, this.ranges.cost.min, this.ranges.cost.max);
    // Invert: lower cost = higher score
    return 1 - normalized;
  }

  /**
   * Calculate quality score
   * @param {Object} quality - Quality metrics from AgentMetadata
   * @returns {number} Quality score 0-1
   */
  scoreQuality(quality) {
    if (!quality) return 0.5;
    // Average of accuracy, consistency, completeness
    const avg = (quality.accuracy + quality.consistency + quality.completeness) / 3;
    return this.normalize(avg, this.ranges.quality.min, this.ranges.quality.max);
  }

  /**
   * Calculate reliability score
   * @param {number} reliability - Reliability 0-1
   * @returns {number} Reliability score 0-1
   */
  scoreReliability(reliability) {
    return this.normalize(reliability, this.ranges.reliability.min, this.ranges.reliability.max);
  }

  /**
   * Calculate latency score (lower latency = higher score)
   * @param {number} latency - Average latency in ms
   * @returns {number} Latency score 0-1 (inverted)
   */
  scoreLatency(latency) {
    const normalized = this.normalize(latency, this.ranges.latency.min, this.ranges.latency.max);
    // Invert: lower latency = higher score
    return 1 - normalized;
  }

  /**
   * Calculate specialization score
   * @param {number} specializationScore - Specialization 0-1
   * @returns {number} Specialization score 0-1
   */
  scoreSpecialization(specializationScore) {
    return this.normalize(
      specializationScore,
      this.ranges.specialization.min,
      this.ranges.specialization.max
    );
  }

  /**
   * Calculate composite score for an agent
   * @param {Object} agent - Agent metadata
   * @param {Object} weights - Dimension weights (must sum to 1.0)
   * @param {Object} context - Execution context (cost limit, latency requirement, etc.)
   * @returns {Object} Detailed scoring breakdown
   */
  calculateCompositeScore(agent, weights = this.defaultWeights, context = {}) {
    // Individual dimension scores
    const scores = {
      cost: this.scoreCost(agent.cost.base),
      quality: this.scoreQuality(agent.quality),
      reliability: this.scoreReliability(agent.performance.reliability),
      latency: this.scoreLatency(agent.performance.avgLatency),
      specialization: this.scoreSpecialization(
        context.specializationScore || 0.5
      ),
    };

    // Apply weights and calculate composite
    const composite =
      scores.cost * weights.cost +
      scores.quality * weights.quality +
      scores.reliability * weights.reliability +
      scores.latency * weights.latency +
      scores.specialization * weights.specialization;

    return {
      composite: composite,
      scores: scores,
      weights: weights,
      breakdown: {
        costComponent: scores.cost * weights.cost,
        qualityComponent: scores.quality * weights.quality,
        reliabilityComponent: scores.reliability * weights.reliability,
        latencyComponent: scores.latency * weights.latency,
        specializationComponent: scores.specialization * weights.specialization,
      },
    };
  }

  /**
   * Validate weights sum to 1.0
   * @param {Object} weights - Dimension weights
   * @returns {boolean} True if valid
   */
  validateWeights(weights) {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    return Math.abs(sum - 1.0) < 0.001; // Allow for floating point error
  }

  /**
   * Rank multiple agents by score
   * @param {Array} agents - Array of agent metadata
   * @param {Object} weights - Dimension weights
   * @param {Object} context - Execution context
   * @returns {Array} Agents ranked by score (highest first)
   */
  rankAgents(agents, weights = this.defaultWeights, context = {}) {
    const scored = agents.map(agent => ({
      agent: agent,
      scoreResult: this.calculateCompositeScore(agent, weights, context),
    }));

    return scored.sort((a, b) => b.scoreResult.composite - a.scoreResult.composite);
  }

  /**
   * Filter agents by minimum acceptable score
   * @param {Array} agents - Array of agent metadata
   * @param {number} minScore - Minimum score threshold 0-1
   * @param {Object} weights - Dimension weights
   * @param {Object} context - Execution context
   * @returns {Array} Agents meeting minimum score
   */
  filterByMinScore(agents, minScore, weights = this.defaultWeights, context = {}) {
    return agents.filter(agent => {
      const result = this.calculateCompositeScore(agent, weights, context);
      return result.composite >= minScore;
    });
  }

  /**
   * Get strategy-specific weights
   * Returns weight distributions for different strategies
   * @returns {Object} Weights for each strategy
   */
  getStrategyWeights() {
    return {
      cheap: {
        cost: 0.5,
        quality: 0.2,
        reliability: 0.15,
        latency: 0.1,
        specialization: 0.05,
      },
      balanced: {
        cost: 0.2,
        quality: 0.25,
        reliability: 0.25,
        latency: 0.2,
        specialization: 0.1,
      },
      premium: {
        cost: 0.05,
        quality: 0.35,
        reliability: 0.35,
        latency: 0.15,
        specialization: 0.1,
      },
      hybrid: {
        cost: 0.2,
        quality: 0.3,
        reliability: 0.2,
        latency: 0.15,
        specialization: 0.15,
      },
    };
  }
}

export default ScoringSchema;
