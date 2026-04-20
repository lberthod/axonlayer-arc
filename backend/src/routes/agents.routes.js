import express from 'express';
import agentRegistry from '../core/agentRegistry.js';
import pricingEngine from '../core/pricingEngine.js';
import { config } from '../config.js';

const router = express.Router();

const VALID_STRATEGIES = ['price', 'score', 'score_price'];

router.get('/', (req, res) => {
  res.json({
    workers: agentRegistry.listWorkers(),
    validators: agentRegistry.listValidators(),
    strategy: config.registry.selectionStrategy,
    availableStrategies: VALID_STRATEGIES
  });
});

router.post('/quote', (req, res) => {
  try {
    const { input = '', taskType = 'summarize', strategy } = req.body || {};

    if (typeof input !== 'string') {
      return res.status(400).json({ error: 'input must be a string' });
    }

    if (strategy && !VALID_STRATEGIES.includes(strategy)) {
      return res.status(400).json({
        error: `Invalid strategy. Allowed: ${VALID_STRATEGIES.join(', ')}`
      });
    }

    const worker = agentRegistry.selectWorker(taskType, strategy);
    const validator = agentRegistry.selectValidator(strategy);

    if (!worker || !validator) {
      return res.status(404).json({ error: `No capable agents for taskType "${taskType}"` });
    }

    const pricing = pricingEngine.price({
      input,
      taskType,
      workerQuote: worker.basePrice,
      validatorQuote: validator.basePrice
    });

    res.json({
      taskType,
      strategy: strategy || config.registry.selectionStrategy,
      selected: {
        worker: {
          id: worker.id,
          name: worker.agent.name,
          basePrice: worker.basePrice,
          score: worker.score
        },
        validator: {
          id: validator.id,
          name: validator.agent.name,
          basePrice: validator.basePrice,
          score: validator.score
        }
      },
      pricing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
