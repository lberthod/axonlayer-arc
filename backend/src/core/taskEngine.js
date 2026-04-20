import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import userStore from './userStore.js';
import walletProvider from './walletProvider.js';
import treasuryStore from './treasuryStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_STORE_PATH = path.join(__dirname, '../data/tasks.json');

/**
 * TaskEngine keeps tasks in memory AND mirrors them to disk so the task
 * history survives a restart (the ledger does, so the task history should
 * too — otherwise `/api/tasks/mine` returns nothing right after a deploy).
 *
 * Writes are serialized (promise chain) and atomic (tmp + rename).
 */
class TaskEngine {
  constructor(storePath = DEFAULT_STORE_PATH) {
    this.storePath = storePath;
    this.tasks = new Map();
    this.writeChain = Promise.resolve();
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = await fs.readFile(this.storePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.tasks)) {
        for (const t of parsed.tasks) this.tasks.set(t.id, t);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`[taskEngine] failed to read store: ${error.message}`);
      }
    }
  }

  #persist() {
    const snapshot = JSON.stringify(
      { tasks: Array.from(this.tasks.values()) },
      null,
      2
    );
    const tmp = `${this.storePath}.${process.pid}.${Date.now()}.tmp`;
    this.writeChain = this.writeChain.then(async () => {
      await fs.mkdir(path.dirname(this.storePath), { recursive: true });
      await fs.writeFile(tmp, snapshot);
      await fs.rename(tmp, this.storePath);
    });
    return this.writeChain;
  }

  createTask(input, taskType = 'summarize', meta = {}) {
    const now = new Date().toISOString();

    const task = {
      id: `task_${uuidv4()}`,
      input,
      taskType,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      result: null,
      validation: null,
      transactions: [],
      requesterUid: meta.requesterUid || null,
      providerIds: meta.providerIds || null
    };

    this.tasks.set(task.id, task);
    this.#persist();
    return task;
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  updateTaskStatus(taskId, status) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
      this.#persist();
    }
    return task;
  }

  setTaskResult(taskId, result) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.result = result;
      task.updatedAt = new Date().toISOString();
      this.#persist();
    }
    return task;
  }

  setTaskValidation(taskId, validation) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.validation = validation;
      task.updatedAt = new Date().toISOString();
      this.#persist();
    }
    return task;
  }

  setTaskTransactions(taskId, transactions) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.transactions = Array.isArray(transactions) ? transactions : [];
      task.updatedAt = new Date().toISOString();
      this.#persist();
    }
    return task;
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  async reset() {
    this.tasks.clear();
    await this.#persist();
  }

  normalizeAmount(value) {
    return Number(Number(value).toFixed(6));
  }

  calculateSummary(tasks) {
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    return {
      totalTasks: tasks.length,
      completedTasks,
      grossVolume: this.normalizeAmount(completedTasks * config.pricing.clientPayment),
      workerRevenue: this.normalizeAmount(completedTasks * config.pricing.workerPayment),
      validatorRevenue: this.normalizeAmount(completedTasks * config.pricing.validatorPayment),
      orchestratorMargin: this.normalizeAmount(completedTasks * config.pricing.orchestratorMargin)
    };
  }

  async fundMission(userUid, amount, taskId) {
    const user = userStore.getByUid(userUid);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.missionWallet) {
      throw new Error('User mission wallet not found');
    }

    if (user.missionWallet.balance < amount) {
      throw new Error(`Insufficient balance: ${user.missionWallet.balance} < ${amount}`);
    }

    // Deduct from user mission wallet
    user.missionWallet.balance = this.normalizeAmount(user.missionWallet.balance - amount);
    await userStore.store.flush();

    // Add to treasury balance
    await treasuryStore.addFunds(amount, 'Mission funding', taskId);

    // Record the funding transaction in ledger
    await walletProvider.transfer(
      user.missionWallet.address,
      treasuryStore.getAddress(),
      amount,
      config.asset,
      'Mission funding',
      taskId,
      'fund'
    );

    return {
      status: 'funded',
      amount,
      from: user.missionWallet.address,
      to: treasuryStore.getAddress()
    };
  }

  async refundUnusedBudget(userUid, taskId, budget, spent) {
    const unused = this.normalizeAmount(budget - spent);
    if (unused <= 0) {
      return { refunded: 0 };
    }

    const user = userStore.getByUid(userUid);
    if (!user || !user.missionWallet) {
      throw new Error('User mission wallet not found');
    }

    // Deduct from treasury balance
    await treasuryStore.refund(unused, 'Mission refund', taskId);

    // Add back to user mission wallet
    user.missionWallet.balance = this.normalizeAmount(user.missionWallet.balance + unused);
    await userStore.store.flush();

    // Record the refund transaction in ledger
    await walletProvider.transfer(
      treasuryStore.getAddress(),
      user.missionWallet.address,
      unused,
      config.asset,
      'Mission refund',
      taskId,
      'refund'
    );

    return {
      refunded: unused,
      from: treasuryStore.getAddress(),
      to: user.missionWallet.address
    };
  }
}

export { TaskEngine };
export default new TaskEngine();
