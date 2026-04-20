import express from 'express';
import orchestrator from '../agents/orchestratorAgent.js';
import SimulationEngine from '../core/simulationEngine.js';
import { simulateSchema, validateBody } from '../core/validation.js';

const router = express.Router();
const simulationEngine = new SimulationEngine(orchestrator);

router.post('/', validateBody(simulateSchema), async (req, res, next) => {
  try {
    const { count, taskType, selectionStrategy } = req.body;
    const options = {};
    if (taskType) options.taskType = taskType;
    if (selectionStrategy) options.selectionStrategy = selectionStrategy;
    const results = await simulationEngine.runSimulation(count, options);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
