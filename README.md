# Agent-to-Agent USDC Task Network MVP

A demonstration of an economic network where autonomous software agents collaborate to execute tasks while exchanging USDC micropayments for each action.

## Objective

This MVP demonstrates that a network of agents can collaborate on a simple task with USDC micropayments per action, in a traceable, modular, and economically transparent way.

## Architecture

### Backend (Node.js + Express)
- **Orchestrator Agent**: Receives user tasks, creates execution plans, distributes tasks to other agents, aggregates results, and retains a margin
- **Worker Agent**: Executes basic tasks (text summarization, keyword extraction, rewriting) and bills in USDC
- **Validator Agent**: Verifies output quality and bills for validation in USDC
- **Ledger**: Internal USDC wallet system tracking balances and transactions
- **Payment Adapter**: Abstracted payment system (currently simulated, extensible to real USDC)
- **Task Engine**: Manages task lifecycle and execution
- **Simulation Engine**: Generates transaction volume for demos

### Frontend (Vue 3 + Vite + TailwindCSS)
- Dashboard with task submission form
- Real-time result display
- Wallet balance visualization
- Transaction history table
- Execution timeline
- Simulation panel for generating 50+ transactions

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3001`

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### POST /api/tasks
Create and execute a task

**Request:**
```json
{
  "input": "Long text to summarize",
  "taskType": "summarize"
}
```

**Response:**
```json
{
  "taskId": "task_123",
  "status": "completed",
  "result": "summary text",
  "validation": {
    "valid": true,
    "score": 0.95,
    "notes": "Summary format is valid"
  },
  "transactions": [],
  "balances": {},
  "executionSteps": [],
  "margin": 0.002
}
```

### GET /api/balances
Get all wallet balances

**Response:**
```json
{
  "client_wallet": 9.995,
  "orchestrator_wallet": 5.002,
  "worker_wallet": 1.002,
  "validator_wallet": 1.001
}
```

### GET /api/transactions
Get transaction history

**Query Parameters:**
- `taskId`: Filter by task ID
- `wallet`: Filter by wallet address
- `latest`: Return N most recent transactions

### POST /api/simulate
Run simulation to generate transaction volume

**Request:**
```json
{
  "count": 50
}
```

**Response:**
```json
{
  "executed": 50,
  "transactionsCreated": 100,
  "summary": {
    "grossVolume": 0.25,
    "workerRevenue": 0.10,
    "validatorRevenue": 0.05,
    "orchestratorMargin": 0.10
  }
}
```

## Economic Model

### Pricing Structure
- **Client pays**: 0.005 USDC per task
- **Worker receives**: 0.002 USDC per task
- **Validator receives**: 0.001 USDC per task
- **Orchestrator retains**: 0.002 USDC per task

### Wallets
- `client_wallet`: User's wallet (starts with 10 USDC)
- `orchestrator_wallet`: Orchestrator's wallet (starts with 5 USDC)
- `worker_wallet`: Worker agent's wallet (starts with 1 USDC)
- `validator_wallet`: Validator agent's wallet (starts with 1 USDC)

## Task Execution Flow

1. User submits text via frontend
2. Frontend calls backend API
3. Orchestrator creates a task
4. Client pays 0.005 USDC to Orchestrator
5. Orchestrator pays Worker 0.002 USDC
6. Worker executes the task
7. Orchestrator pays Validator 0.001 USDC
8. Validator checks the result
9. Orchestrator returns result to frontend
10. Frontend displays result, transactions, and balances

## Demo Usage

### Single Task
1. Open `http://localhost:3000`
2. Enter text in the input field
3. Select task type (Summarize, Keywords, or Rewrite)
4. Click "Run Task"
5. Watch the execution timeline and see transactions update in real-time

### Simulation Mode
1. In the Simulation panel, enter number of tasks (e.g., 50)
2. Click "Run Simulation"
3. Watch 100+ transactions be generated
4. See the economic summary with gross volume and margins

## Project Structure

```
arc-USDC1/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── baseAgent.js
│   │   │   ├── orchestratorAgent.js
│   │   │   ├── workerAgent.js
│   │   │   └── validatorAgent.js
│   │   ├── core/
│   │   │   ├── ledger.js
│   │   │   ├── paymentAdapter.js
│   │   │   ├── taskEngine.js
│   │   │   └── simulationEngine.js
│   │   ├── routes/
│   │   │   ├── tasks.routes.js
│   │   │   ├── balances.routes.js
│   │   │   ├── transactions.routes.js
│   │   │   └── simulation.routes.js
│   │   ├── data/
│   │   │   └── store.json
│   │   ├── app.js
│   │   ├── config.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskForm.vue
│   │   │   ├── TaskResult.vue
│   │   │   ├── WalletBalances.vue
│   │   │   ├── TransactionsTable.vue
│   │   │   ├── ExecutionTimeline.vue
│   │   │   └── SimulationPanel.vue
│   │   ├── views/
│   │   │   └── DashboardView.vue
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Circle Arc Quickstart (real USDC nano-payments)

Arc is Circle's stablecoin-native L1 where USDC is the gas asset. Sub-second
settlement and negligible fees make it ideal for A2A nano-payments.

### 1. Install

```bash
cd backend
npm install          # pulls ethers too
cp .env.example .env
```

### 2. Configure for Arc

In `backend/.env`:

```
WALLET_PROVIDER=onchain
ONCHAIN_NETWORK=arc-testnet    # or: arc, base-sepolia, base
PRICING_PROFILE=nano           # standard | nano | micro
ONCHAIN_DRY_RUN=true           # keep true until you're ready to broadcast
```

RPC / chainId / USDC address are taken from the network preset. Override any
of them with `ONCHAIN_RPC_URL` / `ONCHAIN_CHAIN_ID` / `ONCHAIN_USDC_ADDRESS`.

> ℹ️ The Arc testnet preset ships with placeholder values. Once Circle publishes
> the definitive RPC / chainId / USDC address, either update `NETWORK_PRESETS`
> in `backend/src/config.js` or set the three overrides in `.env`.

### 3. Generate agent wallets

```bash
npm run wallets:generate
```

This creates one EOA per logical agent (`client_wallet`, `orchestrator_wallet`,
`worker_wallet`, `validator_wallet`, the worker/validator variants, and each of
the specialist agents) and writes them to `backend/src/data/wallets.json`
(gitignored). The file contains real private keys — treat it as a secret.

### 4. Fund the wallets

Print the addresses:

```bash
npm run wallets:balances
```

Go to <https://faucet.circle.com> and fund at least `client_wallet`. On Arc,
that's the only wallet that needs funding because gas itself is paid in USDC
and every downstream transfer is paid from its caller's own wallet.

### 5. Go live

Once balances look good:

```
ONCHAIN_DRY_RUN=false
```

Restart the backend; every orchestrator step now signs with the calling
agent's EOA and broadcasts a real USDC transfer. Transactions are tagged
`onchain` in the ledger, including the `chainTxHash` for explorer lookup.

### Pricing profiles

| Profile  | Client pays | Worker | Validator | Orchestrator margin |
|----------|-------------|--------|-----------|---------------------|
| standard | 0.005 USDC  | 0.002  | 0.001     | 0.002               |
| nano     | 0.0005 USDC | 0.0002 | 0.0001    | 0.0002              |
| micro    | 0.00005 USDC | 0.00002 | 0.00001 | 0.00002             |

Dynamic pricing still applies on top (per-character cost × task-type multiplier),
clamped within the profile's `[min, max]` bounds.

### Wallet scripts

```bash
npm run wallets:generate        # create EOAs (refuses to overwrite; use --force)
npm run wallets:generate -- --force
npm run wallets:balances        # show gas + USDC per wallet on the selected network
```

---

## Phase 2 Features (implemented)

### Wallet provider abstraction
The payment layer now sits behind a `WalletProvider` interface (`backend/src/core/walletProvider.js`)
with two drivers:

- `simulated` (default) — in-memory ledger, fully offline
- `onchain` — EVM JSON-RPC adapter that mirrors ERC-20 USDC transfers back into the ledger

Switch providers via environment variables (dry-run by default, no funds moved unless fully configured):

```
WALLET_PROVIDER=onchain
ONCHAIN_RPC_URL=https://base-sepolia.public.blastapi.io
ONCHAIN_CHAIN_ID=84532
ONCHAIN_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
ONCHAIN_PRIVATE_KEY=0x...
ONCHAIN_DRY_RUN=false
```

`ethers` is an optional dependency and lazy-loaded — the server boots fine without it and
falls back to `dryRun`. Every on-chain event is still mirrored into the internal ledger so
the UI, metrics and history continue to work identically.

### Additional agents
New agents under `backend/src/agents/`:

- `TranslatorAgent` (task `translate`, dictionary-based EN→FR)
- `ClassifierAgent` (task `classify`, keyword-based topic tagging)
- `SentimentAgent`  (task `sentiment`, lexical positive/negative scoring)
- Worker variants: `default`, `fast`, `premium`
- Validator variants: `default`, `strict`

### Dynamic pricing
`backend/src/core/pricingEngine.js` computes per-task pricing:

- base price + per-char cost × task-type multiplier
- clamped to `[minClientPayment, maxClientPayment]`
- respects worker / validator quotes (agent base price) when supplied
- deterministically splits the client fee so that
  `clientPayment = workerPayment + validatorPayment + orchestratorMargin`

Toggle via `config.pricing.dynamic.enabled` (defaults to `true`).

### Agent selection by price / score
`backend/src/core/agentRegistry.js` keeps a pool of workers + validators with `basePrice`
and a running quality `score` updated via EMA after every task. Selection strategies:

- `price`        — cheapest capable agent
- `score`        — highest quality
- `score_price`  — weighted (default; tunable via `config.registry.scoreWeight/priceWeight`)

Strategy can be chosen per task (`POST /api/tasks { selectionStrategy }`) or per simulation.

### Advanced metrics
`GET /api/metrics?windowMs=<n>` returns:

- totals: tasks, completions, failures, success rate, avg duration, transactions, gross volume
- `revenueByWallet`
- `volumeByTaskType`
- wallet balances
- agent registry snapshot (score, completed, failed)
- settlement mode

Surface the data via the **Advanced Metrics** panel in the UI.

### New HTTP endpoints

| Method | Path                  | Purpose |
|--------|-----------------------|---------|
| GET    | `/api/agents`         | List workers + validators (price, score, stats) |
| POST   | `/api/agents/quote`   | Dry-run a task: returns selected agents + price split |
| GET    | `/api/metrics`        | Operational + economic KPIs, accepts `?windowMs=` |

## Phase 3 Features (implemented)

### Firebase Auth + role model
- Google OAuth login on the web client (`/login`).
- Backend verifies Firebase ID tokens via `firebase-admin` middleware (`backend/src/core/auth.js`).
- Roles: `user` (default) / `provider` (auto-promoted on agent registration) / `admin` (first login of any email in `ADMIN_EMAILS`).
- Every user gets an API key on first login for server-to-server calls (`x-api-key` header).

### Three dashboards
- `/user` — client view: tasks, spend, API key, payout wallet, "become a provider" upgrade.
- `/provider` — provider console: register agents (name/role/price/task types/apiEndpoint/payout wallet), stake, track earnings, see last slash reason.
- `/admin` — approve/reject/slash providers, manage user roles, business metrics (gross volume, client spend, orchestrator revenue, avg LTV, total stake, total slashed).

### Agent marketplace (registration + staking + slashing)
- `POST /api/providers` — any authenticated user submits an agent (auto-promoted to `provider` role).
- `POST /api/providers/:id/stake` — add USDC stake to your agent.
- `POST /api/providers/:id/approve` (admin) — moves agent into the selection pool. Backend rebuilds `agentRegistry` on the fly.
- `POST /api/providers/:id/slash` (admin, and automatic on failed validation) — deducts from stake. Providers dropping below `PROVIDER_MIN_STAKE` are moved to `slashed` and kicked from the pool.
- `GET /api/providers?status=approved` — public marketplace listing.

### Multi-client (quotas, budgets, API keys)
- Per-user daily task quota (`CLIENT_DAILY_QUOTA`, default 1000).
- Per-user monthly budget in USDC (`CLIENT_MONTHLY_BUDGET`, default 10).
- API key rotation from the user dashboard (`POST /api/auth/apikey/rotate`).
- `GET /api/tasks/mine` returns tasks owned by the caller.

### Business metrics dashboard
- `GET /api/admin/overview` — counts, role distribution, gross volume, orchestrator revenue, avg LTV per active user, total stake, total slashed.

### Real LLM worker backend (OpenAI Responses API, opt-in)
- Set `OPENAI_API_KEY` and workers route `summarize` / `keywords` / `rewrite` through `POST /v1/responses`.
- Model pinned to `gpt-5-nano-2025-08-07` by default (override with `OPENAI_MODEL`). Request shape mirrors the official SDK:
  ```js
  client.responses.create({
    model: 'gpt-5-nano-2025-08-07',
    instructions: 'Summarize the following text in 1-2 concise sentences.',
    input: userText,
    reasoning: { effort: 'low' }
  })
  ```
- Response is read via `output_text`, with a fallback that walks `output[].content[]` for `output_text` parts.
- Falls back to the local algorithm on any failure; the task response includes a `backend` field (`local` / `llm:<model>`) so you can trace where work actually ran.
- Tunables: `OPENAI_BASE_URL`, `OPENAI_MAX_OUTPUT_TOKENS`, `OPENAI_REASONING_EFFORT` (`minimal` / `low` / `medium` / `high`).

### New HTTP endpoints

| Method | Path                               | Scope    |
|--------|------------------------------------|----------|
| GET    | `/api/auth/me`                     | auth     |
| POST   | `/api/auth/apikey/rotate`          | auth     |
| POST   | `/api/auth/wallet`                 | auth     |
| POST   | `/api/auth/role/provider`          | auth     |
| GET    | `/api/providers?status=…`          | public   |
| GET    | `/api/providers/mine`              | auth     |
| POST   | `/api/providers`                   | auth     |
| PATCH  | `/api/providers/:id`               | owner/admin |
| POST   | `/api/providers/:id/stake`         | owner/admin |
| POST   | `/api/providers/:id/approve`       | admin    |
| POST   | `/api/providers/:id/reject`        | admin    |
| POST   | `/api/providers/:id/slash`         | admin    |
| GET    | `/api/admin/overview`              | admin    |
| GET    | `/api/admin/users`                 | admin    |
| POST   | `/api/admin/users/:uid/role`       | admin    |
| GET    | `/api/tasks/mine`                  | auth     |

### Bootstrap

Backend:
```bash
cd backend
npm install
cp .env.example .env
# Fill: FIREBASE_PROJECT_ID, ADMIN_EMAILS=<your email>, FIREBASE_SERVICE_ACCOUNT=firebase-service-account.json
# Place the Firebase Admin service account JSON next to package.json (gitignored).
npm start
```

Frontend:
```bash
cd frontend
npm install
cp .env.example .env
# Fill the VITE_FIREBASE_* keys from Firebase console → Web app.
npm run dev
```

First login with the email listed in `ADMIN_EMAILS` → you become `admin` automatically.

## Future Enhancements

## Development Notes

- The payment adapter delegates to a `WalletProvider`; swapping settlement backends is a one-liner
- Dynamic pricing is always ledger-invariant: what the client pays equals the sum of payouts
- Agent scores converge over time via exponential moving average on validator feedback
- Simulation mode rotates through all task types and strategies to stress-test selection

## License

MIT
