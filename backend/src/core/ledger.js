import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_STORE_PATH = path.join(__dirname, '../data/store.json');

/**
 * In-memory USDC ledger mirrored to disk.
 *
 * Writes are:
 *   - serialized via opChain promise (no concurrent modifications to balances/transactions)
 *   - atomic via `write-tmp + rename` (never leaves the store half-written if the
 *     process crashes mid-write)
 *
 * Transactional invariants:
 *   - amount must be > 0
 *   - sender must have enough balance
 *   - balance mutation + transaction push happen together, then are persisted
 */
class Ledger {
  constructor(storePath = DEFAULT_STORE_PATH) {
    this.storePath = storePath;
    this.transactions = [];
    this.balances = {};
    this.writeChain = Promise.resolve();
    this.opChain = Promise.resolve();
  }

  async load() {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.transactions = parsed.transactions || [];
      this.balances = parsed.balances || {};
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[ledger] failed to read store (${error.code}): ${error.message}`);
      }
      this.transactions = [];
      this.balances = {};
    }
  }

  /**
   * Atomic + serialized write. Uses a temp file + rename so readers never
   * observe a half-written JSON.
   */
  async save() {
    const snapshot = JSON.stringify(
      { transactions: this.transactions, balances: this.balances },
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

  getBalance(walletId) {
    return this.balances[walletId] || 0;
  }

  getAllBalances() {
    return { ...this.balances };
  }

  getTransactions(filters = {}) {
    let txs = [...this.transactions];

    if (filters.taskId) {
      txs = txs.filter((tx) => tx.taskId === filters.taskId);
    }

    if (filters.wallet) {
      txs = txs.filter((tx) => tx.from === filters.wallet || tx.to === filters.wallet);
    }

    if (filters.latest) {
      txs = txs.slice(-Number(filters.latest));
    }

    return txs;
  }

  /**
   * Serialize balance mutations so two concurrent requests cannot both read a
   * stale balance and over-spend it. All transactional work goes through the
   * opChain (promise chain = mutex).
   */
  async createTransaction(from, to, amount, asset, reason, taskId, type = 'payment', chainTxHash = null, settlementType = 'simulated') {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return {
        valid: false,
        error: 'Invalid transaction amount'
      };
    }

    const normalizedAmount = this.normalizeAmount(parsedAmount);

    const run = async () => {
      try {
        if (this.balances[from] === undefined) this.balances[from] = 0;
        if (this.balances[to] === undefined) this.balances[to] = 0;

        if (this.balances[from] < normalizedAmount) {
          return {
            valid: false,
            error: `Insufficient balance in ${from}: have ${this.balances[from]}, need ${normalizedAmount}`
          };
        }

        const transaction = {
          id: `tx_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
          from,
          to,
          amount: normalizedAmount,
          asset,
          reason,
          taskId,
          type,
          timestamp: new Date().toISOString(),
          status: 'completed',
          settlementType,
          chainTxHash,
          valid: true
        };

        this.balances[from] = this.normalizeAmount(this.balances[from] - normalizedAmount);
        this.balances[to] = this.normalizeAmount(this.balances[to] + normalizedAmount);
        this.transactions.push(transaction);

        await this.save();
        return transaction;
      } catch (err) {
        return {
          valid: false,
          error: err.message
        };
      }
    };

    // Chain-based mutex: next tx waits for the previous one to finish.
    const previous = this.opChain.catch(() => {});
    this.opChain = previous.then(run);
    return this.opChain;
  }

  async setInitialBalances(initialBalances) {
    this.balances = Object.fromEntries(
      Object.entries(initialBalances).map(([wallet, balance]) => [
        wallet,
        this.normalizeAmount(balance)
      ])
    );

    await this.save();
  }

  async reset() {
    this.transactions = [];
    this.balances = {};
    await this.save();
  }
}

export { Ledger };
export default new Ledger();
