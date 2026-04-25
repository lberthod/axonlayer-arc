import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import userStore from './userStore.js';
import treasuryStore from './treasuryStore.js';
import walletProvider from './walletProvider.js';

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
    console.log(`\n[fundMission] ===== FUND MISSION START =====`);
    console.log(`[fundMission] userUid: ${userUid}`);
    console.log(`[fundMission] amount: ${amount} USDC`);
    console.log(`[fundMission] taskId: ${taskId}`);

    // Always get fresh user data from store to ensure wallet info is current
    // (user may have regenerated wallets since last fetch)
    const user = userStore.getByUid(userUid);
    if (!user) {
      console.error(`[fundMission] ERROR: User not found for uid=${userUid}`);
      throw new Error('User not found');
    }

    console.log(`[fundMission] User found: ${user.email}`);
    console.log(`[fundMission] User has wallet: ${!!user.wallet}`);
    console.log(`[fundMission] User wallet address from store: ${user.wallet?.address || 'MISSING'}`);
    console.log(`[fundMission] User wallet has privateKey: ${!!user.wallet?.privateKey}`);
    console.log(`[fundMission] User wallet privateKey length: ${user.wallet?.privateKey?.length || 0}`);

    // Verify user has Mission Wallet (the one with USDC to send)
    if (!user.wallet || !user.wallet.address) {
      console.error(`[fundMission] ERROR: User Mission Wallet not found`);
      throw new Error(`User Mission Wallet not found for ${userUid}. Check user profile to ensure wallet exists.`);
    }

    // Use mission wallet directly from user data (bypass walletManager to avoid sync issues)
    const walletManager = (await import('./walletManager.js')).default;
    await walletManager.load();
    const orchestratorAddr = walletManager.getAddress('orchestrator_wallet');

    console.log(`[fundMission] Orchestrator wallet address: ${orchestratorAddr}`);

    // Create ethers signer directly from mission wallet private key
    const ethers = await walletManager.ensureEthers();
    const provider = await walletManager.getProvider();

    console.log(`[fundMission] Creating signer from private key...`);
    const missionSigner = new ethers.Wallet(user.wallet.privateKey, provider);

    console.log(`[fundMission] Signer address derived from privateKey: ${missionSigner.address}`);
    console.log(`[fundMission] Expected address from store: ${user.wallet.address}`);
    console.log(`[fundMission] Addresses match: ${missionSigner.address.toLowerCase() === user.wallet.address.toLowerCase()}`);
    console.log(`[fundMission] Will send FROM: ${missionSigner.address}`);
    console.log(`[fundMission] Will send TO: ${orchestratorAddr}`);
    console.log(`[fundMission] Amount to send: ${amount} USDC`);

    try {
      // Send transaction directly using mission wallet signer (Arc native USDC)
      const value = ethers.parseUnits(String(amount), 6);
      const tx = await missionSigner.sendTransaction({
        to: orchestratorAddr,
        value
      });

      // Wait for confirmation
      const receipt = await tx.wait(1);
      const chainTxHash = tx.hash;

      // Add to treasury balance (for tracking)
      await treasuryStore.addFunds(amount, 'Mission funding from Mission Wallet', taskId, chainTxHash);

      return {
        status: 'funded',
        amount,
        from: user.wallet.address, // ICI LOIC LOIC LOIC
        to: orchestratorAddr,
        chainTxHash,
        settlementType: 'onchain',
        retryable: false
      };
    } catch (err) {
      // Check if this is a retryable error (temporary RPC issue like txpool full)
      const isRetryable = err.message.includes('retryable') || err.message.includes('pool');

      if (isRetryable) {
        return {
          status: 'funding_pending',
          error: err.message,
          retryable: true,
          userUid,
          amount,
          taskId
        };
      }

      throw new Error(`Failed to fund mission on-chain: ${err.message}`);
    }
  }

  async refundUnusedBudget(userUid, taskId, budget, spent) {
    const unused = this.normalizeAmount(budget - spent);
    if (unused <= 0) {
      return { refunded: 0 };
    }

    const user = userStore.getByUid(userUid);
    if (!user || !user.wallet) {
      throw new Error('User Arc wallet not found');
    }

    // Deduct from treasury balance
    await treasuryStore.refund(unused, 'Mission refund to Arc wallet', taskId);

    // Add back to user Arc wallet balance
    user.balance = this.normalizeAmount(user.balance + unused);
    await userStore.store.flush();

    return {
      refunded: unused,
      from: treasuryStore.getAddress(),
      to: user.wallet.address  // Arc blockchain wallet
    };
  }
}

export { TaskEngine };
export default new TaskEngine();
