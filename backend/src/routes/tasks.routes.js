import express from 'express';
import orchestrator from '../agents/orchestratorAgent.js';
import taskEngine from '../core/taskEngine.js';
import userStore from '../core/userStore.js';
import pricingEngine from '../core/pricingEngine.js';
import treasuryFlowService from '../core/treasuryFlowService.js';
import { config } from '../config.js';
import { createTaskSchema, validateBody } from '../core/validation.js';
import { badRequest, unauthorized, notFound, tooMany } from '../core/errors.js';

const router = express.Router();

router.post('/', validateBody(createTaskSchema), async (req, res, next) => {
  try {
    const { input, taskType, selectionStrategy, targetLang } = req.body;

    if (req.user) {
      const quota = userStore.checkQuota(req.user);
      if (!quota.ok) throw tooMany(quota.reason);
    } else if (config.auth.enabled) {
      throw unauthorized('authentication required (Bearer token or x-api-key)');
    }

    // Pre-check: refuse the task if the user's wallet cannot afford the
    // upper bound of the dynamic price. Avoids starting a pipeline we know
    // will explode halfway through with an "Insufficient balance" mid-way.
    const quote = pricingEngine.price({ input, taskType });

    if (req.user) {
      // Get fresh user data from store to ensure we have correct wallets
      const freshUser = userStore.getByUid(req.user.uid);
      if (!freshUser) {
        throw unauthorized('User not found in store');
      }

      // Check user's mission wallet balance (used to fund treasury for task execution)
      const userBalance = freshUser.balance || 0;

      if (userBalance < quote.clientPayment) {
        throw badRequest('insufficient_balance', 'insufficient balance to execute task', {
          required: quote.clientPayment,
          available: userBalance
        });
      }
    } else if (config.auth.enabled) {
      throw unauthorized('authentication required for task execution (Bearer token or x-api-key)');
    }

    const result = await orchestrator.executeTask(input, taskType, {
      selectionStrategy,
      targetLang,
      requesterUid: req.user?.uid || null
    });

    if (req.user && result.status === 'completed') {
      await userStore.recordUsage(req.user.uid, {
        amount: result.pricing?.clientPayment || 0
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', (req, res, next) => {
  try {
    if (!req.user) throw unauthorized();
    const tasks = taskEngine.getAllTasks().filter((t) => t.requesterUid === req.user.uid);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const task = taskEngine.getTask(req.params.id);
    if (!task) throw notFound('task not found');
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// 🔄 NEW: Treasury Flow Execution (3-step transaction process)
// Step 1: User Treasury Wallet → Orchestrator (allocation)
// Step 2: Orchestrator executes mission (pays agents, validates)
// Step 3: Orchestrator → User Treasury Wallet (return surplus)
router.post('/treasury-flow/execute', validateBody(createTaskSchema), async (req, res, next) => {
  try {
    if (!req.user) throw unauthorized('authentication required');

    const { input, taskType, selectionStrategy, targetLang } = req.body;
    const uid = req.user.uid;

    // Check quota
    const quota = userStore.checkQuota(req.user);
    if (!quota.ok) throw tooMany(quota.reason);

    // Get fresh user data from store to ensure current wallet info
    const user = userStore.getByUid(uid);
    if (!user) {
      throw unauthorized('User not found in store');
    }

    // Verify user has correct Treasury Wallet from profile
    if (!user.treasuryWallet?.address) {
      throw badRequest('no_treasury_wallet', `User ${uid} has no Treasury Wallet. Regenerate wallets in profile first.`);
    }

    // Get quote
    const quote = pricingEngine.price({ input, taskType });
    const budget = quote.clientPayment;

    // Check user's Mission Wallet balance (will be used to fund Treasury)
    const userBalance = user.balance || 0;
    if (userBalance < budget) {
      throw badRequest('insufficient_balance', 'insufficient balance to execute task', {
        required: budget,
        available: userBalance
      });
    }

    console.log(`[TreasuryFlow] User ${uid} treasury flow: treasuryWallet=${user.treasuryWallet.address}, balance=${userBalance}`);

    const task = taskEngine.createTask(input, taskType, { requesterUid: uid });
    const flowTransactions = [];

    try {
      // 🔴 STEP 1: Allocate funds from Treasury Wallet to Orchestrator
      console.log(`[TreasuryFlow] Step 1: Allocating ${budget} USDC to Orchestrator`);
      const allocationTx = await treasuryFlowService.allocateFundsToOrchestrator(uid, budget, task.id);
      flowTransactions.push(allocationTx);

      // 🟡 STEP 2: Execute mission (pays agents, validates)
      console.log(`[TreasuryFlow] Step 2: Executing mission`);
      const result = await orchestrator.executeTask(input, taskType, {
        selectionStrategy,
        targetLang,
        requesterUid: uid
      });

      // Calculate spent amount from mission result
      const spentAmount = result.pricing?.clientPayment || 0;
      result.treasuryFlow = { flowTransactions, spentAmount };

      // 🟢 STEP 3: Return surplus to Treasury Wallet (if any)
      console.log(`[TreasuryFlow] Step 3: Returning surplus (spent: ${spentAmount}, allocated: ${budget})`);
      const returnTx = await treasuryFlowService.returnSurplusToTreasury(uid, budget, task.id, spentAmount);
      flowTransactions.push(returnTx);

      result.treasuryFlow.flowTransactions = flowTransactions;

      // Record usage
      if (result.status === 'completed') {
        await userStore.recordUsage(uid, { amount: spentAmount });
      }

      res.json(result);
    } catch (err) {
      // If mission fails after allocation, still try to return funds
      console.error(`[TreasuryFlow] Mission failed, attempting to return allocated funds`);
      try {
        const returnTx = await treasuryFlowService.returnSurplusToTreasury(uid, budget, task.id, 0);
        flowTransactions.push(returnTx);
      } catch (returnErr) {
        console.error(`[TreasuryFlow] Failed to return funds:`, returnErr.message);
      }

      throw err;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
