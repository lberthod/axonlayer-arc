/**
 * Capability Taxonomy for V2 Orchestration
 *
 * Defines the complete set of capabilities agents can declare
 * Used for intelligent matching and selection
 */

class CapabilityTaxonomy {
  constructor() {
    // Core capability categories
    this.categories = {
      COMPUTATION: 'computation',
      VALIDATION: 'validation',
      ANALYSIS: 'analysis',
      SYNTHESIS: 'synthesis',
      TRANSFORMATION: 'transformation',
    };

    // Computation capabilities
    this.computation = {
      SIMPLE_MATH: { id: 'compute.simple_math', category: 'computation', cost: 0.001, latency: 50 },
      COMPLEX_MATH: { id: 'compute.complex_math', category: 'computation', cost: 0.002, latency: 200 },
      CRYPTO_OPS: { id: 'compute.crypto_ops', category: 'computation', cost: 0.003, latency: 150 },
      SCHEDULING: { id: 'compute.scheduling', category: 'computation', cost: 0.002, latency: 300 },
    };

    // Validation capabilities
    this.validation = {
      FORMAT_CHECK: { id: 'validate.format', category: 'validation', cost: 0.001, latency: 50 },
      SIGNATURE_VERIFY: { id: 'validate.signature', category: 'validation', cost: 0.002, latency: 100 },
      CONSENSUS_CHECK: { id: 'validate.consensus', category: 'validation', cost: 0.003, latency: 500 },
      SECURITY_AUDIT: { id: 'validate.security', category: 'validation', cost: 0.004, latency: 1000 },
    };

    // Analysis capabilities
    this.analysis = {
      PATTERN_DETECT: { id: 'analyze.pattern', category: 'analysis', cost: 0.002, latency: 200 },
      RISK_ASSESS: { id: 'analyze.risk', category: 'analysis', cost: 0.003, latency: 400 },
      TREND_ANALYSIS: { id: 'analyze.trend', category: 'analysis', cost: 0.002, latency: 300 },
      ANOMALY_DETECT: { id: 'analyze.anomaly', category: 'analysis', cost: 0.003, latency: 500 },
    };

    // Synthesis capabilities
    this.synthesis = {
      GENERATE_REPORT: { id: 'synthesize.report', category: 'synthesis', cost: 0.002, latency: 300 },
      SUMMARIZE: { id: 'synthesize.summary', category: 'synthesis', cost: 0.001, latency: 100 },
      COMPOSE_MESSAGE: { id: 'synthesize.message', category: 'synthesis', cost: 0.001, latency: 80 },
      CREATE_PLAN: { id: 'synthesize.plan', category: 'synthesis', cost: 0.002, latency: 400 },
    };

    // Transformation capabilities
    this.transformation = {
      FORMAT_CONVERT: { id: 'transform.format', category: 'transformation', cost: 0.001, latency: 100 },
      DATA_NORMALIZE: { id: 'transform.normalize', category: 'transformation', cost: 0.002, latency: 150 },
      COMPRESS: { id: 'transform.compress', category: 'transformation', cost: 0.001, latency: 80 },
      ENCRYPT: { id: 'transform.encrypt', category: 'transformation', cost: 0.003, latency: 200 },
    };

    // Task type to capability mapping
    this.taskCapabilityMap = {
      'simple': [
        this.computation.SIMPLE_MATH,
        this.validation.FORMAT_CHECK,
        this.synthesis.SUMMARIZE,
        this.transformation.FORMAT_CONVERT,
      ],
      'complex': [
        this.computation.COMPLEX_MATH,
        this.computation.CRYPTO_OPS,
        this.analysis.PATTERN_DETECT,
        this.synthesis.GENERATE_REPORT,
      ],
      'security': [
        this.validation.SIGNATURE_VERIFY,
        this.validation.SECURITY_AUDIT,
        this.analysis.RISK_ASSESS,
        this.transformation.ENCRYPT,
      ],
      'analytics': [
        this.analysis.PATTERN_DETECT,
        this.analysis.RISK_ASSESS,
        this.analysis.TREND_ANALYSIS,
        this.analysis.ANOMALY_DETECT,
      ],
    };
  }

  /**
   * Get all capabilities for a task type
   * @param {string} taskType - The type of task
   * @returns {Array} Array of capability objects
   */
  getCapabilitiesForTask(taskType) {
    return this.taskCapabilityMap[taskType] || [];
  }

  /**
   * Get capability by ID
   * @param {string} capabilityId - The capability ID
   * @returns {Object|null} The capability object or null
   */
  getCapabilityById(capabilityId) {
    const allCapabilities = [
      ...Object.values(this.computation),
      ...Object.values(this.validation),
      ...Object.values(this.analysis),
      ...Object.values(this.synthesis),
      ...Object.values(this.transformation),
    ];
    return allCapabilities.find(cap => cap.id === capabilityId) || null;
  }

  /**
   * Validate if agent has required capabilities
   * @param {Array} agentCapabilities - Array of capability IDs agent has
   * @param {Array} requiredCapabilities - Array of capability IDs required
   * @returns {boolean} True if agent has all required capabilities
   */
  meetsRequirements(agentCapabilities, requiredCapabilities) {
    return requiredCapabilities.every(reqCap =>
      agentCapabilities.includes(reqCap.id || reqCap)
    );
  }

  /**
   * Calculate capability score for agent
   * Measures how well-suited agent is for a task
   * @param {Array} agentCapabilities - Agent's capability IDs
   * @param {Array} taskCapabilities - Task's required capabilities
   * @returns {number} Score 0-1
   */
  calculateCapabilityScore(agentCapabilities, taskCapabilities) {
    if (taskCapabilities.length === 0) return 1.0;

    const matches = taskCapabilities.filter(taskCap =>
      agentCapabilities.includes(taskCap.id)
    ).length;

    return matches / taskCapabilities.length;
  }

  /**
   * Get all capabilities
   * @returns {Object} All capabilities organized by category
   */
  getAll() {
    return {
      computation: this.computation,
      validation: this.validation,
      analysis: this.analysis,
      synthesis: this.synthesis,
      transformation: this.transformation,
    };
  }
}

export default CapabilityTaxonomy;
