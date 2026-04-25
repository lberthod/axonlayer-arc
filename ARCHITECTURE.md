# Axonlayer- Architecture

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

## On-Chain Wallet Management

### Treasury Wallet

**Address:** `0xA89044f1d22e8CD292B3Db092C8De28eB1728d74`

**Purpose:** Central orchestrator wallet that:
- Receives mission funding from user wallets
- Distributes USDC to agent workers & validators
- Retains platform margin
- Refunds unused budget to users

**Implementation:**
```javascript
// backend/src/core/treasuryStore.js
class TreasuryStore {
  constructor() {
    this.address = '0xA89044f1d22e8CD292B3Db092C8De28eB1728d74'; // Real blockchain address
    this.balance = 0;      // Current USDC balance
    this.reserved = 0;     // Allocated to active missions
    this.history = [];     // All transactions
  }

  async addFunds(amount, reason, taskId) {
    // User wallet → Treasury (mission funding)
  }

  async payAgent(amount, reason, taskId) {
    // Treasury → Agent wallet (worker/validator payment)
  }

  async refund(amount, reason, taskId) {
    // Treasury → User wallet (unused budget)
  }
}
```

**Persistence:** `backend/src/data/treasury.json` — Contains address, balance, reserved funds, and transaction history.

### User Wallets

**Generation:**
```javascript
// backend/src/routes/auth.routes.js
router.post('/wallet/create', async (req, res) => {
  const wallet = ArcWalletService.generateWallet();
  // Returns: { address, privateKey, mnemonic, chain, token }
  
  // Save to user profile
  user = await userStore.setWallet(userUid, wallet);
  
  // Register for on-chain signing
  const walletManager = (await import('../core/walletManager.js')).default;
  walletManager.registerUserWallet(userUid, wallet);
  
  res.json({ wallet, user });
});
```

**Storage:**
- **User profile** (`userStore.users[uid].wallet`) — Stores address, privateKey, mnemonic
- **On-chain signer** (`walletManager.wallets[user_{uid}]`) — In-memory signer for transaction signing

**Balance Tracking:**
```javascript
// Real on-chain balance from Arc blockchain
const onChainBalance = await arcBlockchain.getBalance(user.wallet.address);
user.balance = onChainBalance;
```

Updated every 30 seconds or when user checks balance.

### Transaction Flow

**Mission Funding:**
```
User submits mission with budget:
  ↓
User wallet checks balance (Arc blockchain)
  ↓
walletManager loads user signer (private key → signer)
  ↓
walletProvider.transfer() called:
  - From: user wallet (signer)
  - To: Treasury address (0xA89044f...)
  - Amount: Budget USDC
  ↓
Transaction sent to Arc blockchain (JSON-RPC)
  ↓
On-chain transfer confirmed (< 1 second)
  ↓
Treasury balance updated in treasuryStore

```

**Agent Payment:**
```
After agent executes task:
  ↓
treasuryStore.payAgent() called:
  - Deduct amount from treasury.balance
  - Agent receives: (amount - fee)
  - Platform keeps: fee
  ↓
walletProvider.transfer() called:
  - From: Treasury signer
  - To: Agent wallet address
  - Amount: Agent portion
  ↓
On-chain transfer confirmed
```

**Refund:**
```
After task completes:
  ↓
treasuryStore.refund() called:
  - Calculate unused budget
  - Deduct from treasury.balance
  ↓
walletProvider.transfer() called:
  - From: Treasury signer
  - To: User wallet address
  - Amount: Unused USDC
  ↓
On-chain transfer confirmed
  ↓
User sees refund in wallet balance
```

### WalletManager

**Purpose:** Manages on-chain wallet signers for transaction signing

```javascript
// backend/src/core/walletManager.js
class WalletManager {
  async registerUserWallet(userId, walletData) {
    // Stores wallet with ID: user_{userId}
    // Enables signing of transactions on behalf of user
  }

  async getSigner(walletId) {
    // Returns ethers.Wallet signer for transaction signing
    // Uses private key to sign USDC transfers
  }

  has(walletId) {
    // Check if wallet is registered
  }
}
```

**Dynamic Registration:**
```javascript
// backend/src/core/taskEngine.js - fundMission()
const walletManager = (await import('./walletManager.js')).default;
await walletManager.load();

// If wallet not in memory, register it (after server restart)
if (!walletManager.has(`user_${userUid}`)) {
  walletManager.registerUserWallet(userUid, user.wallet);
}

// Now wallet can sign transactions
const txResult = await walletProvider.transfer(
  `user_${userUid}`,      // Signer
  treasuryAddr,            // Recipient
  amount,                  // USDC amount
  ...
);
```

### ArcBlockchainService

**Purpose:** Interface to Arc blockchain via JSON-RPC

```javascript
// backend/src/core/arcBlockchainService.js
class ArcBlockchainService {
  constructor() {
    this.rpcUrl = 'https://rpc.testnet.arc.network';
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      USDC_ABI,
      this.provider
    );
  }

  async getBalance(address) {
    // Fetch on-chain USDC balance
    return await this.usdcContract.balanceOf(address);
  }

  async transfer(from, to, amount) {
    // Execute USDC transfer (via walletProvider)
  }
}
```

**Pre-generated Wallets** (`backend/src/data/wallets.json`):
- `orchestrator_wallet`: `0xA89044f1d22e8CD292B3Db092C8De28eB1728d74` (treasury)
- `worker_wallet`: `0xe6D508d289061B67224A5c14632a92d8C8d6d914`
- `validator_wallet`: `0x3862ebD4fd40bCc9f6B9f6b14c5C5AAd21357627`
- Plus specialized variants for different worker types

---

## Key Technologies

- **Blockchain**: Circle Arc (testnet & mainnet)
- **Token**: USDC (native gas, 6 decimals)
- **Web3**: ethers.js v6
- **Auth**: Firebase Admin
- **Frontend**: Vue 3, Tailwind CSS
- **Runtime**: Node.js ≥20.12.0
- **Wallet Generation**: ArcWalletService (real private keys)
