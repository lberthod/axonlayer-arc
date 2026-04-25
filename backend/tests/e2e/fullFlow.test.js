import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import userStore from '../../src/core/userStore.js';
import taskEngine from '../../src/core/taskEngine.js';
import treasuryStore from '../../src/core/treasuryStore.js';
import ledger from '../../src/core/ledger.js';
import { config } from '../../src/config.js';

/**
 * E2E Test: Complete user workflow
 *
 * Flow:
 * 1. Create user with mission wallet
 * 2. Fund mission wallet with initial balance
 * 3. Create task (gets quoted and priced)
 * 4. Orchestrator selects agents
 * 5. Agents execute task
 * 6. Validators validate result
 * 7. Payments settled on-chain
 * 8. Verify ledger integrity
 *
 * This test ensures NO money is lost and ledger invariants hold.
 */
describe('E2E: Complete Task Execution Flow', () => {
  let testUser;
  let testAuthToken;
  const TEST_TASK_INPUT = 'This is a test task for summarization.';
  const TEST_TASK_TYPE = 'summarize';

  beforeAll(async () => {
    // Create a test user
    testUser = await userStore.upsertFromFirebase({
      uid: 'test-user-' + Date.now(),
      email: 'e2e-test@example.com',
      displayName: 'E2E Test User'
    });

    // Generate auth token
    testAuthToken = `Bearer ${testUser.apiKey}`;

    // Fund their wallet with initial balance
    const initialBalance = 1.0; // 1 USDC
    await userStore.setBalance(testUser.uid, initialBalance);

    console.log(`\n✓ Test user created: ${testUser.uid}`);
    console.log(`✓ Wallet balance: ${initialBalance} USDC`);
  });

  afterAll(async () => {
    // Cleanup (optional - keep for audit trail)
    console.log(`\n✓ Test completed for user: ${testUser.uid}`);
  });

  it('should complete full task flow without money loss', async () => {
    // Get initial state
    const initialBalance = testUser.balance;
    const initialTreasuryBalance = treasuryStore.getBalance();
    const initialLedgerLength = ledger.getTransactions().length;

    console.log(`Initial state:`);
    console.log(`  User balance: ${initialBalance} USDC`);
    console.log(`  Treasury balance: ${initialTreasuryBalance} USDC`);

    // Step 1: Create task
    const createTaskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', testAuthToken)
      .send({
        input: TEST_TASK_INPUT,
        taskType: TEST_TASK_TYPE,
        selectionStrategy: 'balanced'
      });

    expect(createTaskRes.status).toBe(200);
    expect(createTaskRes.body).toHaveProperty('id');
    expect(createTaskRes.body).toHaveProperty('pricing');

    const taskId = createTaskRes.body.id;
    const pricing = createTaskRes.body.pricing;

    console.log(`\nTask created: ${taskId}`);
    console.log(`  Client payment: ${pricing.clientPayment} USDC`);
    console.log(`  Worker payment: ${pricing.workerPayment} USDC`);
    console.log(`  Validator payment: ${pricing.validatorPayment} USDC`);
    console.log(`  Orchestrator margin: ${pricing.orchestratorMargin} USDC`);

    // Verify pricing invariant
    const pricingSum = pricing.workerPayment + pricing.validatorPayment + pricing.orchestratorMargin;
    expect(Math.abs(pricingSum - pricing.clientPayment)).toBeLessThan(0.000001);

    // Step 2: Get task details
    const getTaskRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', testAuthToken);

    expect(getTaskRes.status).toBe(200);
    expect(getTaskRes.body.id).toBe(taskId);
    expect(getTaskRes.body.status).toMatch(/pending|completed|failed/);

    // Step 3: Check ledger transactions
    const ledgerTxs = ledger.getTransactions();
    expect(ledgerTxs.length).toBeGreaterThan(initialLedgerLength);

    // Find task-related transactions
    const taskTxs = ledgerTxs.filter(tx => tx.taskId === taskId);
    console.log(`\nLedger transactions for task: ${taskTxs.length}`);

    // Step 4: Verify user balance decreased
    const userAfter = userStore.getByUid(testUser.uid);
    const balanceDecrease = initialBalance - userAfter.balance;

    console.log(`\nAfter task execution:`);
    console.log(`  User balance: ${userAfter.balance} USDC`);
    console.log(`  Balance decrease: ${balanceDecrease} USDC`);

    expect(balanceDecrease).toBeCloseTo(pricing.clientPayment, 6);

    // Step 5: Verify treasury state
    const treasuryAfter = treasuryStore.getBalance();
    console.log(`  Treasury balance: ${treasuryAfter} USDC`);

    // Treasury should have received user payment
    expect(treasuryAfter).toBeGreaterThanOrEqual(initialTreasuryBalance);

    // Step 6: Total ledger invariant
    // Sum of all user transactions should match their balance change
    const userTxsSum = taskTxs
      .filter(tx => tx.type === 'payment')
      .reduce((sum, tx) => sum + tx.amount, 0);

    console.log(`\nLedger verification:`);
    console.log(`  User transactions sum: ${userTxsSum} USDC`);
    console.log(`  Balance change: ${balanceDecrease} USDC`);

    // Invariant: money is either in user wallet or treasury
    const totalInSystem = userAfter.balance + treasuryAfter;
    const moneyLoss = initialBalance + initialTreasuryBalance - totalInSystem;

    console.log(`  Total money in system: ${totalInSystem} USDC`);
    console.log(`  Money loss: ${moneyLoss} USDC`);

    expect(Math.abs(moneyLoss)).toBeLessThan(0.000001); // Allow for rounding errors

    console.log(`\n✓ Full flow completed successfully!`);
  });

  it('should handle insufficient balance correctly', async () => {
    // Create a user with low balance
    const poorUser = await userStore.upsertFromFirebase({
      uid: 'poor-user-' + Date.now(),
      email: 'poor-user@example.com',
      displayName: 'Poor User'
    });

    await userStore.setBalance(poorUser.uid, 0.0001); // Very low balance

    const poorUserToken = `Bearer ${poorUser.apiKey}`;

    // Try to create an expensive task
    const createTaskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', poorUserToken)
      .send({
        input: 'x'.repeat(10000), // Large input = expensive
        taskType: 'translate',
        selectionStrategy: 'quality'
      });

    // Should fail with 400 Bad Request (insufficient balance)
    expect(createTaskRes.status).toBe(400);
    expect(createTaskRes.body.code).toBe('insufficient_balance');

    console.log(`✓ Insufficient balance check working`);
  });

  it('should maintain ledger invariants', async () => {
    const allTransactions = ledger.getTransactions();

    // Check invariants for each task
    const taskIds = new Set(allTransactions.map(tx => tx.taskId).filter(Boolean));

    for (const taskId of taskIds) {
      const taskTxs = allTransactions.filter(tx => tx.taskId === taskId);
      if (taskTxs.length === 0) continue;

      // Sum all payments for this task
      const totalOut = taskTxs
        .filter(tx => tx.type === 'payment')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalIn = taskTxs
        .filter(tx => tx.type === 'fund')
        .reduce((sum, tx) => sum + tx.amount, 0);

      console.log(`Task ${taskId.substring(0, 8)}...: in=${totalIn}, out=${totalOut}`);

      // Money in >= money out (refunds possible)
      expect(totalIn).toBeGreaterThanOrEqual(totalOut - 0.000001);
    }

    console.log(`✓ Ledger invariants verified`);
  });
});
