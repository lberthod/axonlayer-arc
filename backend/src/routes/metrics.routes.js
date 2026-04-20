import express from 'express';
import metricsEngine from '../core/metricsEngine.js';
import { register } from '../core/prometheus.js';
import { badRequest } from '../core/errors.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const windowMs = req.query.windowMs ? Number(req.query.windowMs) : undefined;

    if (windowMs !== undefined && (!Number.isFinite(windowMs) || windowMs < 0)) {
      throw badRequest('invalid_window', 'windowMs must be a non-negative number');
    }

    const metrics = await metricsEngine.compute({ windowMs });
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

// Prometheus scrape endpoint.
router.get('/prometheus', async (_req, res, next) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    next(err);
  }
});

export default router;
