# 🚀 Arc Agent Hub - Quick Start Guide

## ✅ System Status

- **Backend API:** http://localhost:3001/api ✓
- **Frontend:** http://localhost:3000 (Vite dev server) ✓
- **Blockchain:** Circle Arc Testnet ✓
- **Settlement:** On-chain (real USDC transfers) ✓

## 🎯 Setup Instructions

### Prerequisites
```bash
# Node.js 18+
node --version
npm --version

# Dependencies
cd backend && npm install
cd frontend && npm install
```

### Environment Variables

Create `.env` in the backend directory:
```bash
# Backend Port
PORT=3001

# Wallet & Network
WALLET_PROVIDER=onchain
ONCHAIN_NETWORK=arc-testnet
ONCHAIN_DRY_RUN=false

# On-chain Wallets (required for real transfers)
ONCHAIN_WALLETS_FILE=src/data/wallets.json

# OpenAI API (for agent optimization)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5-nano-2025-08-07
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_REASONING_EFFORT=low
OPENAI_MAX_OUTPUT_TOKENS=512

# Firebase Auth
FIREBASE_PROJECT_ID=agenthubarc
FIREBASE_SERVICE_ACCOUNT=firebase-service-account.json
AUTH_ENABLED=true
ADMIN_EMAILS=your-email@example.com

# Rate Limiting
RATE_LIMIT_AUTH=30
RATE_LIMIT_AUTH_WINDOW_MS=60000

# Pricing
PRICING_PROFILE=nano

# Selection Strategy
AGENT_SELECTION=score_price
```

### Generate Wallets

```bash
cd backend
npm run wallets:generate
# Creates src/data/wallets.json with real Arc testnet wallets
```

### Start Backend

```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
# Logs show:
# - Arc Blockchain initialization
# - Firebase Admin setup
# - API endpoints available
```

### Start Frontend

```bash
cd frontend
npm run dev
# Vite dev server on http://localhost:3000
# Connects to backend API at http://localhost:3001/api
```

## 🎬 First Steps

### 1. Open Frontend
```
http://localhost:3000
```

### 2. Authenticate with Firebase
- Sign up with email
- Or use existing Firebase account

### 3. Create/Connect Wallet
- Option A: Create new Arc wallet (generates keypair)
- Option B: Import existing Arc wallet address
- **Important:** Wallet must have USDC on Arc testnet

### 4. Fund Wallet (Arc Testnet)
```bash
# Get testnet USDC from faucet
# https://faucet.circle.com
# Send to your wallet address from step 3
```

### 5. Launch a Mission
1. Fill in task text
2. Select task type (summarize, keywords, rewrite, translate, classify, sentiment)
3. Set budget (0.0005 USDC minimum)
4. Click "Execute Mission"

### 6. Monitor Execution
- Step 1: Task received
- Step 2: Mission funded (from wallet to treasury)
- Step 3: Worker agent executes (with GPT-5-nano if available)
- Step 4: Validator checks quality
- Step 5: Agent paid (from treasury)
- Step 6: Refund if budget remaining
- Step 7: Task completed

## 📊 View Results

### Mission Control Dashboard
- Network activity stats
- Transaction history
- Agent performance metrics
- Orchestrator margin tracking
- Scale proof (batch 50+ missions)

### Inspect Transactions
- See USDC transfers on-chain
- View payment breakdown
- Check settlement status
- Monitor executor margins

## 🔍 Debugging

### Check Backend Health
```bash
curl http://localhost:3001/api/health
# Response: {"status":"ok","uptimeSec":...}
```

### Check API Connectivity
```bash
curl http://localhost:3001/api/config | jq .
# Shows wallet provider mode, network, contract address
```

### Monitor Backend Logs
```bash
# In backend terminal, watch for:
[Worker-default] LLM: gpt-5-nano ✓
[Validator-default] validation: PASS
[OnChainWalletProvider] tx ... confirmed
```

### Check Frontend Console
```javascript
// Open browser DevTools (F12)
// Check Console tab for errors
// Network tab shows API calls to /api/*
```

### Verify On-Chain Transfers
```bash
# Check Arc testnet explorer
https://testnet.arcscan.app

# Search for your wallet address
# Should see USDC transactions for each mission
```

## 🚨 Common Issues

### Issue: "AuthStore failed: SyntaxError"
**Cause:** Frontend getting HTML instead of JSON
**Fix:** 
```bash
pkill -f "node.*server.js"
pkill -f "vite"
# Restart backend first, then frontend
cd backend && npm run dev &
cd frontend && npm run dev &
```

### Issue: "Insufficient balance"
**Cause:** Wallet has no USDC on testnet
**Fix:**
1. Get address from profile page
2. Get testnet USDC from Circle faucet
3. Wait 1-2 minutes for confirmation
4. Refresh page

### Issue: "Mission failed"
**Cause:** Usually validator rejected low quality
**Fix:**
- Increase task budget (more agent options)
- Use simpler task types (summarize, keywords)
- Check task input is valid English

### Issue: "On-chain transfer failed"
**Cause:** Network issue or invalid address
**Fix:**
```bash
# Check Arc RPC endpoint
curl https://rpc.testnet.arc.network -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'
# Should return block number
```

## 📈 Performance Tips

### Reduce Costs
- Use `summarize` task (cheapest)
- Set budget to 0.0005 USDC (minimum)
- Use batching for multiple missions

### Improve Quality
- Use `rewrite` task (higher quality)
- Set budget to 0.001+ USDC (better agent selection)
- Longer input text gives better results

### Speed Up
- All agents use LLM when available
- Fallback is instant (no network)
- Typical execution: 2-5 seconds

## 🔐 Security Notes

### Wallet Security
- Private keys stored in `src/data/wallets.json` (don't commit!)
- Add to .gitignore
- In production, use external wallet service

### API Security
- Firebase Auth required for protected endpoints
- Rate limiting: 30 auth requests/min
- CORS enabled for localhost:3000

### On-Chain
- All transfers on Arc testnet (safe, low value)
- Dry run mode available (set ONCHAIN_DRY_RUN=true)
- Can switch to simulated mode anytime

## 📚 Documentation

- **[AGENTS_OPTIMIZATION.md](./AGENTS_OPTIMIZATION.md)** - Agent architecture
- **[SESSION_IMPROVEMENTS.md](./SESSION_IMPROVEMENTS.md)** - Detailed improvements
- **[README.md](./README.md)** - Original project documentation

## 🆘 Support

### Logs Location
- **Backend:** Terminal output
- **Frontend:** Browser DevTools Console
- **Transactions:** Arc Testnet Explorer

### Quick Diagnostics
```bash
# Check all services
curl http://localhost:3001/api/health && echo "Backend OK"
curl http://localhost:3000 && echo "Frontend OK"

# Check wallet
curl http://localhost:3001/api/agents | jq '.agents | length'
# Should show number of available agents

# Check recent transactions
curl http://localhost:3001/api/transactions | jq '.[] | {from, to, amount}' | head -20
```

## 🎓 Next Steps

1. **Execute a mission** with different task types
2. **Monitor execution** in Mission Control
3. **Check transactions** on Arc testnet explorer
4. **Adjust budget** to see agent quality variation
5. **Run batch simulation** to test scalability

## 📞 API Reference

### Quick Endpoints

```bash
# Health check
GET /api/health

# Config
GET /api/config

# Create task (main endpoint)
POST /api/tasks
{
  "input": "Text to process",
  "taskType": "summarize|keywords|rewrite|translate|classify|sentiment",
  "budget": 0.0005
}

# Get my tasks
GET /api/tasks/mine

# Get balance
GET /api/balances

# Get transactions
GET /api/transactions

# Get metrics
GET /api/metrics

# List agents
GET /api/agents

# Quote task
POST /api/agents/quote
{
  "input": "Text",
  "taskType": "summarize",
  "strategy": "score_price"
}
```

---

**Happy hacking! 🚀**
