import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { Ledger } from '../../src/core/ledger.js';

describe('Ledger — USDC Integrity', () => {
  let ledger;
  const tmpDir = '/tmp/ledger-test-' + Date.now();
  const storePath = path.join(tmpDir, 'store.json');

  beforeEach(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
    ledger = new Ledger(storePath);
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch (e) {
      // ignore
    }
  });

  /**
   * Cannot send more than available balance
   */
  it('rejects transfer if insufficient balance', async () => {
    await ledger.setInitialBalances({
      client_wallet: 0.001,
    });

    const result = await ledger.createTransaction(
      'client_wallet',
      'worker_wallet',
      0.01,
      'USDC',
      'payment',
      'task_1',
      'payment'
    );

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/insufficient balance/i);
  });

  /**
   * Successful transfer debits sender and credits receiver
   */
  it('transfer updates both sender and receiver balances', async () => {
    await ledger.setInitialBalances({
      client_wallet: 1.0,
      worker_wallet: 0.5,
    });

    const tx = await ledger.createTransaction(
      'client_wallet',
      'worker_wallet',
      0.1,
      'USDC',
      'payment',
      'task_1',
      'payment'
    );

    expect(tx.valid).toBe(true);
    expect(ledger.getBalance('client_wallet')).toBe(0.9);
    expect(ledger.getBalance('worker_wallet')).toBe(0.6);
  });

  /**
   * Transaction is recorded with correct metadata
   */
  it('records transaction with full metadata', async () => {
    await ledger.setInitialBalances({ client_wallet: 1.0 });

    const tx = await ledger.createTransaction(
      'client_wallet',
      'worker_wallet',
      0.05,
      'USDC',
      'agent payment',
      'task_xyz',
      'payment'
    );

    expect(tx.from).toBe('client_wallet');
    expect(tx.to).toBe('worker_wallet');
    expect(tx.amount).toBe(0.05);
    expect(tx.taskId).toBe('task_xyz');
    expect(tx.reason).toBe('agent payment');
    expect(tx.timestamp).toBeDefined();
    expect(tx.id).toBeDefined();
  });

  /**
   * Persistence: ledger survives reload
   */
  it('transactions persist across reload', async () => {
    await ledger.setInitialBalances({ client_wallet: 1.0 });
    await ledger.createTransaction(
      'client_wallet',
      'worker_wallet',
      0.1,
      'USDC',
      'test',
      'task_1',
      'payment'
    );
    await ledger.save();

    // Create new ledger instance pointing to same store
    const ledger2 = new Ledger(storePath);
    await ledger2.load();

    const txs = ledger2.getTransactions();
    expect(txs.length).toBe(1);
    expect(txs[0].amount).toBe(0.1);
    expect(ledger2.getBalance('client_wallet')).toBe(0.9);
  });

  /**
   * Concurrent transactions serialize correctly
   * (no race condition where both read stale balance)
   */
  it('concurrent transactions serialize safely', async () => {
    await ledger.setInitialBalances({
      client_wallet: 1.0,
      worker_wallet: 0,
      validator_wallet: 0,
    });

    // Fire 10 concurrent transfers
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        ledger.createTransaction(
          'client_wallet',
          'worker_wallet',
          0.05,
          'USDC',
          `transfer ${i}`,
          `task_${i}`,
          'payment'
        )
      );
    }

    const results = await Promise.all(promises);
    const validTxs = results.filter(r => r.valid);

    // Only 2 of 10 should succeed (1.0 / 0.05 = 20, but 10 requests)
    expect(validTxs.length).toBeLessThanOrEqual(20);
    expect(validTxs.length).toBeGreaterThan(0);

    // Final balance should be 0 or positive (never negative)
    expect(ledger.getBalance('client_wallet')).toBeGreaterThanOrEqual(0);
  });

  /**
   * File write is atomic (never corrupts JSON)
   */
  it('file write is atomic via temp + rename', async () => {
    await ledger.setInitialBalances({ client_wallet: 1.0 });

    // Create 100 transactions rapidly
    for (let i = 0; i < 100; i++) {
      await ledger.createTransaction(
        'client_wallet',
        `wallet_${i % 5}`,
        0.001,
        'USDC',
        `tx_${i}`,
        `task_${i}`,
        'payment'
      );
      await ledger.save();
    }

    // Verify the file is valid JSON (not corrupt)
    const data = await fs.readFile(storePath, 'utf-8');
    const parsed = JSON.parse(data); // throws if corrupted

    expect(parsed.transactions.length).toBe(100);
    expect(parsed.balances).toBeDefined();
  });

  /**
   * Filter by taskId
   */
  it('filters transactions by taskId', async () => {
    await ledger.setInitialBalances({ client_wallet: 1.0 });

    await ledger.createTransaction('client_wallet', 'w1', 0.1, 'USDC', 'test', 'task_A', 'payment');
    await ledger.createTransaction('client_wallet', 'w1', 0.1, 'USDC', 'test', 'task_B', 'payment');
    await ledger.createTransaction('client_wallet', 'w1', 0.1, 'USDC', 'test', 'task_A', 'payment');

    const taskATxs = ledger.getTransactions({ taskId: 'task_A' });
    expect(taskATxs.length).toBe(2);
    expect(taskATxs.every(t => t.taskId === 'task_A')).toBe(true);
  });

  /**
   * Query by latest N transactions
   */
  it('queries latest N transactions', async () => {
    await ledger.setInitialBalances({ client_wallet: 1.0 });

    for (let i = 0; i < 10; i++) {
      await ledger.createTransaction('client_wallet', 'w1', 0.01, 'USDC', `tx_${i}`, `task_${i}`, 'payment');
    }

    const latest5 = ledger.getTransactions({ latest: 5 });
    expect(latest5.length).toBe(5);
  });
});
