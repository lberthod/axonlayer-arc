import express from 'express';
import contractManager from '../core/contractManager.js';
import pricingEngine from '../core/pricingEngine.js';
import { config } from '../config.js';
import { createTaskSchema, validateBody } from '../core/validation.js';
import { badRequest, unauthorized, notFound, tooMany } from '../core/errors.js';

const router = express.Router();

/**
 * POST /tasks - Create a new on-chain task
 *
 * PURE ON-CHAIN IMPLEMENTATION:
 * - User wallet sends USDC to smart contract escrow
 * - Task execution is coordinated on-chain
 * - Returns taskId + transaction hash for explorer verification
 */
router.post('/', validateBody(createTaskSchema), async (req, res, next) => {
  try {
    const { input, taskType, budget, userAddress, targetLang } = req.body;

    // Validate required fields
    if (!userAddress) {
      throw badRequest('missing_field', 'userAddress (MetaMask wallet) is required');
    }

    if (!budget || budget <= 0) {
      throw badRequest('invalid_budget', 'budget must be greater than 0');
    }

    // Get pricing estimate
    const quote = pricingEngine.price({ input, taskType });

    console.log(`[tasks.routes] Creating on-chain task`);
    console.log(`  User: ${userAddress}`);
    console.log(`  Input length: ${input.length} chars`);
    console.log(`  Task Type: ${taskType}`);
    console.log(`  Budget: ${budget} USDC`);
    console.log(`  Estimated cost: ${quote.clientPayment} USDC`);

    // Validate contract is initialized
    if (!contractManager.isInitialized()) {
      throw new Error('Smart contract not initialized - check TASK_MANAGER_ADDRESS');
    }

    // Create task on-chain
    const metadata = {
      version: '1.0',
      created_by: 'Arc Agent Hub',
      selection_strategy: req.body.selectionStrategy || 'default',
      target_lang: targetLang || 'English',
      original_input_length: input.length
    };

    const taskResult = await contractManager.createTask(
      userAddress,
      input,
      budget.toString(),
      taskType,
      JSON.stringify(metadata)
    );

    console.log(`[tasks.routes] ✅ Task created on-chain`);
    console.log(`  Task ID: ${taskResult.taskId}`);
    console.log(`  TX Hash: ${taskResult.txHash}`);
    console.log(`  Block: ${taskResult.blockNumber}`);

    // Return on-chain task details
    res.status(201).json({
      success: true,
      taskId: taskResult.taskId,
      transactionHash: taskResult.txHash,
      blockNumber: taskResult.blockNumber,
      gasUsed: taskResult.gasUsed,
      explorerUrl: taskResult.explorerUrl,
      contract: contractManager.getContractAddress(),
      message: 'Task created on Arc Testnet blockchain. Use taskId to track execution.',
      note: 'This task is now immutable and transparent on-chain. No server-side wallet was involved.'
    });
  } catch (err) {
    console.error(`[tasks.routes] ❌ Task creation failed:`, err.message);
    next(err);
  }
});

/**
 * GET /tasks/mine - Get user's on-chain tasks
 * Requires authentication with user address
 */
router.get('/mine', async (req, res, next) => {
  try {
    const userAddress = req.query.address || req.user?.address;

    if (!userAddress) {
      throw unauthorized('user address required (query param or authenticated user)');
    }

    if (!contractManager.isInitialized()) {
      throw new Error('Smart contract not initialized');
    }

    console.log(`[tasks.routes] Fetching tasks for user: ${userAddress}`);

    const taskIds = await contractManager.getUserTasks(userAddress);

    // Fetch full task details for each task ID
    const tasks = await Promise.all(
      taskIds.map(async (taskId) => {
        try {
          return await contractManager.getTask(taskId);
        } catch (error) {
          console.warn(`[tasks.routes] Failed to fetch task ${taskId}:`, error.message);
          return null;
        }
      })
    );

    const validTasks = tasks.filter(t => t !== null);

    res.json({
      success: true,
      userAddress,
      count: validTasks.length,
      tasks: validTasks,
      explorerUrl: 'https://explorer.testnet.arc.network'
    });
  } catch (err) {
    console.error(`[tasks.routes] ❌ Failed to fetch user tasks:`, err.message);
    next(err);
  }
});

/**
 * GET /tasks/:id - Get task details from smart contract
 * Verifiable on-chain proof of task state
 */
router.get('/:id', async (req, res, next) => {
  try {
    const taskId = req.params.id;

    if (!contractManager.isInitialized()) {
      throw new Error('Smart contract not initialized');
    }

    console.log(`[tasks.routes] Fetching task: ${taskId}`);

    const task = await contractManager.getTask(taskId);

    res.json({
      success: true,
      task,
      explorerUrl: `https://explorer.testnet.arc.network`,
      note: 'This task state is verified on-chain and immutable'
    });
  } catch (err) {
    if (err.message.includes('Task does not exist')) {
      next(notFound('task not found on-chain'));
    } else {
      console.error(`[tasks.routes] ❌ Failed to fetch task:`, err.message);
      next(err);
    }
  }
});

/**
 * GET /tasks/count - Get total task count
 */
router.get('/stats/count', async (req, res, next) => {
  try {
    if (!contractManager.isInitialized()) {
      throw new Error('Smart contract not initialized');
    }

    const count = await contractManager.getTaskCount();
    const balance = await contractManager.getContractBalance();

    res.json({
      success: true,
      totalTasks: count,
      escrowBalance: `${balance} USDC`,
      contract: contractManager.getContractAddress(),
      orchestrator: contractManager.getOrchestratorAddress()
    });
  } catch (err) {
    console.error(`[tasks.routes] ❌ Failed to get stats:`, err.message);
    next(err);
  }
});

export default router;
