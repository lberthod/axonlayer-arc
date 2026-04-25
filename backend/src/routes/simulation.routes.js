import express from 'express';
import orchestrator from '../agents/orchestratorAgent.js';
import SimulationEngine from '../core/simulationEngine.js';
import { simulateSchema, validateBody } from '../core/validation.js';

const router = express.Router();
const simulationEngine = new SimulationEngine(orchestrator);

// Regular simulation endpoint (returns full results at end)
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

// SSE endpoint for streaming batch progress
router.post('/stream', validateBody(simulateSchema), async (req, res, next) => {
  try {
    const { count, taskType, selectionStrategy } = req.body;

    // Set up SSE headers (CORS headers already set by middleware)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering for streaming

    const options = {
      taskType,
      selectionStrategy,
      onMissionComplete: (missionData, partialResults) => {
        // Send mission completion event
        res.write(`data: ${JSON.stringify({
          type: 'mission_complete',
          mission: missionData,
          progress: {
            completed: partialResults.executed + partialResults.failed,
            total: count,
            executed: partialResults.executed,
            failed: partialResults.failed
          }
        })}\n\n`);
      }
    };

    const results = await simulationEngine.runSimulation(count, options);

    // Send final results
    res.write(`data: ${JSON.stringify({
      type: 'batch_complete',
      results
    })}\n\n`);

    res.end();
  } catch (err) {
    console.error('[simulation stream error]', err.message);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: err.message
    })}\n\n`);
    res.end();
  }
});

export default router;
