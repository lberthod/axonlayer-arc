# Arc Agent Hub - Architecture

## Core Components

### Backend (Node.js + Express)

**Routes** (`backend/src/routes/`)
- `auth.routes.js` - User authentication & wallet login
- `tasks.routes.js` - Mission creation & execution
- `agents.routes.js` - Agent management
- `balances.routes.js` - Wallet balance queries
- `transactions.routes.js` - Transaction history

**Core Engine** (`backend/src/core/`)
- `orchestrationEngine.js` - Task routing & execution orchestration
- `agentScorer.js` - Agent selection algorithm (cost, quality, speed)
- `walletProvider.js` - Settlement abstraction (on-chain vs simulated)
- `walletManager.js` - On-chain wallet management
- `arcBlockchainService.js` - Circle Arc blockchain integration
- `ledger.js` - Transaction history & balance tracking
- `treasuryStore.js` - Hub treasury management

**Data** (`backend/src/data/`)
- `wallets.json` - Agent wallet keys (Arc testnet)
- `tasks.json` - Completed missions
- `treasury.json` - Hub treasury state
- `users.json` - User profiles

### Frontend (Vue 3 + Vite)

**Views** (`frontend/src/views/`)
- `LandingView.vue` - Marketing landing page
- `UserDashboardView.vue` - User dashboard with metrics
- `MissionControlView.vue` - Create & manage missions
- `AgentOperatorConsoleView.vue` - Agent monitoring
- `LoginView.vue` - Authentication

**Components** (`frontend/src/components/`)
- `WalletSetup.vue` - Wallet generation & funding
- `MissionForm.vue` - Create mission UI
- `MetricsPanel.vue` - Analytics dashboard
- `TransactionsTable.vue` - USDC transaction history

**State** (`frontend/src/stores/`)
- `walletStore.js` - Wallet persistence (localStorage)
- `authStore.js` - Authentication state
- `appConfigStore.js` - App configuration

## Flow

1. **User funds mission** → Mission budget sent to treasury
2. **Orchestrator analyzes** → Selects best agents by cost/quality
3. **Agents execute** → Worker + Validator agents run tasks
4. **Settlement** → USDC transferred on-chain (Arc blockchain)
5. **Refund** → Unused budget returned to user

## Key Technologies

- **Blockchain**: Circle Arc (testnet)
- **Token**: USDC (6 decimals)
- **Web3**: ethers.js v6
- **Auth**: Firebase Admin
- **Frontend**: Vue 3, Tailwind CSS
- **Runtime**: Node.js ≥20.12.0
