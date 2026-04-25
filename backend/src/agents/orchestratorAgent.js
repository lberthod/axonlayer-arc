import BaseAgent from './baseAgent.js';
import { config } from '../config.js';
import taskEngine from '../core/taskEngine.js';
import paymentAdapter from '../core/paymentAdapter.js';
import agentRegistry from '../core/agentRegistry.js';
import pricingEngine from '../core/pricingEngine.js';
import providerStore from '../core/providerStore.js';
import treasuryStore from '../core/treasuryStore.js';
import { recordTaskMetric } from '../core/prometheus.js';

class OrchestratorAgent extends BaseAgent {
  constructor() {
    super('Orchestrator', config.wallets.orchestrator);
  }

  splitPayment(amount) {
    const fee = amount * treasuryStore.getFeeRate();
    const agentAmount = amount - fee;
    return { fee, agentAmount };
  }

  async payAgentFromTreasury(agentWalletId, amount, reason, taskId) {
    const treasuryBalance = treasuryStore.getBalance();
    if (treasuryBalance < amount) {
      throw new Error(`Treasury insufficient: ${treasuryBalance} < ${amount}`);
    }

    // Pay agent through treasury store
    const result = await treasuryStore.payAgent(amount, reason, taskId);

    // Record the payment in ledger using wallet ID instead of address
    await paymentAdapter.transfer(
      'orchestrator_wallet',
      agentWalletId,
      result.netAmount,
      reason,
      taskId,
      'agent_payment'
    );

    return {
      amount: result.grossAmount,
      fee: result.fee,
      netAmount: result.netAmount,
      from: 'orchestrator_wallet',
      to: agentWalletId
    };
  }

  async executeTask(inputText, taskType = 'summarize', options = {}) {
    console.log(`[Orchestrator] Starting task execution: taskType=${taskType}`);
    const task = taskEngine.createTask(inputText, taskType, {
      requesterUid: options.requesterUid || null
    });
    const executionSteps = [];
    const budget = options.budget || config.pricing.clientPayment;
    let totalSpent = 0;

    console.log(`[Orchestrator] Task created: ${task.id}, budget=${budget}`);
    const workerEntry = agentRegistry.selectWorker(taskType, options.selectionStrategy);
    const validatorEntry = agentRegistry.selectValidator(options.selectionStrategy);
    console.log(`[Orchestrator] Selected worker: ${workerEntry?.id}, validator: ${validatorEntry?.id}`);

    if (!workerEntry) {
      taskEngine.updateTaskStatus(task.id, 'failed');
      return {
        taskId: task.id,
        status: 'failed',
        error: `No worker available for task type "${taskType}"`,
        executionSteps,
        settlementType: paymentAdapter.mode
      };
    }

    const worker = workerEntry.agent;
    const validator = validatorEntry.agent;

    const pricing = pricingEngine.price({
      input: inputText,
      taskType,
      workerQuote: workerEntry.basePrice,
      validatorQuote: validatorEntry.basePrice
    });

    task.pricing = pricing;
    task.selectedWorker = workerEntry.id;
    task.selectedValidator = validatorEntry.id;
    task.budget = budget;

    try {
      executionSteps.push({
        step: 1,
        message: 'Task received',
        timestamp: new Date().toISOString()
      });

      // Fund mission from user wallet to treasury
      if (options.requesterUid) {
        console.log(`[Orchestrator:step2] Funding mission: uid=${options.requesterUid}, amount=${budget}`);
        const fundResult = await taskEngine.fundMission(options.requesterUid, budget, task.id);

        // Check if funding is pending due to temporary RPC issue
        if (fundResult.status === 'funding_pending') {
          console.warn(`[Orchestrator:step2] ⚠ Funding pending (retryable): ${fundResult.error}`);
          taskEngine.updateTaskStatus(task.id, 'funding_retry_pending');

          executionSteps.push({
            step: 2,
            message: `Funding pending (RPC busy): ${fundResult.error}. Task can be retried.`,
            timestamp: new Date().toISOString()
          });

          return {
            taskId: task.id,
            status: 'funding_retry_pending',
            error: fundResult.error,
            canRetry: true,
            retryInfo: {
              userUid: fundResult.userUid,
              amount: fundResult.amount,
              taskId: fundResult.taskId
            },
            executionSteps,
            settlementType: paymentAdapter.mode
          };
        }

        executionSteps.push({
          step: 2,
          message: `Mission funded: ${budget} USDC from user wallet to treasury`,
          timestamp: new Date().toISOString()
        });
        console.log(`[Orchestrator:step2] ✓ Mission funded successfully`);
      }

      // Pay worker from treasury with platform fee
      console.log(`[Orchestrator:step3] Paying worker: ${workerEntry.id}`);
      const { fee: workerFee, agentAmount: workerNetAmount } = this.splitPayment(pricing.workerPayment);
      await this.payAgentFromTreasury(
        worker.walletId,
        workerNetAmount,
        `Payment for ${workerEntry.id}`,
        task.id
      );
      totalSpent += pricing.workerPayment;

      executionSteps.push({
        step: 3,
        message: `Worker "${workerEntry.id}" paid ${workerNetAmount.toFixed(6)} USDC (fee: ${workerFee.toFixed(6)})`,
        timestamp: new Date().toISOString()
      });
      console.log(`[Orchestrator:step3] ✓ Worker paid`);

      console.log(`[Orchestrator:step4] Executing worker task`);
      const workerResult = await worker.execute({
        text: inputText,
        taskType,
        targetLang: options.targetLang
      });
      console.log(`[Orchestrator:step4] ✓ Worker executed: result="${workerResult.result?.substring(0, 180)}"${workerResult.result?.length > 180 ? '...' : ''}`);

      executionSteps.push({
        step: 4,
        message: `Worker "${workerEntry.id}" executed task`,
        timestamp: new Date().toISOString()
      });

      // Pay validator from treasury with platform fee
      console.log(`[Orchestrator:step5] Paying validator: ${validatorEntry.id}`);
      const { fee: validatorFee, agentAmount: validatorNetAmount } = this.splitPayment(pricing.validatorPayment);
      await this.payAgentFromTreasury(
        validator.walletId,
        validatorNetAmount,
        `Payment for ${validatorEntry.id}`,
        task.id
      );
      totalSpent += pricing.validatorPayment;

      executionSteps.push({
        step: 5,
        message: `Validator "${validatorEntry.id}" paid ${validatorNetAmount.toFixed(6)} USDC (fee: ${validatorFee.toFixed(6)})`,
        timestamp: new Date().toISOString()
      });
      console.log(`[Orchestrator:step5] ✓ Validator paid`);

      console.log(`[Orchestrator:step6] Running validator`);
      const validationResult = await validator.execute({
        result: workerResult.result,
        originalText: inputText
      });
      console.log(`[Orchestrator:step6] ✓ Validation result: valid=${validationResult.validation.valid}, score=${validationResult.validation.score}`);

      executionSteps.push({
        step: 6,
        message: `Validator "${validatorEntry.id}" checked result`,
        timestamp: new Date().toISOString()
      });

      taskEngine.setTaskResult(task.id, workerResult.result);
      taskEngine.setTaskValidation(task.id, validationResult.validation);
      taskEngine.updateTaskStatus(
        task.id,
        validationResult.validation.valid ? 'completed' : 'failed'
      );

      agentRegistry.recordOutcome('worker', workerEntry.id, {
        success: validationResult.validation.valid,
        scoreFeedback: validationResult.validation.score
      });
      agentRegistry.recordOutcome('validator', validatorEntry.id, {
        success: true,
        scoreFeedback: validationResult.validation.score
      });

      // Marketplace providers: persist outcome + auto-slash on validation failure
      if (workerEntry.providerId) {
        await providerStore.recordOutcome(workerEntry.providerId, {
          success: validationResult.validation.valid,
          amount: pricing.workerPayment,
          score: validationResult.validation.score
        });
        if (!validationResult.validation.valid) {
          await providerStore.slash(
            workerEntry.providerId,
            config.marketplace.slashPenalty,
            `Task ${task.id} failed validation (score ${validationResult.validation.score})`
          );
        }
      }
      if (validatorEntry.providerId) {
        await providerStore.recordOutcome(validatorEntry.providerId, {
          success: true,
          amount: pricing.validatorPayment,
          score: 1
        });
      }

      // Refund unused budget
      let refundResult = { refunded: 0 };
      if (options.requesterUid) {
        refundResult = await taskEngine.refundUnusedBudget(options.requesterUid, task.id, budget, totalSpent);
        executionSteps.push({
          step: 7,
          message: refundResult.refunded > 0
            ? `Refunded ${refundResult.refunded.toFixed(6)} USDC to user wallet`
            : 'No refund needed (budget fully utilized)',
          timestamp: new Date().toISOString()
        });
      }

      const transactions = await paymentAdapter.getTransactions({ taskId: task.id });
      taskEngine.setTaskTransactions(task.id, transactions);

      executionSteps.push({
        step: 8,
        message: 'Task completed',
        timestamp: new Date().toISOString()
      });

      const updatedTask = taskEngine.getTask(task.id);

      recordTaskMetric({
        taskType,
        status: updatedTask.status,
        pricing
      });

      return {
        taskId: updatedTask.id,
        status: updatedTask.status,
        result: updatedTask.result,
        validation: updatedTask.validation,
        transactions,
        balances: await paymentAdapter.getAllBalances(),
        executionSteps,
        margin: pricing.orchestratorMargin,
        platformFee: workerFee + validatorFee,
        budget,
        spent: totalSpent,
        refunded: refundResult.refunded,
        pricing,
        selectedAgents: {
          worker: {
            id: workerEntry.id,
            ownerId: workerEntry.ownerId,
            ownerName: workerEntry.ownerName
          },
          validator: {
            id: validatorEntry.id,
            ownerId: validatorEntry.ownerId,
            ownerName: validatorEntry.ownerName
          }
        },
        settlementType: paymentAdapter.mode
      };
    } catch (error) {
      const errorLocation = `${error.stack?.split('\n')[1] || 'unknown'}`;
      console.error(`[Orchestrator:ERROR] Mission failed at: ${errorLocation}`);
      console.error(`[Orchestrator:ERROR] Error message: ${error.message}`);
      console.error(`[Orchestrator:ERROR] Full stack:\n${error.stack}`);

      taskEngine.updateTaskStatus(task.id, 'failed');

      agentRegistry.recordOutcome('worker', workerEntry.id, { success: false });
      recordTaskMetric({ taskType, status: 'failed' });

      // Refund on error
      if (options.requesterUid && totalSpent < budget) {
        try {
          console.log(`[Orchestrator] Refunding unused budget: ${budget - totalSpent} USDC`);
          await taskEngine.refundUnusedBudget(options.requesterUid, task.id, budget, totalSpent);
          console.log(`[Orchestrator] ✓ Refund successful`);
        } catch (refundError) {
          console.error('[Orchestrator] Refund failed:', refundError.message);
        }
      }

      executionSteps.push({
        step: 99,
        message: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        location: errorLocation
      });

      return {
        taskId: task.id,
        status: 'failed',
        error: error.message,
        errorLocation: errorLocation,
        errorStack: error.stack,
        executionSteps,
        settlementType: paymentAdapter.mode
      };
    }
  }
}

export { OrchestratorAgent };
export default new OrchestratorAgent();
