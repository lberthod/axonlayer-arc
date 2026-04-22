# PHASE 2: Deployment Guide

## Overview
This guide walks through deploying the TaskManager smart contract to Arc Testnet and configuring the backend for pure on-chain task execution.

---

## Step 1: Get Arc Testnet Tokens

### Option A: Faucet (Free)
1. Go to https://faucet.testnet.arc.network
2. Enter your wallet address (you'll get it in Step 2)
3. Request tokens (takes 1-2 minutes)
4. You'll receive test Arc tokens for gas fees

### Option B: Alternative Faucet
If the main faucet is down, try: https://testnet.arc.network/faucet

---

## Step 2: Generate Orchestrator Account

The orchestrator is the backend service account that will settle tasks and collect fees.

```bash
# Generate a new account in the current Hardhat config
npx hardhat accounts

# Copy the first address (public key) and private key
# This will be your ORCHESTRATOR_ADDRESS and ORCHESTRATOR_PRIVATE_KEY
```

Output will look like:
```
0x1234567890abcdef1234567890abcdef12345678  <-- ORCHESTRATOR_ADDRESS
0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890  <-- ORCHESTRATOR_PRIVATE_KEY
```

### Fund the Orchestrator
1. Use the faucet (Step 1) to send Arc tokens to your ORCHESTRATOR_ADDRESS
2. Minimum: 0.5 Arc tokens (enough for ~100 transactions)
3. Verify funding: https://explorer.testnet.arc.network

---

## Step 3: Update .env File

Edit `backend/.env` with your values:

```bash
# Smart Contract Configuration - Arc Testnet
ARC_TESTNET_RPC=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002
ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000

# Orchestrator wallet (from Step 2)
ORCHESTRATOR_PRIVATE_KEY=0xabcdef1234...  # Private key (keep secret!)
ORCHESTRATOR_ADDRESS=0x1234567890...      # Public address (shown in logs)

# TaskManager address (leave empty for now, will be set after deployment)
TASK_MANAGER_ADDRESS=0x0000000000000000000000000000000000000000
```

⚠️ **IMPORTANT**: Never commit the ORCHESTRATOR_PRIVATE_KEY to git. It's already in .gitignore.

---

## Step 4: Compile Smart Contract

Verify the contract compiles correctly:

```bash
npm run contract:compile

# Expected output:
# > agent-usdc-task-network-backend@1.0.0 contract:compile
# > hardhat compile
# 
# Compiled 2 Solidity files successfully (evm target: paris)
```

If there are errors, check:
- Node version: `node -v` (should be ≥20.12.0)
- Dependencies: `npm install`
- OpenZeppelin contracts: `ls node_modules/@openzeppelin/contracts`

---

## Step 5: Deploy TaskManager Contract

Deploy to Arc Testnet:

```bash
npm run contract:deploy:testnet

# Expected output:
# Deploying TaskManager contract...
# 
# Deployment Configuration:
# - USDC Token Address: 0x3600000000000000000000000000000000000000
# - Orchestrator Address: 0x1234567890...
# - Network: arcTestnet
# - Chain ID: 5042002
# 
# Deploying TaskManager...
# ✅ TaskManager deployed at: 0xabcdef1234567890...
# ⚠️  SAVE THIS ADDRESS - Add to .env as TASK_MANAGER_ADDRESS
```

### Save the Contract Address

Copy the deployed address (starts with 0x...) and update `.env`:

```bash
# In backend/.env:
TASK_MANAGER_ADDRESS=0xabcdef1234567890... # Your deployed address
```

### Verify on Explorer

Check that the contract was deployed:
- URL: `https://explorer.testnet.arc.network/address/{TASK_MANAGER_ADDRESS}`
- Should show "Contract" under "Type"
- Should display TaskManager code in "Code" tab

---

## Step 6: Test Contract Interactions

Optional: Run the test suite locally before deploying:

```bash
npm run contract:test

# Expected output:
# > agent-usdc-task-network-backend@1.0.0 contract:test
# > hardhat test
# 
# TaskManager Contract
#   Task Creation
#     ✓ Should create a task and transfer USDC to contract (1234ms)
#     ✓ Should reject task creation with zero budget
#   Worker Result Submission
#     ✓ Should submit worker result and update task status
#   Validation
#     ✓ Should submit validation and update task status
#   ...
# 
# 10 passing (5s)
```

---

## Step 7: Start Backend Server

Now the backend is ready to accept on-chain tasks:

```bash
npm start

# Expected output:
# [Server] ✅ Smart contract initialized for on-chain task execution
# [ContractManager] ✅ Initialized on Arc Testnet
# [ContractManager] Contract Address: 0xabcdef1234567890...
# [ContractManager] Orchestrator Address: 0x1234567890...
# 
# Server running on http://localhost:3001
# Settlement mode: onchain
# Pricing profile: nano
# On-chain network: Arc Testnet (chainId 5042002)
# USDC contract:    0x3600000000000000000000000000000000000000
# 
# API endpoints available:
# ...
# 
# [On-Chain Mode] Arc Testnet Smart Contract
#   Contract: 0xabcdef1234567890...
#   Orchestrator: 0x1234567890...
#   Explorer: https://explorer.testnet.arc.network
```

---

## Step 8: Create Test On-Chain Task

Test the full flow with a POST request:

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Summarize this: Artificial intelligence is transforming industries",
    "taskType": "summarize",
    "budget": "10",
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f123",
    "targetLang": "English"
  }'
```

Expected response (200 Created):
```json
{
  "success": true,
  "taskId": "0xabcdef1234567890...",
  "transactionHash": "0x1234567890abcdef...",
  "blockNumber": 12345,
  "gasUsed": "125000",
  "explorerUrl": "https://explorer.testnet.arc.network/tx/0x1234567890abcdef...",
  "contract": "0xabcdef1234567890...",
  "message": "Task created on Arc Testnet blockchain. Use taskId to track execution.",
  "note": "This task is now immutable and transparent on-chain. No server-side wallet was involved."
}
```

### Verify on Explorer
- Open the `explorerUrl` from the response
- Should show transaction from ORCHESTRATOR_ADDRESS
- Should show successful contract call to createTask

---

## Step 9: Check Task Status

Query the created task:

```bash
curl http://localhost:3001/api/tasks/{taskId}
```

Response:
```json
{
  "success": true,
  "task": {
    "id": "0xabcdef1234567890...",
    "creator": "0x742d35Cc6634C0532925a3b844Bc9e7595f123",
    "input": "Summarize this...",
    "budget": "10",
    "totalSpent": "0",
    "result": "",
    "validationScore": 0,
    "status": 0,
    "taskType": "summarize",
    "metadata": {...}
  },
  "explorerUrl": "https://explorer.testnet.arc.network",
  "note": "This task state is verified on-chain and immutable"
}
```

Status values:
- 0 = Pending
- 1 = Processing
- 2 = Validated
- 3 = Completed
- 4 = Failed

---

## Troubleshooting

### "Smart contract not initialized"
**Problem**: Server logs show `⚠️ Smart contract not available`

**Solution**:
1. Check TASK_MANAGER_ADDRESS is set in .env: `grep TASK_MANAGER_ADDRESS .env`
2. Check ORCHESTRATOR_PRIVATE_KEY is set: `grep ORCHESTRATOR_PRIVATE_KEY .env`
3. Check network RPC is accessible: `curl https://rpc.testnet.arc.network`
4. Verify contract was deployed: `https://explorer.testnet.arc.network/address/{TASK_MANAGER_ADDRESS}`

### "Insufficient balance for gas"
**Problem**: Deployment or task creation fails with "insufficient balance"

**Solution**:
1. Request more Arc tokens from faucet
2. Verify received: `https://explorer.testnet.arc.network/address/{ORCHESTRATOR_ADDRESS}`
3. Wait 2 minutes for transaction to confirm

### "USDC transfer failed"
**Problem**: Task creation fails at transfer step

**Solution**:
1. Verify USDC contract address: `grep ARC_USDC_ADDRESS .env`
2. Should be: `0x3600000000000000000000000000000000000000`
3. Check user has USDC on testnet
4. Verify contract has USDC allowance from user

### "Transaction reverted: Task already exists"
**Problem**: Creating task with same ID

**Solution**:
- Task IDs are unique per (creator, timestamp, counter)
- This shouldn't happen in normal operation
- If it does, wait a moment and retry

---

## Next Steps

✅ Smart contract deployed on Arc Testnet  
✅ Backend connected to contract  
✅ Tasks created and stored on-chain  

Next: **Phase 3 - Frontend Integration**
- Add MetaMask wallet connection
- Create web3Store.js for wallet state
- Update WalletManager.vue for on-chain balance display
- Display explorer links to transactions

---

## References

- **Arc Network**: https://arc.network
- **Arc Testnet Explorer**: https://explorer.testnet.arc.network
- **Arc Testnet RPC**: https://rpc.testnet.arc.network
- **Ethers.js Docs**: https://docs.ethers.org/v6/
- **Arc Blockchain Docs**: https://docs.arc.network

---

## Security Notes

⚠️ **Never share your ORCHESTRATOR_PRIVATE_KEY**
- Don't paste it in chat, forums, or emails
- Don't commit it to public repositories
- It's in .gitignore - keep it that way

✅ **Best Practices**:
- Rotate orchestrator key periodically
- Monitor on-chain transactions: https://explorer.testnet.arc.network
- Set up alerts for failed transactions
- Keep Arc token balance above 0.1 for gas

---

Last Updated: 2026-04-22
Phase 2 Completion: Deployment ✅
