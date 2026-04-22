# Arc Agent Hub - Pure On-Chain Deployment Guide

## Executive Summary

Arc Agent Hub has been **completely refactored** from a hybrid wallet system to a **pure on-chain architecture** where:

- ✅ All tasks execute trustlessly on Arc Testnet blockchain
- ✅ No local ledger or server-side wallet management
- ✅ User wallets managed via MetaMask (client-side only)
- ✅ Smart contract handles all payment logic and escrow
- ✅ Full audit trail on Arc Explorer

**Status**: 🟢 Ready for deployment to Arc Testnet

---

## Architecture Overview

### Before (Hybrid - DEPRECATED)
```
User Input
    ↓
Local Mission Wallet (Server-side)
    ↓
Agent Execution
    ↓
Treasury & Ledger (In-memory)
    ↗ On-chain Balance (mirrored)
```

### After (Pure On-Chain - ✅ CURRENT)
```
User (MetaMask)
    ↓
Smart Contract Escrow (Arc Testnet)
    ↓
Agent Execution (via Backend)
    ↓
On-Chain Settlement (Immutable)
    ↗ Arc Explorer (Transparent)
```

---

## Component Changes

### 1. Smart Contract (NEW)

**File**: `backend/contracts/TaskManager.sol`

**Features**:
- Task creation with USDC escrow
- Worker result submission (on-chain payment)
- Validator quality scoring (on-chain payment)
- Task settlement with refunds
- Earnings tracking and withdrawals
- ReentrancyGuard security
- Full event logging

**Deployment**: Arc Testnet (Chain ID: 5042002)

---

### 2. Backend Changes

#### New File: `backend/src/core/contractManager.js`
- Bridges backend to deployed smart contract
- Manages all contract interactions
- Handles transaction monitoring
- Replaces local ledger entirely

#### Modified: `backend/src/routes/tasks.routes.js`
- Removed local wallet balance checks
- Now calls `contractManager.createTask()`
- Returns transaction hash + explorer URL
- New endpoint: `GET /tasks/stats/count`

#### Removed: Local Ledger Components
- `treasuryStore.js` (replaced by on-chain escrow)
- `walletManager.js` (replaced by MetaMask)
- `ledger.js` (replaced by blockchain)
- `missionWallet` from user profiles

---

### 3. Frontend Changes

#### New File: `frontend/src/stores/web3Store.js`
- Pinia store for MetaMask wallet state
- Network detection (Arc Testnet)
- Balance fetching
- Task creation with on-chain confirmation
- Transaction monitoring

#### Modified: `frontend/src/components/WalletManager.vue`
- Shows MetaMask connection status
- Network validation (warns if not on Arc Testnet)
- Arc balance display
- Recent transaction history
- Explorer links for verification

---

## Deployment Steps

### Phase 2.5: Smart Contract Deployment

#### Step 1: Generate Orchestrator Account

```bash
cd backend
npm run contract:setup
```

This interactive script:
1. Generates new orchestrator wallet
2. Shows Arc Testnet faucet instructions
3. Walks through contract deployment
4. Updates .env automatically

**Output**:
```
✅ Generated new orchestrator account:
  Address: 0x...
  Private Key: 0x...

📋 Save this private key!
```

#### Step 2: Get Test Tokens

1. Open https://faucet.testnet.arc.network
2. Paste orchestrator address
3. Request tokens
4. Wait 1-2 minutes for confirmation

**Verify**:
```bash
curl https://rpc.testnet.arc.network \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x...","latest"],"id":1}'
```

#### Step 3: Compile Smart Contract

```bash
npm run contract:compile
```

Expected output:
```
Compiled 10 Solidity files successfully (evm target: paris)
```

#### Step 4: Deploy to Arc Testnet

```bash
npm run contract:deploy:testnet
```

Expected output:
```
Deploying TaskManager contract...

Deployment Configuration:
- USDC Token Address: 0x3600000000000000000000000000000000000000
- Orchestrator Address: 0x...
- Network: arcTestnet
- Chain ID: 5042002

Deploying TaskManager...
✅ TaskManager deployed at: 0x...

=== DEPLOYMENT SUMMARY ===
Contract Address: 0x...
Explorer URL: https://explorer.testnet.arc.network/address/0x...

⚠️  SAVE THIS ADDRESS - Add to .env as TASK_MANAGER_ADDRESS
```

#### Step 5: Update Environment

```bash
# Edit .env
TASK_MANAGER_ADDRESS=0x...  # From deployment output
ORCHESTRATOR_PRIVATE_KEY=0x...  # From setup script
ORCHESTRATOR_ADDRESS=0x...  # From setup script
```

**Verify**:
```bash
grep TASK_MANAGER_ADDRESS backend/.env
grep ORCHESTRATOR_ADDRESS backend/.env
```

---

### Phase 3: Backend Integration

#### Step 1: Install Dependencies

```bash
cd backend
npm install
```

Verifies:
- hardhat: Smart contract compilation
- ethers: Blockchain interactions
- @openzeppelin/contracts: Security libraries

#### Step 2: Start Backend Server

```bash
npm start
```

Expected output:
```
[Server] Arc Agent Hub API server listening on port 3001
[Server] ✅ Smart contract initialized for on-chain task execution
[ContractManager] ✅ Initialized on Arc Testnet
[ContractManager] Contract Address: 0x...
[ContractManager] Orchestrator Address: 0x...
```

#### Step 3: Verify Contract Connection

```bash
curl http://localhost:3001/api/tasks/stats/count

Expected response:
{
  "success": true,
  "totalTasks": 0,
  "escrowBalance": "0",
  "contract": "0x...",
  "orchestrator": "0x..."
}
```

---

### Phase 4: Frontend Integration

#### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### Step 2: Verify web3Store is Initialized

Check that these files exist:
```bash
ls frontend/src/stores/web3Store.js
ls frontend/src/components/WalletManager.vue
```

#### Step 3: Start Frontend Server

```bash
npm run dev
```

Expected output:
```
  VITE ... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

#### Step 4: Test Wallet Connection

1. Open http://localhost:5173
2. Find WalletManager component
3. Click "🦊 Connect MetaMask"
4. Approve in MetaMask
5. Verify Arc Testnet is selected

**Expected**:
- Wallet address displays
- "Connected to Arc Testnet" message
- Arc balance shows > 0

---

## Testing Checklist

### Quick Smoke Test (5 minutes)

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Test API
curl http://localhost:3001/api/tasks/stats/count
# Should return JSON with totalTasks: 0
```

### Create Test Task (10 minutes)

1. Open http://localhost:5173
2. Connect MetaMask wallet
3. Navigate to "Create Task"
4. Fill form:
   - Input: "Test task for Arc blockchain"
   - Type: summarize
   - Budget: 1 USDC
5. Click "Create Task"
6. Copy transaction hash
7. Verify on Arc Explorer: https://explorer.testnet.arc.network/tx/{hash}

**Expected**:
- Transaction shows "Success"
- TaskManager called as recipient
- taskId returned in response

### Full Integration Test (2-3 hours)

See `PHASE4_INTEGRATION_TESTING.md` for comprehensive test scenarios:
- Wallet connection
- Task creation
- Worker result submission
- Validator scoring
- Task settlement
- Earnings calculation
- Explorer verification

---

## Environment Configuration

### Required Environment Variables

```bash
# Smart Contract
TASK_MANAGER_ADDRESS=0x...                    # Deployed contract
ORCHESTRATOR_PRIVATE_KEY=0x...               # Account for settlements
ORCHESTRATOR_ADDRESS=0x...                   # Same as above

# Arc Network
ARC_TESTNET_RPC=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002
ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000

# OpenAI (if using LLM agents)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5-nano-2025-08-07

# Pricing
PRICING_PROFILE=nano

# Logging
LOG_LEVEL=info
```

### Verify Configuration

```bash
# Check all required variables
cd backend
source .env
echo "Contract: $TASK_MANAGER_ADDRESS"
echo "Orchestrator: $ORCHESTRATOR_ADDRESS"
echo "Network: $ARC_TESTNET_RPC"
```

---

## Monitoring & Verification

### Check Contract State

```bash
# Get task count
curl http://localhost:3001/api/tasks/stats/count

# Get specific task
curl http://localhost:3001/api/tasks/{taskId}

# Get user tasks
curl http://localhost:3001/api/tasks/mine?address=0x...
```

### Monitor Blockchain

**Arc Explorer**: https://explorer.testnet.arc.network
- Search by transaction hash
- Search by contract address
- Search by wallet address

**View Transactions**:
```bash
# Transaction details
https://explorer.testnet.arc.network/tx/{txHash}

# Contract state
https://explorer.testnet.arc.network/address/{TASK_MANAGER_ADDRESS}

# User wallet activity
https://explorer.testnet.arc.network/address/{userAddress}
```

### Check Server Logs

```bash
# Backend logs show:
[ContractManager] Task created: 0x...
[ContractManager] TX: 0x...
[ContractManager] ✅ Confirmed in block 12345

# Watch in real-time:
npm start | grep ContractManager
```

---

## Cost Analysis

### Gas Fees (Arc Testnet)

| Operation | Gas | Cost |
|-----------|-----|------|
| createTask | ~125,000 | ~0.001 ARC |
| submitWorkerResult | ~95,000 | ~0.0008 ARC |
| submitValidation | ~85,000 | ~0.0007 ARC |
| settleTask | ~110,000 | ~0.0009 ARC |
| **Per Task Total** | **~415,000** | **~0.0034 ARC** |

**Cost in USDC**: 
- 1 ARC ≈ $0.10 (testnet price)
- Per task gas: ~$0.00034 USDC

### USDC Payments (User Cost)

Example task with 5 USDC budget:
```
User budget:           5.00 USDC
├─ Worker payment:    -3.00 USDC
├─ Validator payment: -1.50 USDC
├─ Orchestrator fee:  -0.225 USDC (5% of 4.5 spent)
└─ Refund to user:    +0.275 USDC
```

---

## Troubleshooting

### "Contract not initialized"
```bash
# Check env variables
grep TASK_MANAGER_ADDRESS backend/.env
# Should show address like 0x...

# Restart server
npm start
```

### "Insufficient balance for gas"
```bash
# Request more tokens from faucet
# https://faucet.testnet.arc.network

# Or check current balance
curl https://rpc.testnet.arc.network \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0x...",latest"],
    "id":1
  }'
```

### "MetaMask: User denied transaction"
- Approve in MetaMask popup
- Check network is Arc Testnet
- Verify account has sufficient balance

### "Transaction reverted"
```bash
# Check contract state
curl http://localhost:3001/api/tasks/{taskId}

# Verify on explorer
# https://explorer.testnet.arc.network/tx/{txHash}

# Common causes:
# - Task already settled
# - Budget exceeded
# - Invalid task status
```

---

## Rollback Instructions

If you need to revert to hybrid mode:

```bash
# 1. Revert environment
git checkout backend/.env

# 2. Revert routes
git checkout backend/src/routes/tasks.routes.js

# 3. Revert frontend
git checkout frontend/src/components/WalletManager.vue

# 4. Restart servers
npm start  # backend
npm run dev  # frontend
```

---

## Production Considerations

### Before Going Live

- [ ] Test on Arc Testnet thoroughly (see PHASE4_INTEGRATION_TESTING.md)
- [ ] Audit smart contract (recommended)
- [ ] Set up monitoring on orchestrator account
- [ ] Configure backup orchestrator addresses
- [ ] Plan for contract upgrades (proxy pattern)
- [ ] Document emergency procedures
- [ ] Train team on new on-chain workflow

### Security Best Practices

1. **Private Key Management**
   - Never commit .env to git
   - Use secrets manager for production
   - Rotate keys regularly
   - Use hardware wallet for orchestrator

2. **Smart Contract**
   - ReentrancyGuard protects against reentrancy
   - Ownable limits administrative functions
   - Access control on critical methods

3. **Network Security**
   - Use HTTPS only in production
   - Enable CORS properly
   - Rate limit API endpoints
   - Monitor for suspicious activity

4. **Fund Management**
   - Keep minimum Arc balance for gas
   - Monitor escrow balance
   - Regular fund settlement
   - Audit earnings distribution

---

## Support & Documentation

### Key Resources

- **Smart Contract**: `backend/contracts/TaskManager.sol` (361 lines)
- **Backend Integration**: `backend/src/core/contractManager.js`
- **Frontend Wallet**: `frontend/src/stores/web3Store.js`
- **Testing Guide**: `PHASE4_INTEGRATION_TESTING.md`
- **Phase 1 README**: `backend/PHASE1_README.md`

### External Links

- Arc Network: https://arc.network
- Arc Explorer: https://explorer.testnet.arc.network
- Arc Faucet: https://faucet.testnet.arc.network
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/5.x/
- Solidity Docs: https://docs.soliditylang.org/

---

## Deployment Checklist

### Pre-Deployment

- [ ] All dependencies installed (`npm install`)
- [ ] Smart contract compiles (`npm run contract:compile`)
- [ ] Tests pass (`npm run contract:test`)
- [ ] Environment variables configured (`.env` set)
- [ ] Orchestrator account funded (>0.1 ARC)

### Deployment

- [ ] Contract deployed to Arc Testnet (`npm run contract:deploy:testnet`)
- [ ] Contract address saved in `.env`
- [ ] Backend server starts without errors (`npm start`)
- [ ] Frontend server starts without errors (`npm run dev`)
- [ ] Wallet connection works in UI

### Post-Deployment

- [ ] Smoke tests pass (quick 5-min test)
- [ ] Task creation works end-to-end
- [ ] Transactions visible on Arc Explorer
- [ ] Agent earnings tracked correctly
- [ ] Refunds processed correctly

### Ongoing

- [ ] Monitor orchestrator account balance
- [ ] Watch server logs for errors
- [ ] Verify transactions on explorer daily
- [ ] Track gas costs and adjust pricing if needed

---

## Summary

Arc Agent Hub is now a **pure on-chain system** where:

✅ All task execution is trustless and transparent  
✅ No server-side wallet management  
✅ Complete audit trail on blockchain  
✅ User funds locked in secure smart contract escrow  
✅ Ready for production deployment  

**Estimated time to production**: 1-2 weeks (including security audit)

---

**Created**: 2026-04-22  
**Version**: 2.0 - Pure On-Chain Architecture  
**Status**: 🟢 Ready for Deployment  
**Next Steps**: Run `npm run contract:setup` to begin
