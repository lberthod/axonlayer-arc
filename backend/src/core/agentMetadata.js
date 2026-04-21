/**
 * Agent Metadata Manager for V2 Orchestration
 *
 * Extended metadata for agents including:
 * - Declared capabilities
 * - Performance metrics (latency, reliability)
 * - Specialization scores
 * - Cost profiles
 */

class AgentMetadata {
  constructor() {
    // In-memory metadata store
    // In production: persistent database
    this.agents = new Map();
  }

  /**
   * Register agent with extended metadata
   * @param {string} agentId - Unique agent identifier
   * @param {Object} metadata - Agent metadata
   * @returns {Object} Registered metadata
   */
  registerAgent(agentId, metadata) {
    const normalized = this.normalizeMetadata(agentId, metadata);
    this.agents.set(agentId, normalized);
    return normalized;
  }

  /**
   * Normalize and validate metadata
   * @param {string} agentId - Agent ID
   * @param {Object} metadata - Raw metadata
   * @returns {Object} Normalized metadata
   */
  normalizeMetadata(agentId, metadata) {
    return {
      id: agentId,
      name: metadata.name || agentId,
      type: metadata.type || 'worker', // worker | validator | orchestrator
      version: metadata.version || '1.0.0',

      // Declared capabilities (from CapabilityTaxonomy)
      capabilities: metadata.capabilities || [],

      // Input/output specifications
      inputTypes: metadata.inputTypes || ['string'],
      outputTypes: metadata.outputTypes || ['string'],

      // Performance characteristics
      performance: {
        // Average latency in ms
        avgLatency: metadata.performance?.avgLatency || 100,
        // Min/max latency bounds
        minLatency: metadata.performance?.minLatency || 50,
        maxLatency: metadata.performance?.maxLatency || 500,
        // Reliability: 0-1 (percentage of successful executions)
        reliability: Math.min(1, Math.max(0, metadata.performance?.reliability || 0.95)),
        // Success rate in percentage
        successRate: metadata.performance?.successRate || 95,
      },

      // Cost profile (base cost in USDC)
      cost: {
        base: metadata.cost?.base || 0.0001, // Base cost per execution
        perChar: metadata.cost?.perChar || 0.00001, // Per character multiplier
        minCost: metadata.cost?.minCost || 0.00005,
        maxCost: metadata.cost?.maxCost || 0.001,
      },

      // Specialization scores (0-1 for each capability category)
      specialization: {
        computation: metadata.specialization?.computation || 0.5,
        validation: metadata.specialization?.validation || 0.5,
        analysis: metadata.specialization?.analysis || 0.5,
        synthesis: metadata.specialization?.synthesis || 0.5,
        transformation: metadata.specialization?.transformation || 0.5,
      },

      // Quality metrics
      quality: {
        // Accuracy score 0-1
        accuracy: metadata.quality?.accuracy || 0.9,
        // Consistency score 0-1
        consistency: metadata.quality?.consistency || 0.9,
        // Completeness score 0-1
        completeness: metadata.quality?.completeness || 0.85,
      },

      // Availability
      availability: {
        // Is agent currently available
        available: metadata.availability?.available !== false,
        // Max concurrent tasks
        maxConcurrent: metadata.availability?.maxConcurrent || 10,
        // Current load
        currentLoad: metadata.availability?.currentLoad || 0,
      },

      // Historical performance
      history: {
        // Total executions
        totalExecutions: metadata.history?.totalExecutions || 0,
        // Total tasks completed successfully
        successfulExecutions: metadata.history?.successfulExecutions || 0,
        // Average execution time
        avgExecutionTime: metadata.history?.avgExecutionTime || 100,
        // Last updated timestamp
        lastUpdated: metadata.history?.lastUpdated || Date.now(),
      },

      // SLA (Service Level Agreement)
      sla: {
        // Maximum acceptable latency for SLA compliance
        maxLatencySLA: metadata.sla?.maxLatencySLA || 1000,
        // Minimum uptime percentage
        minUptime: metadata.sla?.minUptime || 99,
      },

      // Metadata version tracking
      metadataVersion: 2,
      registeredAt: metadata.registeredAt || Date.now(),
    };
  }

  /**
   * Get agent metadata
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Agent metadata or null
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }

  /**
   * Update agent metadata (partial update)
   * @param {string} agentId - Agent ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated metadata or null
   */
  updateAgent(agentId, updates) {
    const existing = this.agents.get(agentId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      // Nested objects need special handling
      performance: { ...existing.performance, ...updates.performance },
      cost: { ...existing.cost, ...updates.cost },
      specialization: { ...existing.specialization, ...updates.specialization },
      quality: { ...existing.quality, ...updates.quality },
      availability: { ...existing.availability, ...updates.availability },
      history: { ...existing.history, ...updates.history },
      sla: { ...existing.sla, ...updates.sla },
    };

    this.agents.set(agentId, updated);
    return updated;
  }

  /**
   * Record execution result for agent
   * Updates history and performance metrics
   * @param {string} agentId - Agent ID
   * @param {Object} result - Execution result
   */
  recordExecution(agentId, result) {
    const agent = this.getAgent(agentId);
    if (!agent) return;

    const history = agent.history;
    history.totalExecutions += 1;
    if (result.success) {
      history.successfulExecutions += 1;
    }

    // Update average execution time (rolling average)
    history.avgExecutionTime =
      (history.avgExecutionTime * (history.totalExecutions - 1) + result.executionTime) /
      history.totalExecutions;

    // Recalculate reliability
    const newReliability = history.successfulExecutions / history.totalExecutions;
    agent.performance.reliability = newReliability;

    history.lastUpdated = Date.now();
  }

  /**
   * Get all agents
   * @returns {Array} Array of all agent metadata
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Filter agents by capability
   * @param {string} capabilityId - Required capability ID
   * @returns {Array} Array of agents with capability
   */
  getAgentsByCapability(capabilityId) {
    return this.getAllAgents().filter(agent =>
      agent.capabilities.includes(capabilityId)
    );
  }

  /**
   * Get agents by type
   * @param {string} type - Agent type (worker|validator|orchestrator)
   * @returns {Array} Array of agents of type
   */
  getAgentsByType(type) {
    return this.getAllAgents().filter(agent => agent.type === type);
  }

  /**
   * Get available agents (not at capacity)
   * @returns {Array} Array of available agents
   */
  getAvailableAgents() {
    return this.getAllAgents().filter(agent =>
      agent.availability.available &&
      agent.availability.currentLoad < agent.availability.maxConcurrent
    );
  }

  /**
   * Clear all agents (for testing)
   */
  clear() {
    this.agents.clear();
  }
}

export default AgentMetadata;
