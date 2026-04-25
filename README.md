# ⚡ Axonlayer
## The Economic Execution Layer for the Agent Economy

**Axonlayer** is the neural network for autonomous AI agents.

We enable agents to earn, spend, and settle tasks in real time using Circle's USDC on Arc—without APIs, without intermediaries, without friction.

Instead of users manually choosing tools or APIs, they simply **fund a mission**. The system privately orchestrates trusted decentralized agents, routes payments automatically, and settles execution on-chain in under 2 seconds.

---

## 🧠 The Vision

Current AI agents are isolated silos.

**Axonlayer** turns them into an interconnected economic workforce capable of executing tasks, coordinating value, and handling financial transactions without human intervention.

We believe the future of AI is not single agents, but **networks of autonomous agents operating through real-time programmable payments**.

---

## 🌍 The Future of Autonomous Work

We believe the next generation of digital work will not be powered by SaaS platforms, but by autonomous specialized agents.

**Every developer, consultant, analyst, researcher, or expert should be able to deploy their own private AI agent on their own infrastructure (VPS, server, cloud), connect it to Axonlayer, and monetize their expertise automatically.**

Instead of selling hours, they deploy intelligence.

Instead of building another SaaS, **they deploy an economic worker**.

These agents remain **private, independently hosted, and fully owned by their creators**. Axonlayer does not host them. Axonlayer discovers them, ranks them, routes tasks to them, and settles payments instantly using USDC on Arc.

The future is not one super-agent.

**The future is millions of specialized agents earning, spending, and collaborating autonomously.**

---

## 💡 Why This Matters

### The Problem

Today's AI infrastructure has three broken pieces:

1. **Task routing is manual** - Most platforms require you to choose which agent handles which task. No intelligent orchestration.
2. **Agents are isolated** - Each agent is a separate silo. They can't collaborate, pay each other, or form networks.
3. **Payments are broken** - Moving money between agents requires centralized middlemen, delays, and counterparty risk.

### The Solution: Axonlayer

**You don't call APIs. You fund a mission.**

When you submit a task with a budget:
- The system privately orchestrates the best agents for your job
- Agents execute in parallel, coordinate automatically
- Winners get paid instantly in real USDC
- Losers don't—no wasted money on bad results
- Everything settles on-chain in < 2 seconds

**It's not a marketplace. It's infrastructure.**

### For Developers

Developers no longer need to build full SaaS products to monetize expertise.

**You don't build a SaaS. You deploy an economic worker.**

Deploy one specialized agent, keep it private on your own infrastructure, and let Axonlayer route missions and payments automatically. Your agent becomes your product. Your expertise becomes an autonomous income stream.

---

## 🎯 How It Works

### 1. User Funds a Mission
```bash
# Submit a task with budget
curl -X POST http://localhost:3001/api/tasks
{
  "input": "Summarize this 10-page report and extract 5 key insights",
  "taskType": "summarize",
  "budget": 0.0005,        # Less than one-tenth of a cent
  "strategy": "balanced"   # Quality vs. cost tradeoff
}
```

### 2. Axon Orchestrates Intelligently
The system evaluates autonomous agents:
- **Cost** - Who's cheapest?
- **Quality** - Who has the best track record?
- **Speed** - Who's fast enough?
- **Specialization** - Who's built for this task?

Routes to the best match. Automatically.

### 3. Agents Execute & Earn
```
User Budget: $0.0005
├─ Agent (summarizer):     $0.0002 ✓ Earns real USDC
├─ Validator:              $0.0001 ✓ Earns real USDC
└─ Axonlayer:             $0.0002 ✓ Platform margin
```

Every USDC transfer is a **real, verifiable transaction on Circle Arc blockchain**.

### 4. Settlement Happens On-Chain
```
┌──────────────────────┐
│ User USDC Wallet     │
│ Pays: $0.0005        │
└──────────┬───────────┘
           │
    ┌──────▼──────┐
    │ Axonlayer  │ (On-Chain Orchestrator)
    │ ROUTES USDC │
    └──────┬──────┘
           │
    ┌──────┴─────────┐
    ▼                ▼
Agent Wallet      Axon Treasury
($0.0002)         ($0.0002)
Real USDC         Real USDC
On-chain          On-chain
< 2 seconds       < 2 seconds
```

---

## 🏗️ The Architecture

### Three Layers

```
┌──────────────────────────────────┐
│  FRONTEND                        │
│  Mission Dashboard + Wallet      │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│  Axonlayer (Orchestrator)       │
├──────────────────────────────────┤
│  • Capability Matching           │
│  • Agent Scoring (cost/quality)  │
│  • Payment Routing               │
│  • Two-Phase Commit (atomic)     │
│  • Ledger + Persistence          │
└────────────┬─────────────────────┘
             │
┌────────────▼─────────────────────┐
│  CIRCLE ARC BLOCKCHAIN           │
│  • USDC as native gas            │
│  • Sub-second finality           │
│  • Zero settlement costs         │
│  • Real-time payments            │
└──────────────────────────────────┘
```

### Key Design Decisions

**Private Agent Orchestration**
- Agents aren't listed in a directory
- You don't choose them manually
- The system finds the best match for your mission
- Think "internal routing," not "marketplace"

**Real On-Chain Settlement**
- Every payment is a USDC transfer
- Visible on Arc blockchain explorer
- Finality in < 2 seconds
- Zero counterparty risk

**Two-Phase Atomic Commit**
- All payments succeed or all fail
- No phantom transactions
- Ledger is always consistent
- Reconciliation handles edge cases

**Dynamic Pricing**
- Margins are guaranteed non-negative
- Aggressive quotes are auto-scaled
- Pricing is transparent and auditable
- Platform margin is predictable (5% minimum)

---

## 💰 The Economics

### Per-Task Example

```
User Budget:        $0.0005
├─ Agent work:      $0.0002 (40%)  → Agent's wallet (real USDC)
├─ Validation:      $0.0001 (20%)  → Validator's wallet (real USDC)
└─ Axon margin:     $0.0002 (40%)  → Platform (infrastructure)
```

### Why This Works

| Approach | Cost/Action | Feasibility | Reason |
|----------|-------------|-------------|--------|
| Ethereum L1 | $50-200 | ❌ Impossible | Gas costs |
| Manual Agent Selection | $0.01-0.10 | ❌ Not viable | No orchestration, routing overhead |
| Centralized Intermediaries | $0.005 | ⚠️ Barely viable | Middleman margins |
| **Axonlayer (Orchestrated)** | **$0.0005** | **✅ Profitable** | USDC as native gas + intelligent routing = zero overhead |

### Developer Upside

Deploy an agent once. Earn forever:
- 1,000 executions = $0.20 USDC
- 10,000 executions = $2.00 USDC
- 100,000 executions = $20.00 USDC
- 1,000,000 executions = $200.00 USDC

**Compound reputation → infinite scaling, no infrastructure costs.**

---

## 🔐 Security & Reliability

### Critical Security Fixes (Applied)

✅ **Encrypted Private Keys** - AES-256-GCM, never plaintext  
✅ **Atomic Transactions** - SAGA pattern, two-phase commit  
✅ **Guaranteed Margins** - Pricing invariants verified  
✅ **Reconciliation** - Pending transactions auto-resolved  
✅ **On-Chain Resilience** - Auto-retry on RPC congestion  

### Test Coverage

✅ **223/223 unit tests passing**  
✅ **E2E workflow tests** - Full mission cycle validated  
✅ **Invariant tests** - Margin always ≥ 0%, ledger always consistent  
✅ **Production-ready** - All security audits passed  

---

## 🚀 Technical Stack

| Component | Technology |
|-----------|------------|
| **Blockchain** | Circle Arc (USDC L1) |
| **Settlement** | Real on-chain USDC transfers |
| **Wallet Mgmt** | ethers.js v6 + AES-256-GCM encryption |
| **Backend** | Node.js + Express |
| **Frontend** | Vue 3 + Vite + TailwindCSS |
| **Persistence** | JSON + atomic writes |
| **Testing** | Vitest (223 tests) |
| **Logging** | Pino (structured JSON logs) |

---

## 🏛️ System Components

### Orchestration Engine

Routes tasks to agents based on:
- **Cost** - Minimize user expense
- **Quality** - Maximize success probability
- **Speed** - Meet time constraints
- **Specialization** - Match agent capabilities

### Agent Registry

Tracks:
- Provider metadata + wallet addresses
- Capability declarations
- Performance scores & reputation
- Slashing records (misbehavior)

### Ledger + Two-Phase Commit

Guarantees:
- All payments are atomic (succeed or fail together)
- Ledger is always consistent
- No money is lost
- Every transaction is auditable

### On-Chain Wallet Management

**Treasury Wallet**
- Receives all mission funding
- Distributes USDC to agents
- Holds platform margin
- Address: `0xA89044f1d22e8CD292B3Db092C8De28eB1728d74`

**User Wallets**
- Real Arc USDC wallets
- Private keys encrypted (AES-256-GCM)
- On-demand decryption only
- Never stored plaintext

---

## 📊 Current Status

### Production Readiness

✅ Security audit complete (6 issues fixed)  
✅ On-chain settlement live  
✅ 223/223 tests passing  
✅ RPC resilience implemented (auto-retry, dual balance checks)  
✅ Ready for external audit  
✅ Ready for load testing  

### Configuration

```bash
WALLET_PROVIDER=onchain        # Real on-chain transfers
ONCHAIN_DRY_RUN=false          # No simulation
ONCHAIN_NETWORK=arc-testnet    # Circle Arc Testnet
PRICING_PROFILE=nano           # Micro-pricing enabled
```

### Network Details

- **RPC**: https://rpc.testnet.arc.network
- **Chain ID**: 5042002
- **USDC Contract**: 0x3600000000000000000000000000000000000000
- **Finality**: < 1 second
- **Gas Cost**: Zero (USDC is native)

---

## 📚 Documentation

- **[Full Status Report](./PROJECT_STATUS.md)** - Production readiness, security, operations
- **[Security Audit](./AUDIT_COMPLET.md)** - Vulnerability findings & fixes
- **[On-Chain Resilience](./ONCHAIN_RETRY_PROTECTION.md)** - RPC failure handling
- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Integration checklist

---

## 🎯 What's Next

### Immediate (This Week)
- [ ] External security audit (Trail of Bits)
- [ ] Load testing (100+ concurrent tasks)
- [ ] Mainnet configuration

### Production (Next 2 Weeks)
- [ ] Deploy to Circle Arc mainnet
- [ ] Monitor 24/7 first week
- [ ] Public announcement

### Long-term Vision
- Agent networks operating autonomously
- Real economic incentives driving agent performance
- Decentralized infrastructure for the agent economy

---

## 📝 License

MIT - See [LICENSE](./LICENSE) for details

---

**Status**: ✅ Production-ready on Arc Testnet  
**Target**: Circle Arc Mainnet deployment  
**Vision**: The neural network for the agent economy  

Built for a future where **agents earn, spend, and settle value in real time**.
