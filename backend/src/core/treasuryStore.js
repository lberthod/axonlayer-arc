import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_STORE_PATH = path.join(__dirname, '../data/treasury.json');

/**
 * Treasury Store - Manages the orchestrator treasury state
 *
 * The treasury is the central wallet that:
 * - Receives mission funding from user mission wallets
 * - Pays agents for their work
 * - Retains platform fees
 * - Refunds unused budget to user mission wallets
 *
 * This store provides:
 * - Persistent treasury state on disk
 * - Atomic balance updates
 * - Transaction history
 */
class TreasuryStore {
  constructor(storePath = DEFAULT_STORE_PATH, initialConfig = {}) {
    this.storePath = storePath;
    this.address = initialConfig.address || '0xA89044f1d22e8CD292B3Db092C8De28eB1728d74';
    this.balance = initialConfig.balance || 0;
    this.feeRate = initialConfig.feeRate || 0.2;
    this.reserved = 0; // Total reserved for active missions
    this.history = []; // Transaction history
    this.writeChain = Promise.resolve();
  }

  async load() {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.address = parsed.address || this.address;
      this.balance = parsed.balance || 0;
      this.feeRate = parsed.feeRate || 0.2;
      this.reserved = parsed.reserved || 0;
      this.history = parsed.history || [];
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[treasuryStore] failed to read store (${error.code}): ${error.message}`);
      }
      // Initialize with defaults
      this.balance = 0;
      this.feeRate = 0.2;
      this.reserved = 0;
      this.history = [];
    }
  }

  async save() {
    const snapshot = JSON.stringify(
      {
        address: this.address,
        balance: this.balance,
        feeRate: this.feeRate,
        reserved: this.reserved,
        history: this.history
      },
      null,
      2
    );
    const tmpPath = `${this.storePath}.${process.pid}.${Date.now()}.tmp`;

    this.writeChain = this.writeChain.then(async () => {
      await fs.mkdir(path.dirname(this.storePath), { recursive: true });
      await fs.writeFile(tmpPath, snapshot);
      await fs.rename(tmpPath, this.storePath);
    });

    return this.writeChain;
  }

  normalizeAmount(value) {
    return Number(Number(value).toFixed(6));
  }

  getBalance() {
    return this.balance;
  }

  getReserved() {
    return this.reserved;
  }

  getAvailable() {
    return this.normalizeAmount(this.balance - this.reserved);
  }

  getFeeRate() {
    return this.feeRate;
  }

  getAddress() {
    return this.address;
  }

  async setBalance(amount) {
    this.balance = this.normalizeAmount(amount);
    await this.save();
    return this.balance;
  }

  /**
   * Add funds to treasury (mission funding)
   */
  async addFunds(amount, reason, taskId, chainTxHash = null) {
    const normalized = this.normalizeAmount(amount);
    this.balance = this.normalizeAmount(this.balance + normalized);
    this.reserved = this.normalizeAmount(this.reserved + normalized);

    this.history.push({
      type: 'fund',
      amount: normalized,
      reason,
      taskId,
      chainTxHash,
      balanceAfter: this.balance,
      timestamp: new Date().toISOString()
    });

    await this.save();
    return {
      balance: this.balance,
      reserved: this.reserved,
      amount: normalized
    };
  }

  /**
   * Pay agent from treasury with fee split
   */
  async payAgent(amount, reason, taskId) {
    const normalized = this.normalizeAmount(amount);
    const fee = this.normalizeAmount(normalized * this.feeRate);
    const agentAmount = this.normalizeAmount(normalized - fee);

    // Deduct full amount from treasury
    this.balance = this.normalizeAmount(this.balance - normalized);
    this.reserved = this.normalizeAmount(this.reserved - normalized);

    this.history.push({
      type: 'agent_payment',
      grossAmount: normalized,
      fee,
      netAmount: agentAmount,
      reason,
      taskId,
      balanceAfter: this.balance,
      timestamp: new Date().toISOString()
    });

    await this.save();
    return {
      balance: this.balance,
      reserved: this.reserved,
      grossAmount: normalized,
      fee,
      netAmount: agentAmount
    };
  }

  /**
   * Refund unused budget to user mission wallet
   */
  async refund(amount, reason, taskId) {
    const normalized = this.normalizeAmount(amount);
    this.balance = this.normalizeAmount(this.balance - normalized);

    this.history.push({
      type: 'refund',
      amount: normalized,
      reason,
      taskId,
      balanceAfter: this.balance,
      timestamp: new Date().toISOString()
    });

    await this.save();
    return {
      balance: this.balance,
      amount: normalized
    };
  }

  /**
   * Get transaction history
   */
  getHistory(filters = {}) {
    let history = [...this.history];

    if (filters.taskId) {
      history = history.filter(h => h.taskId === filters.taskId);
    }

    if (filters.type) {
      history = history.filter(h => h.type === filters.type);
    }

    if (filters.limit) {
      history = history.slice(-Number(filters.limit));
    }

    return history;
  }

  /**
   * Clear treasury history for a specific user (when user resets wallets)
   */
  async clearUserHistory(uid) {
    // This is a placeholder - treasury is global, not per-user
    // But we can archive history by filtering out old entries if needed
    // For now, we just log the action
    console.log(`[treasuryStore] User ${uid} reset wallets - treasury history retained for audit`);
  }

  /**
   * Reset treasury (for testing)
   */
  async reset() {
    this.balance = 0;
    this.reserved = 0;
    this.history = [];
    await this.save();
  }
}

export { TreasuryStore };
export default new TreasuryStore();
