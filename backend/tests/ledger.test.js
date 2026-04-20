import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Ledger } from '../src/core/ledger.js';

async function freshLedger() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ledger-test-'));
  const l = new Ledger(path.join(dir, 'store.json'));
  await l.load();
  return { l, dir };
}

describe('Ledger', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await freshLedger();
  });

  it('sets initial balances and persists them atomically', async () => {
    await ctx.l.setInitialBalances({ alice: 10, bob: 0 });
    expect(ctx.l.getBalance('alice')).toBe(10);

    const raw = await fs.readFile(ctx.l.storePath, 'utf-8');
    const parsed = JSON.parse(raw); // never throws → atomic write worked
    expect(parsed.balances.alice).toBe(10);
  });

  it('rejects non-positive and invalid amounts', async () => {
    await ctx.l.setInitialBalances({ a: 1, b: 0 });
    const r1 = await ctx.l.createTransaction('a', 'b', 0, 'USDC', 'r', 't');
    expect(r1.valid).toBe(false);
    const r2 = await ctx.l.createTransaction('a', 'b', -1, 'USDC', 'r', 't');
    expect(r2.valid).toBe(false);
    const r3 = await ctx.l.createTransaction('a', 'b', 'nope', 'USDC', 'r', 't');
    expect(r3.valid).toBe(false);
  });

  it('refuses to overdraft', async () => {
    await ctx.l.setInitialBalances({ a: 0.5, b: 0 });
    const result = await ctx.l.createTransaction('a', 'b', 1, 'USDC', 'r', 't');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Insufficient/);
  });

  it('transfers atomically and keeps conservation of money', async () => {
    await ctx.l.setInitialBalances({ a: 1, b: 0 });
    await ctx.l.createTransaction('a', 'b', 0.3, 'USDC', 'r', 't1');
    expect(ctx.l.getBalance('a')).toBe(0.7);
    expect(ctx.l.getBalance('b')).toBe(0.3);
  });

  it('serializes concurrent transactions (no double-spend)', async () => {
    await ctx.l.setInitialBalances({ a: 1, b: 0 });

    // Fire 5 parallel transfers of 0.3 — only 3 can succeed (0.9 <= 1.0).
    const attempts = Array.from({ length: 5 }, (_, i) =>
      ctx.l.createTransaction('a', 'b', 0.3, 'USDC', 'r', `t${i}`)
    );
    const results = await Promise.all(attempts);

    const ok = results.filter((r) => r && r.valid === true);
    const ko = results.filter((r) => r && r.valid === false);

    expect(ok.length).toBe(3);
    expect(ko.length).toBe(2);
    expect(ctx.l.getBalance('a')).toBeCloseTo(0.1, 6);
    expect(ctx.l.getBalance('b')).toBeCloseTo(0.9, 6);
  });

  it('filters transactions by taskId and wallet', async () => {
    await ctx.l.setInitialBalances({ a: 5, b: 0, c: 0 });
    await ctx.l.createTransaction('a', 'b', 1, 'USDC', 'r', 'T1');
    await ctx.l.createTransaction('a', 'c', 1, 'USDC', 'r', 'T2');
    await ctx.l.createTransaction('b', 'c', 0.5, 'USDC', 'r', 'T2');

    expect(ctx.l.getTransactions({ taskId: 'T2' }).length).toBe(2);
    expect(ctx.l.getTransactions({ wallet: 'b' }).length).toBe(2);
    expect(ctx.l.getTransactions({ latest: 1 }).length).toBe(1);
  });

  it('reload reads back the exact same state', async () => {
    await ctx.l.setInitialBalances({ a: 2, b: 0 });
    await ctx.l.createTransaction('a', 'b', 0.25, 'USDC', 'r', 'T1');

    const l2 = new Ledger(ctx.l.storePath);
    await l2.load();
    expect(l2.getBalance('a')).toBe(1.75);
    expect(l2.getBalance('b')).toBe(0.25);
    expect(l2.getTransactions().length).toBe(1);
  });
});
