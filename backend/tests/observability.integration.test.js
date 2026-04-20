import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

process.env.AUTH_ENABLED = 'false';

let app;

beforeAll(async () => {
  const ledgerMod = await import('../src/core/ledger.js');
  await ledgerMod.default.reset();
  const adapterMod = await import('../src/core/paymentAdapter.js');
  await adapterMod.default.initializeWallets();
  const appMod = await import('../src/app.js');
  app = appMod.default;
});

describe('observability endpoints', () => {
  it('GET /api/health returns liveness payload', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
    expect(typeof r.body.uptimeSec).toBe('number');
    expect(typeof r.body.version).toBe('string');
  });

  it('GET /api/ready returns readiness + checks', async () => {
    const r = await request(app).get('/api/ready');
    expect([200, 503]).toContain(r.status);
    expect(r.body.checks.ledger).toBeDefined();
    expect(r.body.checks.onchain).toBeDefined();
    expect(r.body.checks.auth).toBeDefined();
  });

  it('GET /api/metrics/prometheus returns Prometheus exposition format', async () => {
    // fire one task to populate counters
    await request(app)
      .post('/api/tasks')
      .send({ input: 'This is a long enough input text for a quick summarization job.', taskType: 'summarize' });

    const r = await request(app).get('/api/metrics/prometheus');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toMatch(/text\/plain/);
    // contains some default Node metric + our custom ones
    expect(r.text).toMatch(/process_cpu_user_seconds_total/);
    expect(r.text).toMatch(/http_requests_total/);
  });

  it('GET /api/openapi.json returns a valid-looking OpenAPI doc', async () => {
    const r = await request(app).get('/api/openapi.json');
    expect(r.status).toBe(200);
    expect(r.body.openapi).toMatch(/^3\./);
    expect(r.body.paths['/api/tasks']).toBeDefined();
  });
});
