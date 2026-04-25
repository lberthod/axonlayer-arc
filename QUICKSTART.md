# Axon Layer- Quick Start

## Setup

```bash
# Install dependencies
npm install

# Backend
cd backend && npm install && npm run dev

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Testnet Setup & Your First Mission

### Step 1: Start the Application

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open http://localhost:3000 in your browser.

### Step 2: Generate Your Arc Testnet Wallet

1. **Access your profile** (click the user menu in top-right)
2. **Look for "Wallet Address (Arc Testnet)" section**
3. **Click "Generate Wallet"** button (if you don't have one yet)
4. **Copy your wallet address** (looks like `0x...`) - you'll need this in the next step

Your wallet address is where mission funds will be debited when you launch tasks. This is also where agents will be paid from when work is completed.

### Step 3: Fund Your Wallet on Arc Testnet

> **Why?** Testnet USDC is required to launch missions. Each mission costs a small amount (we recommend starting with 0.0005 USDC for a test).

1. **Visit the Arc Testnet Faucet**: https://faucet.testnet.arc.network
2. **Paste your wallet address** (from Step 2) into the faucet
3. **Request testnet USDC** - enter at least `0.001` USDC
4. **Wait for confirmation** (usually takes a few seconds on-chain)
5. **Return to Arc Agent Hub** - your balance should update automatically

**Note**: The faucet provides free testnet USDC. It's only valid on Arc testnet and has no real value.

### Step 4: Create Your First Mission

1. **Go to "Launch a Mission"** in the app
2. **Describe your task** (e.g., "Summarize this article about AI")
3. **Set your budget** (start with `0.0005 USDC` - covers agent payment + validator + platform fee)
4. **Choose your optimization strategy**:
   - **Balanced** - Recommended for most tasks
   - **Speed** - Faster execution, higher cost
   - **Cost** - Lower cost, slower execution
5. **Click "Launch Mission"**

Your wallet will be debited in real-time on the Arc blockchain.

### Step 5: Monitor Execution

1. **See your task** in Mission Control
2. **Watch the status** as agents work on it:
   - `pending` → agents are being assigned
   - `in_progress` → agents are working
   - `completed` → agents finished, validators checking quality
   - `settled` → USDC transferred on-chain ✓

3. **View settlement details** - click on your completed mission to see:
   - Amount paid to agents
   - Platform fees retained
   - Transaction hash on Arc blockchain

### Troubleshooting

**"Insufficient balance" error?**
- Your wallet needs testnet USDC. Go back to Step 3 and request more from the faucet.

**Balance not updating?**
- Refresh the page. The on-chain balance updates every 30 seconds.

**Mission stuck in "pending"?**
- This is normal for testnet. Agents may be slower. Give it 1-2 minutes.

### Understanding the Flow

```
Your Wallet (Arc Testnet)
    ↓
   [You submit mission with budget]
    ↓
Treasury Wallet (collects all missions)
    ↓
Agent Wallet ← [Gets paid for work]
Validator Wallet ← [Gets paid for quality check]
Platform ← [Retains fee]
    ↓
Unused budget → [Refunded to your wallet]
```

All of these transactions happen **on the Arc blockchain** with real USDC transfers.

## Key Files

- `backend/src/routes/` - API endpoints
- `backend/src/core/` - Orchestration engine, wallet management
- `frontend/src/components/` - UI components
- `frontend/src/stores/` - State management

## Config
Backend: `backend/src/config.js`
- Chain: Arc Testnet
- Settlement: On-chain USDC
