# 🚀 Guide d'Implémentation - Corrections de Sécurité

**Audit Date**: 24 Avril 2026  
**Developer**: Claude Code  
**Target**: Production-ready by 30 Avril 2026

---

## 📦 RÉSUMÉ DES CORRECTIONS APPORTÉES

### Phase 1: Critiques (✅ COMPLÈTÉES)

#### 1. Chiffrement des Clés Privées
```
✅ backend/src/core/secretManager.js - AES-256-GCM
✅ backend/src/core/walletManager.js - Updated to decrypt on-demand
✅ backend/scripts/encryptWallets.js - Migration utility
```

**Setup:**
```bash
# Générer une master key (production: use KMS/Vault)
export SECRETS_MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Chiffrer les wallets
cd backend
npm run encrypt:wallets

# Backup automatique créé: wallets.json.backup
```

#### 2. Two-Phase Commit (SAGA Pattern)
```
✅ backend/src/core/paymentSaga.js - Complete implementation
   - RESERVE: Lock treasury amount
   - BROADCAST: Send on-chain
   - CONFIRM: Wait for confirmation
   - SETTLE: Update ledger
   - RECONCILE: Recover pending TXs
```

**Usage:**
```javascript
import { paymentSaga } from './core/paymentSaga.js';

const result = await paymentSaga.executePayment({
  taskId: 'task_123',
  fromWalletId: 'orchestrator_wallet',
  toAddress: '0x...',
  amount: 0.001,
  reason: 'Worker payment'
});

// result.success = true/false
// result.txHash = blockchain transaction hash
// result.txId = local transaction ID for tracking
```

#### 3. Pricing - Marge Non-Négative
```
✅ backend/src/core/pricingEngine.js - Fixed invariant
   - MIN_MARGIN = 5% of minClientPayment
   - Aggressive quotes rescaled automatically
   - ASSERT: orchestratorMargin >= 0 (throw otherwise)
✅ backend/tests/core/pricingEngine.test.js - Added critical tests
```

**Validation:**
```bash
npm test -- pricingEngine.test.js  # All invariant tests pass
```

#### 4. E2E Tests
```
✅ backend/tests/e2e/fullFlow.test.js - Complete workflow test
   - Create user → Fund wallet → Create task → Execute → Verify ledger
   - Checks: No money loss, ledger invariants, balance changes
```

**Run:**
```bash
npm test -- fullFlow.test.js
```

---

## 🔧 INTÉGRATION REQUISE

### 1. Update Orchestration Engine
```javascript
// src/core/orchestrationEngine.js - line ~150

// ❌ AVANT: Direct treasury transfer
const tx = await walletManager.transfer(...)

// ✅ APRÈS: Use SAGA pattern
const result = await paymentSaga.executePayment({
  taskId: task.id,
  fromWalletId: 'orchestrator_wallet',
  toAddress: agentAddress,
  amount: workerPayment,
  reason: `Payment for ${worker.name}`
});

if (!result.success) {
  logger.error({
    taskId: task.id,
    error: result.error,
    code: result.code
  }, '[ORCHESTRATOR] Payment failed');
  // Automatic retry via reconciliation job
  task.status = 'pending_payment';
  return;
}

task.transactions.push(result.txHash);
```

### 2. Implement Reconciliation Job
```javascript
// src/core/reconciliationJob.js (NEW)

import { paymentSaga } from './paymentSaga.js';
import pino from 'pino';

const logger = pino();

/**
 * Run every 5 minutes to reconcile pending transactions
 * Checks on-chain state and updates ledger
 */
export async function reconcilePendingTransactions() {
  logger.info('[RECONCILE] Starting reconciliation job');

  try {
    await paymentSaga.reconcilePendingTransactions();
    logger.info('[RECONCILE] Reconciliation complete');
  } catch (error) {
    logger.error({ err: error }, '[RECONCILE] Job failed');
  }
}

// Schedule in server.js:
// setInterval(reconcilePendingTransactions, 5 * 60 * 1000);
```

### 3. Add Health Check Endpoint
```javascript
// src/routes/health.routes.js

router.get('/api/health', async (req, res) => {
  const treasuryBalance = treasuryStore.getBalance();
  const pendingTxs = ledger.getPendingTransactions().length;
  
  const health = {
    status: treasuryBalance > 0 ? 'healthy' : 'unhealthy',
    treasury: {
      balance: treasuryBalance,
      warning: treasuryBalance < 0.1
    },
    pending: {
      count: pendingTxs,
      alert: pendingTxs > 10
    },
    timestamp: new Date().toISOString()
  };

  res.json(health);
});
```

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### Week 1: Core Integration
- [ ] Update `orchestrationEngine.js` to use `paymentSaga`
- [ ] Create `reconciliationJob.js` and schedule every 5 min
- [ ] Add health check endpoint
- [ ] Update `ledger.js` to track reservations + pending TXs
- [ ] Create `src/core/validation.js` for Zod schemas

### Week 2: Testing
- [ ] Run all tests: `npm test` (goal: 250+ passing)
- [ ] E2E test on local testnet
- [ ] Chaos test: simulate RPC failures
- [ ] Load test: 100 concurrent tasks/min
- [ ] Verify dryRun=false works on Arc testnet

### Week 3: Operations
- [ ] Write `OPERATIONS.md`
- [ ] Write `TROUBLESHOOTING.md`
- [ ] Write `SECURITY_ROTATION.md`
- [ ] Create monitoring dashboards (treasury, pending TXs, errors)
- [ ] Setup alerts: treasury < 0.1 USDC, pending > 10, error rate > 1%

### Week 4: Security
- [ ] External security audit (Trail of Bits)
- [ ] Fix audit findings
- [ ] Bug bounty program launch
- [ ] Code review by 2+ maintainers
- [ ] Prepare for mainnet deployment

---

## 🔍 VALIDATION TESTS

```bash
# 1. Unit tests
npm test                      # Should pass 250+ tests

# 2. Wallet encryption
export SECRETS_MASTER_KEY=...
npm run encrypt:wallets       # Should create wallets.json.backup
ls -la src/data/wallets.json  # Should have "encrypted": true

# 3. Pricing invariants
npm test -- pricingEngine.test.js

# 4. E2E workflow
npm test -- fullFlow.test.js  # User → Task → Payment → Verify

# 5. Start server
npm start                     # Should log: "✓ Wallets loaded (2 encrypted wallets)"
curl http://localhost:3001/api/health

# 6. Create test task
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"input":"test","taskType":"summarize"}'
```

---

## 🛡️ PRODUCTION CHECKLIST

### Before Mainnet Launch
- [ ] All 250+ tests passing
- [ ] Security audit complete & issues fixed
- [ ] Monitoring/alerting operational
- [ ] Runbook documentation done
- [ ] Disaster recovery tested
- [ ] Team trained on operations
- [ ] Master key securely stored (AWS Secrets Manager / Vault)
- [ ] Backup & restore tested
- [ ] Load testing: 100+ tasks/min sustained
- [ ] On-chain transfers verified (dryRun=false)
- [ ] Bug bounty program active

### Deployment Steps
1. Deploy to staging with real USDC (testnet)
2. Run full E2E test suite
3. Monitor for 48 hours (no errors)
4. Get security audit sign-off
5. Deploy to production
6. Monitor treasury + transaction flow

---

## 📊 FILES MODIFIED/CREATED

### Created
```
backend/src/core/secretManager.js        (270 lines)
backend/src/core/paymentSaga.js           (350 lines)
backend/scripts/encryptWallets.js         (40 lines)
backend/tests/e2e/fullFlow.test.js        (280 lines)
```

### Modified
```
backend/src/core/walletManager.js         (+120 lines)
backend/src/core/pricingEngine.js         (+40 lines)
backend/tests/core/pricingEngine.test.js  (+60 lines)
```

### To Implement
```
backend/src/core/reconciliationJob.js     (100 lines - TODO)
backend/src/routes/health.routes.js       (50 lines - TODO)
backend/OPERATIONS.md                     (TODO)
backend/TROUBLESHOOTING.md                (TODO)
backend/SECURITY_ROTATION.md              (TODO)
```

---

## 🚨 CRITICAL REMINDERS

1. **NEVER commit wallets.json plaintext**
   - Always encrypt before committing
   - `.gitignore` already covers it
   - Backup created at: `wallets.json.backup`

2. **SECRETS_MASTER_KEY must be secure**
   - Use KMS (AWS) or Vault (Hashicorp)
   - NEVER in source code or .env file
   - Rotate every 90 days in production

3. **Test on-chain BEFORE mainnet**
   - Use dryRun=false on Arc testnet
   - Verify USDC transfers appear on-chain
   - Check Etherscan: https://explorer.arcblock.io/

4. **Monitor treasury balance**
   - Alert if < 0.1 USDC
   - Reconciliation job checks every 5 min
   - Manually review pending TXs >= 10

5. **Ledger invariant MUST hold**
   - Sum(payments) = clientPayment
   - orchestratorMargin >= 0
   - Test suite verifies this

---

## 📞 SUPPORT

**Issues or questions:**
1. Check `TROUBLESHOOTING.md`
2. Review `OPERATIONS.md`
3. Check server logs: `npm start 2>&1 | tail -f`
4. Verify wallet encryption: check `wallets.json` has `"encrypted": true`
5. Run test suite: `npm test`

**Emergency procedures:**
- Restore wallets.json from backup
- Clear pending transactions: `ledger.clearPending()`
- Reset treasury: manual intervention required (requires 2-of-3 multisig)

---

**Status**: ✅ Ready for integration  
**Next Review**: 25 Avril 2026  
**Target Mainnet**: 30 Avril 2026
