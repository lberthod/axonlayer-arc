import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

const json = (message) => (req, res) => {
  res.status(429).json({
    error: {
      code: 'rate_limited',
      message,
      requestId: req.id || null
    }
  });
};

const base = { standardHeaders: 'draft-7', legacyHeaders: false };

export const globalLimiter = rateLimit({
  ...base,
  windowMs: config.security.rateLimit.globalWindowMs,
  max: config.security.rateLimit.globalMax,
  handler: json('global rate limit exceeded')
});

export const tasksLimiter = rateLimit({
  ...base,
  windowMs: config.security.rateLimit.tasksWindowMs,
  max: config.security.rateLimit.tasksMax,
  handler: json('too many task submissions, slow down'),
  // Favor authenticated users: key by uid when available, fall back to IP.
  keyGenerator: (req) => req.user?.uid || req.ip
});

export const simulationLimiter = rateLimit({
  ...base,
  windowMs: config.security.rateLimit.simulationWindowMs,
  max: config.security.rateLimit.simulationMax,
  handler: json('simulation rate limit exceeded'),
  keyGenerator: (req) => req.user?.uid || req.ip
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: config.security.rateLimit.authWindowMs,
  max: config.security.rateLimit.authMax,
  handler: json('too many auth attempts')
});
