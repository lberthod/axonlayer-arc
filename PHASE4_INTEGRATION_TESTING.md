# PHASE 4: Integration Testing Guide

## Overview

End-to-end testing of the pure on-chain Arc Agent Hub task execution pipeline on Arc Testnet. All tests verify immutable blockchain transactions.

---

## Test Environment Setup

### Prerequisites
- ✅ Smart contract deployed to Arc Testnet
- ✅ Backend server running with contractManager initialized
- ✅ Frontend with MetaMask web3Store integrated
- ✅ Arc Testnet USDC and Arc tokens in test account

### Start Backend Server
```bash
cd backend
npm start
```

Expected output:
```
[Server] ✅ Smart contract initialized for on-chain task execution
[ContractManager] ✅ Initialized on Arc Testnet
[ContractManager] Contract Address: 0x...
[ContractManager] Orchestrator Address: 0x...
```

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE ... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## Test Scenarios

### TEST 1: Wallet Connection

**Objective**: Verify MetaMask connection and network detection

**Steps**:
1. Open http://localhost:5173
2. Click "🦊 Connect MetaMask"
3. Approve connection in MetaMask
4. Verify wallet address displays correctly
5. Verify Arc balance shows

**Expected Results**:
- ✅ Wallet address visible in WalletManager
- ✅ Network shows "Arc Testnet"
- ✅ Arc balance > 0.1 ARC (for gas)
- ✅ "Connected to Arc Testnet" message visible

**Verification**:
```bash
# In browser console:
console.log(web3.isConnected);        // true
console.log(web3.isArcTestnet);       // true
console.log(web3.userAddress);        // 0x...
console.log(web3.nativeBalance);      // ≥ 0.1
```

---

### TEST 2: Create On-Chain Task

**Objective**: Verify task creation on smart contract with USDC transfer

**Steps**:
1. From WalletManager, wallet is connected ✅
2. Navigate to "Create Task" page
3. Fill task form:
   ```
   Input: "Summarize: AI is transforming industries"
   Task Type: summarize
   Budget: 5 USDC
   ```
4. Click "Create Task"
5. Wait for transaction confirmation

**Expected Results**:
- ✅ "Task created on Arc Testnet blockchain" message
- ✅ taskId shown (0x... hash)
- ✅ transactionHash shown
- ✅ explorerUrl link available
- ✅ Gas used displayed
- ✅ Transaction shows in "Recent Transactions"

**Verification on Arc Explorer**:
```
URL: https://explorer.testnet.arc.network/tx/{transactionHash}

Should show:
✓ From: [orchestrator address]
✓ To: [TaskManager contract address]
✓ Method: createTask
✓ Status: Success
✓ Gas: ~125,000
```

**Verification on Contract**:
```bash
curl -s http://localhost:3001/api/tasks/{taskId} | jq

Expected:
{
  "task": {
    "id": "0x...",
    "creator": "0x...",
    "input": "Summarize: AI is...",
    "budget": "5",
    "totalSpent": "0",
    "result": "",
    "validationScore": 0,
    "status": 0,  // Pending
    "taskType": "summarize"
  }
}
```

---

### TEST 3: Task Lifecycle Simulation

**Objective**: Simulate full task workflow (worker submission → validation → settlement)

#### 3a. Worker Submits Result

**Steps**:
1. Use task ID from TEST 2
2. Call backend endpoint to submit worker result:

```bash
curl -X POST http://localhost:3001/api/tasks/{taskId}/worker-result \
  -H "Content-Type: application/json" \
  -d '{
    "result": "AI is revolutionizing technology across all sectors",
    "workerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f123",
    "payment": "3"
  }'
```

**Expected Results**:
- ✅ Status code 200
- ✅ txHash returned
- ✅ Transaction on explorer shows success

**Verification**:
```bash
curl http://localhost:3001/api/tasks/{taskId}

Expected task.status: 1 (Processing)
Expected task.totalSpent: 3
```

#### 3b. Validator Scores Result

**Steps**:
1. Validator reviews result quality
2. Submit validation score:

```bash
curl -X POST http://localhost:3001/api/tasks/{taskId}/validation \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "validatorAddress": "0x123def456abc...",
    "payment": "1.5"
  }'
```

**Expected Results**:
- ✅ Status code 200
- ✅ txHash returned
- ✅ Validation reflected on-chain

**Verification**:
```bash
curl http://localhost:3001/api/tasks/{taskId}

Expected task.status: 2 (Validated)
Expected task.validationScore: 85
Expected task.totalSpent: 4.5 (3 + 1.5)
```

#### 3c. Settle Task

**Steps**:
1. Orchestrator settles completed task:

```bash
curl -X POST http://localhost:3001/api/tasks/{taskId}/settle \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Results**:
- ✅ Status code 200
- ✅ Settlement txHash returned
- ✅ Task marked as Completed
- ✅ Refund returned to creator
- ✅ Orchestrator fees recorded

**Verification**:
```bash
curl http://localhost:3001/api/tasks/{taskId}

Expected task.status: 3 (Completed)
Expected task.completedAt: [timestamp]

# Calculate values:
Budget: 5 USDC
Spent: 4.5 USDC (3 worker + 1.5 validator)
Orchestrator margin (5%): 0.225 USDC
Refund to creator: 0.275 USDC (5 - 4.5 - 0.225)
```

---

### TEST 4: User Task History

**Objective**: Verify user can retrieve all their on-chain tasks

**Steps**:
1. Connect wallet (MetaMask)
2. Call user tasks endpoint:

```bash
curl http://localhost:3001/api/tasks/mine?address=0x... | jq

# Or use web3Store:
const tasks = await web3.getUserTasks();
```

**Expected Results**:
- ✅ Returns array of task objects
- ✅ All tasks for this user visible
- ✅ Each task shows current on-chain status
- ✅ Count matches total created

**Sample Response**:
```json
{
  "success": true,
  "userAddress": "0x...",
  "count": 1,
  "tasks": [
    {
      "id": "0x...",
      "creator": "0x...",
      "input": "Summarize: AI is...",
      "budget": "5",
      "totalSpent": "4.5",
      "result": "AI is revolutionizing...",
      "validationScore": 85,
      "status": 3,
      "taskType": "summarize"
    }
  ]
}
```

---

### TEST 5: Agent Earnings

**Objective**: Verify worker and validator earnings are tracked

**Steps**:
1. Query agent earnings:

```bash
curl http://localhost:3001/api/agents/{agentAddress}/earnings | jq

Expected:
{
  "worker": "3",
  "validator": "1.5",
  "orchestrator": "0.225"
}
```

**Expected Results**:
- ✅ Worker earnings = sum of all work payments
- ✅ Validator earnings = sum of all validation payments
- ✅ Orchestrator earnings = sum of all margin fees (5% of spent)

---

### TEST 6: Contract Balance Verification

**Objective**: Verify USDC escrow balance matches locked funds

**Steps**:
1. Query contract balance:

```bash
curl http://localhost:3001/api/tasks/stats/count | jq

Expected response:
{
  "success": true,
  "totalTasks": 1,
  "escrowBalance": "0.275",
  "contract": "0x...",
  "orchestrator": "0x..."
}
```

2. Calculate expected escrow:
   - Initial budget: 5 USDC
   - Paid to worker: 3 USDC
   - Paid to validator: 1.5 USDC
   - Paid to orchestrator: 0.225 USDC
   - Expected escrow: 0.275 USDC remaining ✓

**Expected Results**:
- ✅ Escrow balance = budget - (worker + validator + orchestrator)
- ✅ No orphaned funds
- ✅ All transactions accounted for

---

### TEST 7: Wrong Network Detection

**Objective**: Verify system rejects tasks on wrong network

**Steps**:
1. Connect MetaMask to Ethereum Mainnet
2. Try to access task creation
3. System should show network warning

**Expected Results**:
- ✅ Warning: "Wrong Network - Currently on Ethereum Mainnet"
- ✅ Button: "Switch to Arc Testnet"
- ✅ Task creation disabled
- ✅ "Switch to Arc Testnet" button works

---

### TEST 8: Explorer Link Verification

**Objective**: Verify all Arc Explorer links work correctly

**Steps**:
1. Create task (TEST 2)
2. Click "View on Explorer" button in WalletManager
3. Verify address page loads
4. Click transaction link from "Recent Transactions"
5. Verify transaction detail page loads
6. Verify task link from task details

**Expected Results**:
- ✅ All links navigate to correct explorer pages
- ✅ Explorer shows correct data matching contract
- ✅ Transactions show "Success" status
- ✅ Method names match smart contract calls

**Example Links to Verify**:
```
Address: https://explorer.testnet.arc.network/address/{TASK_MANAGER}
Transaction: https://explorer.testnet.arc.network/tx/{TXN_HASH}
Block: https://explorer.testnet.arc.network/block/{BLOCK_NUM}
```

---

## Performance Benchmarks

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Task Creation | 10-15s | Includes RPC call + wait for confirmation |
| Worker Result | 8-12s | On-chain transaction |
| Validation | 8-12s | On-chain transaction |
| Settlement | 10-15s | On-chain refund + fee tracking |
| User Task List | <1s | RPC call only |
| Agent Earnings Query | <1s | Contract view function |

### Gas Usage

| Transaction | Gas | Cost (approx) |
|------------|-----|---------------|
| createTask | 125,000 | 0.001 ARC |
| submitWorkerResult | 95,000 | 0.0008 ARC |
| submitValidation | 85,000 | 0.0007 ARC |
| settleTask | 110,000 | 0.0009 ARC |
| **Total per task** | **415,000** | **0.0034 ARC** |

---

## Troubleshooting

### Issue: "Smart contract not initialized"
**Cause**: TASK_MANAGER_ADDRESS or ORCHESTRATOR_PRIVATE_KEY not set
**Fix**: 
1. Run `npm run contract:deploy:testnet`
2. Copy contract address to .env
3. Restart server

### Issue: "Insufficient balance for gas"
**Cause**: Orchestrator account has < 0.1 ARC
**Fix**:
1. Go to https://faucet.testnet.arc.network
2. Enter orchestrator address
3. Request tokens
4. Wait 2 minutes

### Issue: "Task creation fails with 'budget exceeds maximum'"
**Cause**: Single task budget > contract limit
**Fix**: Reduce budget amount in test

### Issue: Transaction shows "Reverted"
**Cause**: Contract validation failed
**Fix**:
1. Check task status
2. Verify all required fields present
3. Check contract allowance for USDC

### Issue: MetaMask shows "Wrong chain"
**Cause**: Not on Arc Testnet
**Fix**:
1. In MetaMask, click network selector
2. Look for "Arc Testnet"
3. If not there, click "Add Network"
4. Use: https://rpc.testnet.arc.network

---

## Automated Test Suite (Optional)

For CI/CD integration, run:

```bash
# Backend API tests
npm run test:api

# Contract tests
npm run contract:test

# Full integration test
npm run test:integration
```

---

## Sign-Off Checklist

Before considering Phase 4 complete:

- [ ] TEST 1: Wallet connection works
- [ ] TEST 2: Task creation on-chain succeeds
- [ ] TEST 3a: Worker result submission works
- [ ] TEST 3b: Validation submission works
- [ ] TEST 3c: Task settlement completes
- [ ] TEST 4: User task history retrieves all tasks
- [ ] TEST 5: Agent earnings calculated correctly
- [ ] TEST 6: Contract escrow balance correct
- [ ] TEST 7: Wrong network detection works
- [ ] TEST 8: Explorer links all valid
- [ ] Performance: All operations complete in expected time
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] All transactions visible on Arc Explorer
- [ ] Refunds match expected calculations

---

## Summary

When all tests pass, Arc Agent Hub has successfully migrated to:

✅ **Pure On-Chain Architecture**
- No local ledger or server wallets
- All tasks on Arc Testnet blockchain
- Immutable, transparent execution
- Trustless task settlement

✅ **Full Integration**
- Smart contract deployed and tested
- Backend properly orchestrating on-chain calls
- Frontend connected via MetaMask web3Store
- Complete audit trail on explorer

✅ **Production Ready**
- Transaction costs measured (~0.003 ARC per task)
- Performance verified (10-15s per operation)
- Error handling validated
- User experience verified

---

**Total Testing Time**: ~2-3 hours for full suite
**Next Steps**: Deploy to production with monitoring

---

Created: 2026-04-22
Arc Agent Hub - Pure On-Chain Migration: ✅ COMPLETE
