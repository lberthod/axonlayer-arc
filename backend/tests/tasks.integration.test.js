import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// Auth disabled for tests — we want to hit the task pipeline without Firebase.
process.env.AUTH_ENABLED = 'false';

let app;
let ledger;
let paymentAdapter;

beforeAll(async () => {
  const ledgerMod = await import('../src/core/ledger.js');
  ledger = ledgerMod.default;
  await ledger.reset();

  const adapterMod = await import('../src/core/paymentAdapter.js');
  paymentAdapter = adapterMod.default;
  await paymentAdapter.initializeWallets();

  const appMod = await import('../src/app.js');
  app = appMod.default;

  // Ensure agents are seeded in the registry
  const registryMod = await import('../src/core/agentRegistry.js');
  registryMod.default.seedDefaults();

  // Fund the treasury store for task execution
  const treasuryMod = await import('../src/core/treasuryStore.js');
  const treasuryStore = treasuryMod.default;
  treasuryStore.balance = 100;
  await treasuryStore.save();
});

describe('POST /api/tasks', () => {
  it('rejects missing input', async () => {
    const r = await request(app).post('/api/tasks').send({ taskType: 'summarize' });
    expect(r.status).toBe(400);
  });

  it('rejects unknown taskType', async () => {
    const r = await request(app).post('/api/tasks').send({ input: 'hello world', taskType: 'nope' });
    expect(r.status).toBe(400);
  });

  it('executes a full summarize pipeline and enforces ledger invariant', async () => {
    const r = await request(app)
      .post('/api/tasks')
      .send({ input: 'The quick brown fox jumps over the lazy dog. It did it many times today.', taskType: 'summarize' });

    expect(r.status).toBe(200);
    expect(r.body.taskId).toBeTruthy();
    expect(['completed', 'failed']).toContain(r.body.status);

    // Task executed successfully - check pricing invariant
    if (r.body.pricing) {
      const { clientPayment, workerPayment, validatorPayment, orchestratorMargin } = r.body.pricing;
      const sum = workerPayment + validatorPayment + orchestratorMargin;
      expect(Math.abs(sum - clientPayment)).toBeLessThan(1e-6);
    }
  });
});

describe('GET /api/health + /api/config', () => {
  it('exposes liveness status on /api/health', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
    expect(typeof r.body.uptimeSec).toBe('number');
  });

  it('exposes settlement mode on /api/ready', async () => {
    const r = await request(app).get('/api/ready');
    expect([200, 503]).toContain(r.status);
    expect(typeof r.body.settlementMode).toBe('string');
  });

  it('exposes config metadata', async () => {
    const r = await request(app).get('/api/config');
    expect(r.status).toBe(200);
    expect(r.body.asset).toBe('USDC');
    expect(r.body.wallets.client).toBeTruthy();
  });
});
