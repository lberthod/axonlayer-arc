import express from 'express';
import orchestrator from '../agents/orchestratorAgent.js';
import taskEngine from '../core/taskEngine.js';
import userStore from '../core/userStore.js';
import pricingEngine from '../core/pricingEngine.js';
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

    // Pre-check: refuse the task if the user's mission wallet cannot afford the
    // upper bound of the dynamic price. Avoids starting a pipeline we know
    // will explode halfway through with an "Insufficient balance" mid-way.
    const quote = pricingEngine.price({ input, taskType });

    if (req.user) {
      // Check user's mission wallet balance (used to fund treasury for task execution)
      const userBalance = req.user.missionWallet?.balance || 0;

      if (userBalance < quote.clientPayment) {
        throw badRequest('insufficient_balance', 'mission wallet cannot afford this task', {
          required: quote.clientPayment,
          available: userBalance
        });
      }
    } else if (config.auth.enabled) {
      throw unauthorized('authentication required for mission execution (Bearer token or x-api-key)');
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

export default router;
