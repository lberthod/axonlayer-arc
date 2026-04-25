import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import tasksRoutes from './routes/tasks.routes.js';
import balancesRoutes from './routes/balances.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import simulationRoutes from './routes/simulation.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import agentsRoutes from './routes/agents.routes.js';
import authRoutes from './routes/auth.routes.js';
import providersRoutes from './routes/providers.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { authMiddleware } from './core/auth.js';
import userStore from './core/userStore.js';
import { config } from './config.js';
import { httpLogger, logger } from './core/logger.js';
import {
  globalLimiter,
  tasksLimiter,
  simulationLimiter,
  authLimiter
} from './core/rateLimit.js';
import { idempotencyMiddleware } from './core/idempotency.js';
import { errorHandler, notFoundHandler } from './core/errors.js';
import { httpMetricsMiddleware } from './core/prometheus.js';
import { liveness, readiness } from './core/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust the first proxy so req.ip reflects X-Forwarded-For in prod.
app.set('trust proxy', 1);

app.use(helmet());
app.use(httpLogger());
app.use(httpMetricsMiddleware());

// Force CORS headers on all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// CORS allowlist — '*' allows any origin (dev only).
const corsOrigins = config.security.corsOrigins;
app.use(
  cors({
    origin: true,
    credentials: false
  })
);

app.use(express.json({ limit: '256kb' }));
app.use(authMiddleware());

// Dev mode: auto-populate req.user with first user if not authenticated
// This allows testing without Firebase authentication
if (!config.auth.enabled) {
  app.use((req, res, next) => {
    if (!req.user) {
      const users = Object.values(userStore.users);
      const firstUser = users[0];
      if (firstUser) {
        req.user = firstUser;
        req.role = firstUser.role || 'user';
      }
    }
    next();
  });
}

// Global rate limit protects every endpoint.
app.use(globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', tasksLimiter, idempotencyMiddleware(), tasksRoutes);
app.use('/api/balances', balancesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/simulate', simulationLimiter, simulationRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/agents', agentsRoutes);

app.get('/api/health', async (_req, res, next) => {
  try {
    res.json(await liveness());
  } catch (err) {
    next(err);
  }
});

app.get('/api/ready', async (_req, res, next) => {
  try {
    const body = await readiness();
    res.status(body.status === 'ok' ? 200 : 503).json(body);
  } catch (err) {
    next(err);
  }
});

// OpenAPI spec + Swagger UI.
const openapiPath = path.join(__dirname, 'openapi.yaml');
let openapiDoc = {};
try {
  openapiDoc = YAML.parse(fs.readFileSync(openapiPath, 'utf-8'));
} catch (err) {
  logger.warn({ err: err.message }, '[openapi] could not load spec');
}
app.get('/api/openapi.json', (_req, res) => res.json(openapiDoc));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { explorer: true }));

app.get('/api/config', (req, res) => {
  res.json({
    asset: config.asset,
    wallets: config.wallets,
    pricing: config.pricing,
    walletProvider: {
      mode: config.walletProvider.mode,
      dryRun: config.walletProvider.onChain?.dryRun,
      network: config.walletProvider.onChain?.network,
      label: config.walletProvider.onChain?.label,
      chainId: config.walletProvider.onChain?.chainId,
      explorer: config.walletProvider.onChain?.explorer,
      faucet: config.walletProvider.onChain?.faucet
    },
    registry: config.registry
  });
});

app.use(notFoundHandler());
app.use(errorHandler(logger));

export default app;
