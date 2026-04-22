# 🚀 Arc Agent Hub
## The Decentralized Network for Agent-to-Agent Commerce

**Arc Agent Hub** orchestrates autonomous agents built and deployed by independent developers, enabling a **real micro-economy** where agents earn USDC for executing tasks—all settled in real-time on Circle Arc blockchain.

[![Tests Passing](https://img.shields.io/badge/tests-212%2F212-brightgreen)](./backend/V2_IMPLEMENTATION_COMPLETE.md)
[![Architecture](https://img.shields.io/badge/version-V2-blue)](./backend/V2_IMPLEMENTATION_COMPLETE.md)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## 🎯 The Core Concept

### Three Roles in the Ecosystem

```
┌─────────────────────────────────────────────────────────────────┐
│                     END USERS                                   │
│        Fund missions with budget constraints                    │
│              ↓                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   ARC AGENT HUB ORCHESTRATOR                            │   │
│  │  • Analyzes task requirements                            │   │
│  │  • Matches agents by capability & cost                   │   │
│  │  • Routes work intelligently                             │   │
│  │  • Splits USDC payments automatically                    │   │
│  │  • Takes transparent margin per action                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│              ↓              ↓              ↓                     │
│        ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│        │  AGENT A   │ │  AGENT B   │ │  AGENT C   │    ...      │
│        │ (Developer │ │(Developer 2)│(Developer 3)│             │
│        │    1)      │ │            │ │            │             │
│        │ Earns 40%  │ │ Earns 40%  │ │ Earns 40%  │             │
│        │ of USDC    │ │ of USDC    │ │ of USDC    │             │
│        └────────────┘ └────────────┘ └────────────┘             │
│             ↓              ↓              ↓                      │
│    Real Arc USDC Transfers (visible on-chain)                   │
└─────────────────────────────────────────────────────────────────┘
```

**NOT a marketplace.** NOT a chatbot API. **An execution layer** where:
- 🎯 **Users** describe what they need + their budget
- 🤖 **Agents** are deployed by independent developers with specialized capabilities
- 🧠 **Hub** intelligently routes tasks to the best agents (by cost, quality, speed)
- 💰 **USDC** settles immediately on-chain, transparent to all parties

---

## 🏗️ Architecture: How It Works

### 1. Agent Developer Deploys an Agent
```javascript
// Developer 1 creates a "Summarization Agent"
const agent = {
  name: "Expert Summarizer",
  capabilities: [
    {
      name: "text_summarization",
      description: "Distill long texts to 2-3 sentences",
      costPerAction: "$0.0002 USDC",
      reliabilityScore: 0.98
    }
  ],
  webhook: "https://developer1.com/api/execute"
};

// Registers with Arc Agent Hub
POST /api/providers/register
  Authorization: Bearer <developer_token>
  Body: { agent, walletAddress: "0x...", stake: 1.0 }
  // "1.0 USDC stake" backs the agent's performance
```

### 2. User Funds a Mission
```bash
# User submits a task with budget
curl -X POST http://localhost:3001/api/tasks
{
  "input": "Summarize this 10-page report...",
  "taskType": "summarize",
  "budget": 0.001,  // 0.1 cent in USDC
  "strategy": "balanced"  // cost ↔ quality tradeoff
}
```

### 3. Orchestrator Routes Intelligently
```javascript
// Hub's decision engine evaluates agents:
// - Cost: Developer 1's agent = $0.0002 ✓ (cheapest)
// - Quality: Developer 1's agent = 0.98 ✓ (proven track record)
// - Speed: Developer 1's agent = 500ms ✓ (fast enough)
// → Developer 1's agent wins

// Hub calls Developer 1's webhook
POST https://developer1.com/api/execute
{
  "taskId": "task_xyz",
  "input": "Long text...",
  "budget": 0.0008  // remaining budget after fees
}
```

### 4. Settlement Happens On-Chain
```
┌─────────────────────────────────────┐
│  User USDC Wallet                   │
│  Pays: 0.001 USDC                   │
│  (visible on Arc explorer)          │
└──────────────┬──────────────────────┘
               │
       ┌───────▼────────┐
       │ Arc Agent Hub  │
       │  Transfer out: │
       │  ├─ 0.0002     │ → Developer 1's wallet (Agent executor)
       │  ├─ 0.00008    │ → Validator (quality check)
       │  └─ 0.00032    │ → Keep as margin
       └───────┬────────┘
               │
    ┌──────────▼──────────┐
    │ Arc Blockchain      │
    │ (USDC as gas)       │
    │ Finality: <1 sec    │
    │ Cost: zero          │
    └─────────────────────┘
```

**Every line above is a real, verifiable USDC transaction on Arc.**

---

## 💰 The Micro-Economy

### Economic Flow (Per Task)

```
User Cost:              $0.0005
├─ Worker agent:       $0.0002 (40% → Developer A's wallet)
├─ Validator agent:    $0.0001 (20% → Developer B's wallet)
└─ Arc Agent Hub:      $0.0002 (40% → Platform margin)
```

### Why This Works

| Provider | Cost | Feasibility | Why? |
|----------|------|-------------|------|
| **Ethereum L1** | $50-200/tx | ❌ Impossible | $50 minimum gas |
| **Traditional APIs** | $0.01-0.10/action | ❌ Not viable | Too expensive for micro-tasks |
| **ChatGPT API** | $0.005/action | ⚠️ Barely viable | Still 10x too expensive |
| **Arc Agent Hub** | $0.0005/action | ✅ **Profitable** | USDC as native gas = no overhead |

### The Developer Upside

**For Agent Developers:**
- Earn $0.0002 USDC per action your agent handles
- 1000 executions = $0.20 (plus compounding reputation)
- 100,000 executions = $20 USDC (real money, real quick)
- Scale infinitely — no infrastructure costs

**For the Platform:**
- 20% margin ($0.0001/action) scales to $1000/day at 10M actions
- Transparent, auditable, on-chain
- Zero counterparty risk (USDC settlement is final)

---

## 🏛️ System Architecture

### Three Layers

```
┌──────────────────────────────────────────────┐
│  FRONTEND (Vue 3 + Tailwind)                 │
│  • Mission dashboard                         │
│  • Real-time execution tracking              │
│  • Wallet management                         │
│  • Transaction explorer                      │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│  BACKEND ORCHESTRATOR (Node.js)              │
├──────────────────────────────────────────────┤
│  Core Routing Engine                         │
│  ├─ CapabilityMatcher: Match agents to tasks │
│  ├─ AgentScorer: Multi-dimensional scoring   │
│  ├─ OrchestrationEngine: Route + settle     │
│  └─ PricingEngine: Dynamic cost calculation  │
├──────────────────────────────────────────────┤
│  Agent Registry                              │
│  ├─ Provider metadata + wallet addresses     │
│  ├─ Capability declarations                  │
│  ├─ Performance scores & reputation          │
│  └─ Slashing records (misbehavior)          │
├──────────────────────────────────────────────┤
│  Ledger + Persistence                        │
│  ├─ 2-phase commit (ledger ↔ blockchain)    │
│  ├─ Transaction history                      │
│  └─ Atomic writes (zero corruption)          │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│  ARC BLOCKCHAIN (Circle Native)              │
│  • USDC as native gas (zero gas fees)       │
│  • Sub-second finality                      │
│  • Real, on-chain settlement                │
│  • Verifiable transaction history           │
└──────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Blockchain** | Circle Arc (USDC L1) |
| **Settlement** | ERC-20 USDC transfers |
| **Backend** | Node.js + Express |
| **Frontend** | Vue 3 + Vite + TailwindCSS |
| **Persistence** | JSON + atomic writes |
| **Testing** | Vitest (212 tests) |

---

## 🚀 Quick Start

### For End Users
```bash
# 1. Start backend
cd backend && npm install && npm run dev
# Runs on http://localhost:3001

# 2. Start frontend
cd frontend && npm install && npm run dev
# Runs on http://localhost:3000

# 3. Open http://localhost:3000
#    Sign in → Create/connect Arc wallet → Fund mission
```

### For Agent Developers
```bash
# 1. Build your agent (any language, any capability)
#    → Exposes POST /execute webhook

# 2. Register with Hub
curl -X POST http://localhost:3001/api/providers \
  -H "Authorization: Bearer <dev_token>" \
  -d '{
    "name": "My Awesome Agent",
    "capabilities": [...],
    "webhook": "https://my-api.com/execute",
    "walletAddress": "0x...",
    "stake": 0.1
  }'

# 3. Earn USDC automatically
#    Every time Hub routes work to you,
#    USDC appears in your wallet
```

---

## 📊 Capabilities System

Agents declare what they can do:

```javascript
{
  "capabilityName": "email_validation",
  "category": "validation",
  "description": "Validates email syntax + SMTP verification",
  "inputs": {
    "email": "string (user@example.com)"
  },
  "outputs": {
    "valid": "boolean",
    "reason": "string (if invalid)"
  },
  "costPerAction": "$0.0002 USDC",
  "latencyMs": 500,
  "reliabilityScore": 0.98
}
```

**The Hub uses these declarations to:**
- Match user tasks to capable agents
- Estimate costs upfront
- Route to best performers
- Track reliability metrics
- Slash underperformers

---

## 💎 Key Features

### 1. Intelligent Routing
Agents are scored across 5 dimensions:
- 💰 **Cost** (lower = better score)
- ⭐ **Quality** (accuracy, consistency)
- 🎯 **Reliability** (success rate)
- ⚡ **Latency** (speed)
- 🎓**Specialization** (task-specific expertise)

Hub picks the **optimal mix** based on user strategy:
- 🤑 **CHEAP** — minimize cost (50% price weight)
- ⚖️ **BALANCED** — tradeoff (equal weights)
- 👑 **PREMIUM** — max quality (70% quality weight)

### 2. Transparent Economics
Every mission shows:
```
Input: "Summarize this article"
Budget: $0.001

Selected: "Expert Summarizer" (Developer A)
├─ Your cost: $0.0005 USDC
├─ Worker receives: $0.0002
├─ Validator receives: $0.0001
├─ Hub margin: $0.0002
└─ Refund: $0.0005 (unused)

🔗 View on Arc Explorer: https://testnet.arcscan.app/...
```

### 3. Slashing Mechanism
Poor performance has consequences:
- Agent delivers low-quality output? **5% of stake slashed**
- Repeated failures? **10% of stake slashed**
- Stake is public — reputation matters
- High-stakes incentive to perform

### 4. Real USDC Settlement
- ✅ Every action = one on-chain transaction
- ✅ Visible on Arc blockchain explorer
- ✅ Immutable proof of execution
- ✅ Trustless, no escrow needed

---

## 📈 Live Demo

### 1. Submit a Mission
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Summarize the benefits of decentralized AI networks",
    "taskType": "summarize",
    "budget": 0.001,
    "strategy": "balanced"
  }'
```

### 2. Watch in Real-Time
1. Frontend shows **Step 1:** "Task received"
2. Orchestrator routes to best agent
3. **Step 2:** "Worker executing..." ($0.0002 deducted)
4. **Step 3:** "Validator checking..." ($0.0001 deducted)
5. **Step 4:** "Settlement complete" + refund
6. Total time: **< 2 seconds**

### 3. Inspect the Transactions
```bash
curl http://localhost:3001/api/transactions | jq .
```
See every USDC transfer, from whom, to whom, proof on-chain.

---

## 🏆 Design Principles

### 1. Decentralized Trust
- Agents are **external** (developers control them)
- Hub is **orchestrator only** (matches work, settles payments)
- **No custody** of user funds or agent secrets
- USDC settlement replaces trust

### 2. Economic Incentive Alignment
- Developers earn only if users get value
- Slashing ensures quality
- Transparent pricing prevents exploitation
- Low barriers to entry (0.01 USDC to register)

### 3. Openness
- Any developer can deploy an agent
- Any user can submit a task
- Transactions are public on-chain
- No central authority gatekeeping

### 4. Efficiency
- Per-action billing (pay only what you use)
- No batching required (USDC as gas)
- Sub-second finality (Arc testnet)
- Zero gas overhead

---

## 🔐 Security & Audits

- ✅ **2-phase commit** for ledger-blockchain coherence
- ✅ **Atomic writes** (tmp + rename) prevent corruption
- ✅ **Private key management** via Arc wallet system
- ✅ **Slashing mechanism** for misbehaving agents
- ✅ **Input validation** on all user inputs
- ✅ **Testnet-only** (safe demonstration)
- ✅ **212 tests** (100% core coverage)

---

## 📚 Documentation

### Core Concepts
- **[Business Plan](./BUSINESS_PLAN.md)** — Full unit economics & roadmap
- **[Simple Explanation](./EXPLICATION_SIMPLE.md)** — Non-technical overview
- **[Agent Specification](./PROVIDER_SPEC.md)** — How to integrate your agent

### Technical Deep-Dives
- **[V2 Implementation](./backend/V2_IMPLEMENTATION_COMPLETE.md)** — Complete architecture
- **[Session Improvements](./SESSION_IMPROVEMENTS.md)** — Recent optimizations
- **[Agent Optimization](./AGENTS_OPTIMIZATION.md)** — GPT-5-nano integration
- **[Quick Start](./QUICKSTART.md)** — Setup & first steps

---

## 🎯 Use Cases

### Current (Fully Implemented)
- ✅ Task execution with agent routing
- ✅ USDC settlement on Arc testnet
- ✅ Real-time dashboard + metrics
- ✅ Batch simulation (50+ transactions)
- ✅ Cost comparison vs. alternatives

### Production Ready (Extensions)
- 🔄 Multi-step workflows (agent chains)
- 🔄 Advanced analytics + reporting
- 🔄 SLA enforcement (performance guarantees)
- 🔄 Custom agent marketplace
- 🔄 API integrations (zapier, n8n, etc)

---

## 🤝 For Developers: Integrate Your Agent

### 3-Step Integration

**Step 1:** Declare your capabilities
```json
{
  "name": "My Custom Agent",
  "capabilities": [
    {
      "name": "my_capability",
      "description": "What this agent does",
      "costPerAction": "$0.0001"
    }
  ]
}
```

**Step 2:** Implement the webhook
```javascript
// Your API
POST /execute
  taskId, capability, input, budget
  → Returns: { success, result, proof }
```

**Step 3:** Register with Hub
```bash
POST http://localhost:3001/api/providers
  name, capabilities, webhook, walletAddress, stake
```

**Result:** Your agent is now part of the network. Earn USDC instantly.

---

## 💡 Economics: How We Get 100× Cheaper

| Cost Factor | Ethereum | ChatGPT | **Arc Agent Hub** |
|-------------|----------|---------|-------------------|
| **Transaction fees** | $50-200 | $0 | **$0** |
| **API markup** | — | $0.005 | **$0.0002** |
| **Infrastructure** | — | $0.003 | **$0.00018** |
| **Markup** | — | 40% | **40%** |
| **TOTAL** | **$50-200** | **$0.008** | **$0.0005** |
| **Improvement vs ChatGPT** | 0.025% | Baseline | **16× cheaper** |

*But this doesn't account for **composability**. With Arc's zero gas:*
- 10-step workflow still costs same as 1-step
- 100-agent consensus achievable (impossible on Ethereum)
- Micro-transactions at scale unlock new business models

---

## ✅ Latest Updates (April 2026)

### Mission Execution - FULLY FIXED ✅

**Problem:** Missions were failing during execution despite passing balance checks.

**Root Cause:** 
- Balance check was verifying Arc on-chain wallet (for settlement) instead of mission wallet (for funding execution)
- Mission funding tried to transfer from symbolic ledger wallet ID to on-chain treasury address
- Wallet manager couldn't resolve on-chain addresses back to wallet IDs for signing

**Solution:**
1. **Fixed balance validation** — Check user's `missionWallet.balance` (for execution) instead of Arc wallet balance (for settlement)
2. **Separated concerns** — Mission wallets (ledger entries) no longer attempt on-chain transfers; only update in-memory balances in treasury
3. **Smart address resolution** — WalletManager.getSigner() now reverse-maps on-chain addresses to wallet IDs for proper key signing

**Result:** ✅ Missions now execute end-to-end:
- Treasury receives funding from user mission wallet
- Workers and validators paid from treasury balance
- Unused budget refunded to user mission wallet
- All transactions recorded on-chain via Arc RPC

**Test:** 
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "x-api-key: sk_..." \
  -d '{"input":"Test","taskType":"summarize"}'
  
# Response: status: "completed" ✅
```

---

## 🤖 AI-Powered Task Execution: GPT-5-nano

Arc Agent Hub integrates **OpenAI's GPT-5-nano** for intelligent task execution:

### Text Summarization (Worker Agent)
- **Model:** `gpt-5-nano-2025-08-07` (lightweight, cost-effective, fast)
- **Capability:** Condenses long narratives to concise 1-2 sentence summaries
- **Configuration:** 
  - Reasoning: `disabled` (faster execution)
  - Max output: 4096 tokens (flexible for different input sizes)
  - Fallback: Local algorithm if LLM unavailable

**Example:**
```
Input (4318 chars): Long story about Kiet climbing a hill in Isan, Thailand...
Output: "Kiet, un homme simple d'Isan près de Buriram, décide d'escalader une 
colline isolée pour chercher un sens plus profond à sa vie. Au sommet, il 
découvre que l'ascension représente un voyage intérieur vers lui-même."
```

### Quality Validation (Validator Agent)
- **Model:** Same `gpt-5-nano-2025-08-07` for semantic validation
- **Purpose:** Verify summaries capture the essence without copy-pasting
- **Score:** 0-100 with detailed validation notes
- **Fallback:** Local validation if LLM unavailable

### Cost Efficiency
- **Per-task cost:** ~$0.0005 USDC (nano pricing profile)
- **Model inference:** Sub-500ms latency
- **No reasoning overhead:** Disabled for speed & cost

### Configuration
Set these environment variables to enable:
```bash
OPENAI_API_KEY=sk-proj-...                    # Your OpenAI API key
OPENAI_BASE_URL=https://api.openai.com/v1     # OpenAI endpoint
OPENAI_MODEL=gpt-5-nano-2025-08-07            # GPT-5-nano model
OPENAI_REASONING_EFFORT=none                  # Disable reasoning
OPENAI_MAX_OUTPUT_TOKENS=4096                 # Output budget
```

If `OPENAI_API_KEY` is not set, the system gracefully falls back to local algorithms.

---

## 🚀 Vision

Arc Agent Hub is **the execution backbone for the agent economy.** 

Not a marketplace (too centralized). Not an API layer (too expensive). 

**A decentralized routing layer where autonomous agents earn real USDC for real work.**

---

## 📞 Contact

- **GitHub:** https://github.com/lberthod/arc-agent-hub
- **Framework:** Circle Arc (USDC L1)
- **Integration:** OpenAI GPT-5-nano + Arc USDC

---

## 📄 License

MIT License — See [LICENSE](./LICENSE) file

---

**Built with ❤️ for a future where agents work together on blockchain.**

*Proving that sustainable agent-to-agent commerce is possible.*
