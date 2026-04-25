import userStore from './userStore.js';
import paymentAdapter from './paymentAdapter.js';
import ledger from './ledger.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * TreasuryFlowService manages the 3-step transaction flow:
 * 1. User Treasury Wallet → Orchestrator (allocation)
 * 2. Orchestrator executes mission (pays agents, validates)
 * 3. Orchestrator → User Treasury Wallet (return surplus)
 */
class TreasuryFlowService {
  /**
   * Step 1: Transfer budget from user's Treasury Wallet to Orchestrator
   * Returns the transaction with tracking ID
   */
  async allocateFundsToOrchestrator(uid, amount, taskId) {
    try {
      const user = userStore.getByUid(uid);
      if (!user) {
        throw new Error(`User ${uid} not found`);
      }

      if (!user.treasuryWallet?.address) {
        throw new Error(`User ${uid} has no Treasury Wallet`);
      }

      const treasuryAddress = user.treasuryWallet.address;

      // Create allocation transaction
      const tx = await paymentAdapter.transfer(
        treasuryAddress,
        'orchestrator_wallet',
        amount,
        `Allocate funds for mission ${taskId}`,
        taskId,
        'treasury_allocation'
      );

      logger.info(
        { uid, taskId, amount, treasuryAddress },
        '[TreasuryFlow] Step 1: Allocated funds to Orchestrator'
      );

      return {
        step: 1,
        type: 'treasury_allocation',
        from: treasuryAddress,
        to: 'orchestrator_wallet',
        amount,
        taskId,
        transaction: tx
      };
    } catch (err) {
      logger.error({ uid, taskId, amount, err: err.message }, '[TreasuryFlow] Step 1 failed');
      throw err;
    }
  }

  /**
   * Step 3: Return remaining funds from Orchestrator to user's Treasury Wallet
   * Called after mission execution to return surplus
   */
  async returnSurplusToTreasury(uid, amount, taskId, spentAmount) {
    try {
      const user = userStore.getByUid(uid);
      if (!user) {
        throw new Error(`User ${uid} not found`);
      }

      if (!user.treasuryWallet?.address) {
        throw new Error(`User ${uid} has no Treasury Wallet`);
      }

      const treasuryAddress = user.treasuryWallet.address;
      const surplus = amount - spentAmount;

      if (surplus <= 0) {
        logger.info({ uid, taskId, amount, spentAmount }, '[TreasuryFlow] No surplus to return');
        return {
          step: 3,
          type: 'treasury_return',
          from: 'orchestrator_wallet',
          to: treasuryAddress,
          amount: 0,
          taskId,
          transaction: null,
          surplus: 0
        };
      }

      // Create return transaction
      const tx = await paymentAdapter.transfer(
        'orchestrator_wallet',
        treasuryAddress,
        surplus,
        `Return surplus from mission ${taskId}`,
        taskId,
        'treasury_return'
      );

      logger.info(
        { uid, taskId, allocated: amount, spent: spentAmount, surplus },
        '[TreasuryFlow] Step 3: Returned surplus to Treasury'
      );

      return {
        step: 3,
        type: 'treasury_return',
        from: 'orchestrator_wallet',
        to: treasuryAddress,
        amount: surplus,
        taskId,
        transaction: tx,
        surplus
      };
    } catch (err) {
      logger.error({ uid, taskId, amount, spentAmount, err: err.message }, '[TreasuryFlow] Step 3 failed');
      throw err;
    }
  }

  /**
   * Get the full transaction history for a mission's treasury flow
   */
  async getMissionFlowTransactions(taskId) {
    try {
      const transactions = await paymentAdapter.getTransactions({ taskId });
      const flow = {
        step1_allocation: null,
        step2_execution: [],
        step3_return: null
      };

      for (const tx of transactions) {
        if (tx.type === 'treasury_allocation') {
          flow.step1_allocation = tx;
        } else if (tx.type === 'treasury_return') {
          flow.step3_return = tx;
        } else {
          flow.step2_execution.push(tx);
        }
      }

      return flow;
    } catch (err) {
      logger.error({ taskId, err: err.message }, '[TreasuryFlow] Failed to get mission flow');
      throw err;
    }
  }
}

export default new TreasuryFlowService();
