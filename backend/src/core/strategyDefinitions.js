/**
 * Strategy Definitions for V2 Agent Selection
 *
 * Four strategies with different optimization objectives:
 * 1. CHEAP - Minimize cost, accept lower quality
 * 2. BALANCED - Optimize cost/quality trade-off
 * 3. PREMIUM - Maximize quality, cost secondary
 * 4. HYBRID - Task-aware dynamic selection
 */

class StrategyDefinitions {
  constructor() {
    this.strategies = {
      CHEAP: 'cheap',
      BALANCED: 'balanced',
      PREMIUM: 'premium',
      HYBRID: 'hybrid',
    };
  }

  /**
   * Get strategy definition with all parameters
   * @param {string} strategy - Strategy name
   * @returns {Object} Complete strategy definition
   */
  getStrategy(strategy) {
    switch (strategy.toLowerCase()) {
      case this.strategies.CHEAP:
        return this.getCheapStrategy();
      case this.strategies.BALANCED:
        return this.getBalancedStrategy();
      case this.strategies.PREMIUM:
        return this.getPremiumStrategy();
      case this.strategies.HYBRID:
        return this.getHybridStrategy();
      default:
        return this.getBalancedStrategy(); // Default fallback
    }
  }

  /**
   * CHEAP Strategy: Minimize costs, acceptable quality
   * Use case: High-frequency tasks, cost-sensitive workloads
   */
  getCheapStrategy() {
    return {
      name: 'cheap',
      description: 'Minimize cost, accept adequate quality',
      objective: 'cost-optimization',

      // Scoring weights
      weights: {
        cost: 0.50,        // Cost is primary driver
        quality: 0.20,     // Quality acceptable but not primary
        reliability: 0.15, // Some reliability required
        latency: 0.10,     // Latency less critical
        specialization: 0.05, // Specialization bonus
      },

      // Constraints
      constraints: {
        minQuality: 0.70,           // Minimum acceptable quality
        minReliability: 0.85,       // Minimum acceptable reliability
        maxLatency: 2000,           // Maximum acceptable latency (ms)
        maxCost: 0.001,             // Maximum cost per task
      },

      // Selection parameters
      selection: {
        topCandidates: 3,           // Consider top 3 cheapest
        fallbackChain: 2,           // Have 2 fallback options
        parallelization: false,     // Don't use parallel execution
      },

      // Budget parameters
      budget: {
        adaptive: true,             // Adjust based on budget
        costMultiplier: 1.0,        // Don't increase cost
        riskTolerance: 'high',      // Accept higher risk for cost savings
      },

      // Expected outcomes
      expectedOutcomes: {
        avgCost: 0.0002,            // Expected average cost
        avgQuality: 0.85,           // Expected quality
        successRate: 0.90,          // Expected success rate
        avgLatency: 300,            // Expected latency ms
      },
    };
  }

  /**
   * BALANCED Strategy: Optimize cost-quality trade-off
   * Use case: Standard workloads, balanced optimization
   */
  getBalancedStrategy() {
    return {
      name: 'balanced',
      description: 'Balance cost and quality',
      objective: 'cost-quality-tradeoff',

      // Scoring weights
      weights: {
        cost: 0.20,          // Cost important
        quality: 0.25,       // Quality important
        reliability: 0.25,   // Reliability important
        latency: 0.20,       // Latency important
        specialization: 0.10, // Specialization bonus
      },

      // Constraints
      constraints: {
        minQuality: 0.80,
        minReliability: 0.90,
        maxLatency: 1000,
        maxCost: 0.0005,
      },

      // Selection parameters
      selection: {
        topCandidates: 5,
        fallbackChain: 2,
        parallelization: false,
      },

      // Budget parameters
      budget: {
        adaptive: true,
        costMultiplier: 1.0,
        riskTolerance: 'medium',
      },

      // Expected outcomes
      expectedOutcomes: {
        avgCost: 0.0003,
        avgQuality: 0.90,
        successRate: 0.95,
        avgLatency: 150,
      },
    };
  }

  /**
   * PREMIUM Strategy: Maximize quality, cost secondary
   * Use case: Critical tasks, high-stakes workloads
   */
  getPremiumStrategy() {
    return {
      name: 'premium',
      description: 'Maximize quality and reliability',
      objective: 'quality-optimization',

      // Scoring weights
      weights: {
        cost: 0.05,           // Cost is minimal concern
        quality: 0.35,        // Quality is primary
        reliability: 0.35,    // Reliability is primary
        latency: 0.15,        // Latency important for SLA
        specialization: 0.10, // Specialization bonus
      },

      // Constraints
      constraints: {
        minQuality: 0.95,
        minReliability: 0.98,
        maxLatency: 500,
        maxCost: 0.002,       // Higher cost acceptable
      },

      // Selection parameters
      selection: {
        topCandidates: 1,     // Select best quality agent
        fallbackChain: 3,     // Have 3 fallback options
        parallelization: true, // Parallel validation
      },

      // Budget parameters
      budget: {
        adaptive: false,      // Don't adjust for budget
        costMultiplier: 1.5,  // Accept 50% cost premium
        riskTolerance: 'low', // No risk tolerance
      },

      // Expected outcomes
      expectedOutcomes: {
        avgCost: 0.0008,
        avgQuality: 0.97,
        successRate: 0.99,
        avgLatency: 200,
      },
    };
  }

  /**
   * HYBRID Strategy: Task-aware dynamic selection
   * Use case: Mixed workloads, adaptive execution
   */
  getHybridStrategy() {
    return {
      name: 'hybrid',
      description: 'Adapt strategy based on task characteristics',
      objective: 'task-aware-optimization',

      // Base weights (will be adjusted per task)
      weights: {
        cost: 0.20,
        quality: 0.30,
        reliability: 0.20,
        latency: 0.15,
        specialization: 0.15,
      },

      // Constraints
      constraints: {
        minQuality: 0.80,
        minReliability: 0.90,
        maxLatency: 1000,
        maxCost: 0.0005,
      },

      // Selection parameters
      selection: {
        topCandidates: 5,
        fallbackChain: 2,
        parallelization: 'dynamic', // Parallel if high complexity
      },

      // Budget parameters
      budget: {
        adaptive: true,
        costMultiplier: 'dynamic', // Adjust based on budget
        riskTolerance: 'medium',
      },

      // Task-specific adjustments
      // These override base weights based on task properties
      taskAdjustments: {
        'high-complexity': {
          quality: 0.40,      // Prioritize quality for complex tasks
          latency: 0.10,      // Latency less critical
          cost: 0.10,         // Cost secondary
        },
        'time-critical': {
          latency: 0.35,      // Prioritize latency
          reliability: 0.30,  // Ensure reliability
          cost: 0.10,         // Cost less critical
          quality: 0.15,
        },
        'cost-critical': {
          cost: 0.40,         // Prioritize cost
          quality: 0.30,      // Maintain quality
          reliability: 0.20,
          latency: 0.05,
        },
        'high-stakes': {
          quality: 0.40,      // Maximize quality
          reliability: 0.40,  // Maximize reliability
          cost: 0.05,
          latency: 0.10,
        },
      },

      // Expected outcomes
      expectedOutcomes: {
        avgCost: 0.0004,
        avgQuality: 0.92,
        successRate: 0.96,
        avgLatency: 180,
      },
    };
  }

  /**
   * Validate strategy name
   * @param {string} strategy - Strategy name
   * @returns {boolean} True if valid strategy
   */
  isValidStrategy(strategy) {
    return Object.values(this.strategies).includes(strategy.toLowerCase());
  }

  /**
   * Get all available strategies
   * @returns {Array} Array of strategy names
   */
  getAllStrategies() {
    return Object.values(this.strategies);
  }

  /**
   * Get strategy weights
   * @param {string} strategy - Strategy name
   * @param {Object} taskContext - Optional task context for adjustments
   * @returns {Object} Weights object
   */
  getWeights(strategy, taskContext = {}) {
    const strategyDef = this.getStrategy(strategy);
    let weights = { ...strategyDef.weights };

    // Apply task-specific adjustments if using HYBRID
    if (strategy.toLowerCase() === this.strategies.HYBRID && taskContext.taskType) {
      const adjustment = strategyDef.taskAdjustments[taskContext.taskType];
      if (adjustment) {
        weights = { ...weights, ...adjustment };
      }
    }

    return weights;
  }

  /**
   * Get strategy constraints
   * @param {string} strategy - Strategy name
   * @returns {Object} Constraints object
   */
  getConstraints(strategy) {
    return this.getStrategy(strategy).constraints;
  }

  /**
   * Compare strategies
   * @returns {Array} Array of all strategies with their definitions
   */
  compareAll() {
    return [
      this.getCheapStrategy(),
      this.getBalancedStrategy(),
      this.getPremiumStrategy(),
      this.getHybridStrategy(),
    ];
  }
}

export default StrategyDefinitions;
