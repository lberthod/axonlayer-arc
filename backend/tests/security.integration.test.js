import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

process.env.AUTH_ENABLED = 'false';

let app;

beforeAll(async () => {
  const ledgerMod = await import('../src/core/ledger.js');
  await ledgerMod.default.reset();

  const adapterMod = await import('../src/core/paymentAdapter.js');
  await adapterMod.default.initializeWallets();

  const { _resetIdempotencyForTests } = await import('../src/core/idempotency.js');
  _resetIdempotencyForTests();

  const appMod = await import('../src/app.js');
  app = appMod.default;
});

describe('security middleware', () => {
  it('returns structured error on invalid body (zod)', async () => {
    const r = await request(app).post('/api/tasks').send({ taskType: 'nope' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('validation_failed');
    expect(Array.isArray(r.body.error.details)).toBe(true);
    expect(r.headers['x-request-id']).toBeTruthy();
    expect(r.body.error.requestId).toBe(r.headers['x-request-id']);
  });

  it('sets a request id on every response', async () => {
    const r = await request(app).get('/api/health');
    expect(r.headers['x-request-id']).toBeTruthy();
  });

  it('replays a cached response for the same Idempotency-Key', async () => {
    const key = 'test-idem-key-abcdef';
    const body = {
      input: 'A first task with enough words to validate properly.',
      taskType: 'summarize'
    };
    const r1 = await request(app)
      .post('/api/tasks')
      .set('Idempotency-Key', key)
      .send(body);
    expect([200, 400, 429]).toContain(r1.status);

    const r2 = await request(app)
      .post('/api/tasks')
      .set('Idempotency-Key', key)
      .send(body);

    // Second call must return the exact same body.
    expect(r2.status).toBe(r1.status);
    expect(r2.body).toEqual(r1.body);
    if (r1.status === 200) {
      expect(r2.headers['idempotent-replay']).toBe('true');
    }
  });

  it('rejects malformed Idempotency-Key', async () => {
    const r = await request(app)
      .post('/api/tasks')
      .set('Idempotency-Key', 'bad!')
      .send({ input: 'hello world hello world', taskType: 'summarize' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('invalid_idempotency_key');
  });

  it('returns a standardized 404 on unknown routes', async () => {
    const r = await request(app).get('/api/does-not-exist');
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe('not_found');
  });
});
