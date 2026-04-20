import taskEngine from './taskEngine.js';
import paymentAdapter from './paymentAdapter.js';
import agentRegistry from './agentRegistry.js';
import { config } from '../config.js';

/**
 * MetricsEngine: computes richer economic and operational KPIs on demand.
 * Reads from in-memory task state + ledger; no persistence of aggregates.
 */
class MetricsEngine {
  normalize(value) {
    return Number(Number(value).toFixed(6));
  }

  async compute({ windowMs } = {}) {
    const tasks = taskEngine.getAllTasks();
    const transactions = await paymentAdapter.getTransactions({});
    const balances = await paymentAdapter.getAllBalances();

    const now = Date.now();
    const cutoff = typeof windowMs === 'number' ? now - windowMs : 0;

    const relevantTasks = cutoff
      ? tasks.filter((t) => new Date(t.createdAt).getTime() >= cutoff)
      : tasks;

    const completed = relevantTasks.filter((t) => t.status === 'completed');
    const failed = relevantTasks.filter((t) => t.status === 'failed');

    const revenueByWallet = {};
    const volumeByTaskType = {};
    let grossVolume = 0;

    for (const tx of transactions) {
      if (cutoff && new Date(tx.timestamp).getTime() < cutoff) continue;
      revenueByWallet[tx.to] = this.normalize((revenueByWallet[tx.to] || 0) + tx.amount);
    }

    for (const task of completed) {
      const price = task.pricing?.clientPayment ?? config.pricing.clientPayment;
      grossVolume = this.normalize(grossVolume + price);
      volumeByTaskType[task.taskType] = this.normalize(
        (volumeByTaskType[task.taskType] || 0) + price
      );
    }

    const durations = completed
      .map((t) => new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime())
      .filter((d) => Number.isFinite(d) && d >= 0);

    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const successRate = relevantTasks.length === 0
      ? null
      : Number((completed.length / relevantTasks.length).toFixed(4));

    return {
      window: cutoff ? { windowMs, since: new Date(cutoff).toISOString() } : { windowMs: null },
      totals: {
        totalTasks: relevantTasks.length,
        completedTasks: completed.length,
        failedTasks: failed.length,
        transactions: transactions.filter(
          (tx) => !cutoff || new Date(tx.timestamp).getTime() >= cutoff
        ).length,
        grossVolume,
        avgDurationMs,
        successRate
      },
      revenueByWallet,
      volumeByTaskType,
      balances,
      agents: {
        workers: agentRegistry.listWorkers(),
        validators: agentRegistry.listValidators()
      },
      settlement: {
        mode: paymentAdapter.mode
      }
    };
  }
}

export default new MetricsEngine();
