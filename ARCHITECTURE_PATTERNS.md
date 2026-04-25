# 🏗️ Patterns architecturaux & Dépendances

## 1️⃣ Patterns utilisés dans Axonlayer

### 🎭 SAGA Pattern (Two-Phase Commit)
**Fichier**: `backend/src/core/paymentSaga.js`

Garantit l'atomicité des transactions distribuées :

```
┌─────────────────────────────────────────┐
│ SAGA Pattern - Payment Coordination      │
├─────────────────────────────────────────┤
│                                         │
│  Phase 1: PREPARE                       │
│  ├─ Check user balance                  │
│  ├─ Reserve funds                       │
│  └─ Validate margins                    │
│           │                             │
│           ▼                             │
│  Phase 2: EXECUTE                       │
│  ├─ Call agent.work()                   │
│  ├─ Record work in ledger               │
│  └─ Get result                          │
│           │                             │
│           ▼                             │
│  Phase 3: COMMIT                        │
│  ├─ Create on-chain USDC transfers      │
│  ├─ Update ledger balances              │
│  └─ Mark task completed                 │
│           │                             │
│           ▼                             │
│  Success: All or Nothing                │
│                                         │
│  Failure Path: ROLLBACK                 │
│  ├─ Release reservations                │
│  ├─ Restore balances                    │
│  └─ Mark task failed                    │
│                                         │
└─────────────────────────────────────────┘
```

**Avantages** :
- ✅ Transactions atomiques (succeed or fail together)
- ✅ Pas de fonds perdus
- ✅ Ledger toujours consistent
- ✅ Rollback automatique en cas d'erreur

---

### 🎯 Strategy Pattern (Orchestration)
**Fichier**: `backend/src/core/strategyDefinitions.js`

Trois stratégies de sélection d'agents :

```javascript
strategies = {
  'cost-first': {
    name: 'Cost-first',
    description: 'Minimize user cost',
    weights: {
      cost: 0.8,
      quality: 0.2,
      speed: 0.0
    }
  },
  
  'quality-first': {
    name: 'Quality-first',
    description: 'Maximize success rate',
    weights: {
      cost: 0.0,
      quality: 0.8,
      speed: 0.2
    }
  },
  
  'balanced': {
    name: 'Balanced',
    description: 'Optimize all factors',
    weights: {
      cost: 0.33,
      quality: 0.33,
      speed: 0.34
    }
  }
};
```

**Utilisation** :
```javascript
await orchestrator.executeTask(input, taskType, {
  selectionStrategy: 'balanced'  // Plug-and-play
});
```

---

### 💾 Repository Pattern (Persistence)
**Fichiers**: `ledger.js`, `taskEngine.js`

Abstraction pour accès données persistantes :

```
┌────────────────────────────┐
│ Application (Controllers)  │
├────────────────────────────┤
│        ▲                    │
│        │                    │
│   ledger.getBalance()       │
│   ledger.transfer()         │
│   taskEngine.createTask()   │
│                             │
├─────────────┬──────────────┤
│  Repository │  Repository  │
│  (Ledger)   │ (TaskEngine) │
├─────────────┴──────────────┤
│  File System (JSON)        │
│  ├─ store.json             │
│  └─ tasks.json             │
└────────────────────────────┘
```

**Atomic writes** :
```javascript
write(data) {
  const tmp = `${path}.${pid}.${now}.tmp`;
  fs.writeFile(tmp, data);      // Write to temp
  fs.rename(tmp, path);         // Atomic swap
}
```

---

### 🔐 Middleware Pattern (Express)
**Fichier**: `app.js`

Stack de middlewares pour la sécurité et le logging :

```javascript
app
  .use(helmet())                    // Security headers
  .use(httpLogger())                // Request logging
  .use(httpMetricsMiddleware())    // Prometheus metrics
  .use(cors({...}))                // CORS allowlist
  .use(express.json())             // JSON parser
  .use(authMiddleware())           // Firebase auth
  .use(idempotencyMiddleware())    // Idempotency keys
  .use(globalLimiter)              // Global rate limit
  .use(routes...)                  // API routes
  .use(errorHandler)               // Error handling
;
```

---

### 🏪 Store Pattern (Frontend)
**Fichiers**: `authStore.js`, `walletStore.js`

Réactivité Vue avec Pinia-like pattern :

```javascript
// authStore.js
const state = reactive({
  firebaseUser: null,
  user: null,
  role: 'anonymous'
});

// Listeners for reactive updates
const listeners = new Set();
function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function becomeProvider() {
  api.auth.becomeProvider();
  await refreshBackendUser();  // Fetch new state
  notifyListeners();           // Notify subscribers
}
```

---

### 🎨 Factory Pattern (Wallet Management)
**Fichier**: `backend/src/core/walletProvider.js`

Crée des portefeuilles selon le mode :

```javascript
class WalletProvider {
  static async create(mode) {
    switch (mode) {
      case 'onchain':
        return new OnChainWalletProvider();
      case 'simulator':
        return new SimulatorWalletProvider();
      default:
        throw new Error(`Unknown wallet provider: ${mode}`);
    }
  }
}

// Usage
const wallet = await WalletProvider.create('onchain');
await wallet.transfer(from, to, amount);
```

---

## 2️⃣ Flux de dépendances

### Backend Dependencies Map

```
server.js (Entry point)
  │
  ├─→ app.js (Express setup)
  │    ├─→ authMiddleware
  │    ├─→ cors / helmet
  │    ├─→ routes/
  │    │    ├─→ tasks.routes
  │    │    ├─→ simulation.routes
  │    │    ├─→ balances.routes
  │    │    └─→ agents.routes
  │    └─→ errorHandler
  │
  ├─→ ledger (In-memory + JSON)
  │    └─→ store.json (persistent)
  │
  ├─→ taskEngine (Task history)
  │    └─→ tasks.json (persistent)
  │
  ├─→ paymentAdapter (Payment routing)
  │    └─→ walletProvider
  │         └─→ arcBlockchainService (ethers.js)
  │
  ├─→ v2OrchestratorAgent (Main orchestrator)
  │    ├─→ capabilityMatcher
  │    ├─→ scoringSchema
  │    ├─→ paymentSaga
  │    ├─→ ledger
  │    └─→ taskEngine
  │
  ├─→ simulationEngine (Batch testing)
  │    └─→ v2OrchestratorAgent
  │
  ├─→ agentRegistry (Agent tracking)
  │    └─→ providerStore
  │
  └─→ config.js (Configuration)
```

### Frontend Dependencies Map

```
main.js (Entry point)
  │
  ├─→ App.vue (Root component)
  │    ├─→ AppHeader.vue
  │    ├─→ PublicHeader.vue
  │    ├─→ router-view
  │    └─→ ToastHost.vue
  │
  ├─→ router.js (Vue Router)
  │    └─→ views/
  │         ├─→ Home.vue
  │         ├─→ Dashboard.vue
  │         └─→ UserProfile.vue
  │
  ├─→ stores/
  │    ├─→ authStore.js
  │    │    └─→ firebase.js (Firebase Auth)
  │    │         └─→ firebaseAuth
  │    │
  │    ├─→ walletStore.js
  │    │    └─→ localStorage
  │    │
  │    ├─→ appConfigStore.js
  │    └─→ toastStore.js
  │
  ├─→ services/
  │    ├─→ api.js (HTTP client)
  │    │    ├─→ apiCallWithAuth()
  │    │    │    └─→ getIdToken() (Firebase)
  │    │    └─→ Endpoints (tasks, auth, etc.)
  │    │
  │    └─→ firebase.js (Firebase SDK)
  │         └─→ firebaseConfig
  │
  └─→ components/
       ├─→ MissionForm.vue
       │    └─→ api.tasks.create()
       │
       ├─→ MissionResult.vue
       │    └─→ Shows task result
       │
       ├─→ SimulationPanel.vue
       │    └─→ api.simulation.run()
       │
       ├─→ UserProfile.vue
       │    └─→ authStore / walletStore
       │
       └─→ WalletBalances.vue
            └─→ api.balances.getAll()
```

---

## 3️⃣ Patterns de communication

### Backend ↔ Frontend

```
Frontend                          Backend
────────────────────────────────────────────

User clicks "Submit Task"
            │
            ├─→ POST /api/tasks (JSON)
            │   {
            │     "input": "...",
            │     "taskType": "summarize",
            │     "budget": 0.0005,
            │     "strategy": "balanced"
            │   }
            │
            ├─→ Header: "Authorization: Bearer {JWT}"
            │
            ▼
         Express Router
            │
            ├─→ authMiddleware() validates JWT
            ├─→ validateTaskInput() (Zod schema)
            ├─→ v2OrchestratorAgent.executeTask()
            │     ├─→ SAGA phase 1 (Prepare)
            │     ├─→ SAGA phase 2 (Execute)
            │     └─→ SAGA phase 3 (Commit)
            │
            ├─→ Response: {
            │     "id": "task_...",
            │     "status": "completed",
            │     "result": "...",
            │     "transactions": [...]
            │   }
            │
            ◀─────────── 200 OK (JSON)
            │
Display result
```

### Streaming (SSE - Server-Sent Events)

**Endpoint**: `POST /api/simulate/stream`

```
Frontend                          Backend
────────────────────────────────────────────

Start simulation (50 tasks)
            │
            ├─→ POST /api/simulate/stream
            │
            ▼
         Establish SSE connection
            │
            ├─→ for i = 0 to 50:
            │   ├─→ executeTask(i)
            │   ├─→ res.write(`data: ${JSON.stringify(progress)}\n\n`)
            │   └─→ Frontend receives live update
            │
            ├─→ Final summary:
            │   ├─→ res.write(`data: ${JSON.stringify(summary)}\n\n`)
            │   └─→ res.end()
            │
Display real-time progress
```

---

## 4️⃣ State Management

### Backend State

```
┌─────────────────────────────────────┐
│ In-Memory State                     │
├─────────────────────────────────────┤
│                                     │
│ ledger.transactions (Array)         │
│   └─→ List of all USDC transfers    │
│                                     │
│ ledger.balances (Object)            │
│   └─→ { walletId: amount, ... }     │
│                                     │
│ taskEngine.tasks (Map)              │
│   └─→ task_id → Task object         │
│                                     │
│ agentRegistry.agents (Array)        │
│   └─→ Agent metadata + scores       │
│                                     │
└─────────────────────────────────────┘
         ▲         │
         │         │
    Load on     Persist
    startup    continuously
         │         ▼
┌─────────────────────────────────────┐
│ Persistent Disk State               │
├─────────────────────────────────────┤
│                                     │
│ store.json                          │
│   ├─ transactions[]                 │
│   └─ balances{}                     │
│                                     │
│ tasks.json                          │
│   └─ tasks[]                        │
│                                     │
└─────────────────────────────────────┘
```

### Frontend State

```
┌──────────────────────────────┐
│ Component State (reactive)   │
├──────────────────────────────┤
│                              │
│ App.vue                      │
│   └─→ isMarketing            │
│                              │
│ MissionForm.vue              │
│   ├─→ input                  │
│   ├─→ taskType               │
│   ├─→ budget                 │
│   └─→ strategy               │
│                              │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Store State (reactive)       │
├──────────────────────────────┤
│                              │
│ authStore                    │
│   ├─→ firebaseUser           │
│   ├─→ user (from /api/auth/me)
│   └─→ role                   │
│                              │
│ walletStore                  │
│   ├─→ wallet                 │
│   ├─→ balance                │
│   └─→ setupComplete          │
│                              │
│ toastStore                   │
│   └─→ messages[]             │
│                              │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Browser Storage              │
├──────────────────────────────┤
│                              │
│ localStorage                 │
│   ├─→ arc_wallet_setup       │
│   └─→ arc_wallet_balance     │
│                              │
│ sessionStorage               │
│   └─→ Temp data              │
│                              │
└──────────────────────────────┘
```

---

## 5️⃣ Error Handling

### Backend Error Flow

```
Request arrives
    │
    ▼
Express Router
    │
    ├─→ Try block
    │    ├─→ validateInput() fails?
    │    │    └─→ Throw ZodError
    │    │
    │    ├─→ executeTask() fails?
    │    │    ├─→ Insufficient balance?
    │    │    │    └─→ Throw BalanceError
    │    │    │
    │    │    ├─→ SAGA commit failed?
    │    │    │    └─→ Rollback + Throw
    │    │    │
    │    │    └─→ Agent unreachable?
    │    │         └─→ Throw TimeoutError
    │    │
    │    └─→ Success: Return 200 JSON
    │
    ├─→ Catch block
    │    ├─→ Check error type
    │    │
    │    ├─→ ZodError → 400 Bad Request
    │    ├─→ BalanceError → 402 Payment Required
    │    ├─→ AuthError → 401 Unauthorized
    │    ├─→ TimeoutError → 504 Gateway Timeout
    │    └─→ Generic → 500 Internal Server Error
    │
    └─→ Finally
         └─→ Log error + Metrics
```

### Frontend Error Handling

```
api.tasks.create(data)
    │
    ├─→ Catch (error)
    │    │
    │    ├─→ error.status === 402?
    │    │    └─→ toastStore.error("Insufficient balance")
    │    │
    │    ├─→ error.status === 401?
    │    │    └─→ authStore.logout()
    │    │
    │    ├─→ Network error?
    │    │    └─→ toastStore.error("Network error")
    │    │
    │    └─→ Unknown error?
    │         └─→ toastStore.error(error.message)
    │
    └─→ Finally
         └─→ isLoading = false
```

---

## 6️⃣ Security Patterns

### Authentication Pipeline

```
Frontend HTTP Request
    │
    │ Header: "Authorization: Bearer {JWT}"
    │
    ▼
Backend authMiddleware()
    │
    ├─→ Extract token from header
    │
    ├─→ Validate Firebase signature
    │    └─→ Invalid? → 401 Unauthorized
    │
    ├─→ Decode JWT claims
    │    └─→ Extract uid + email
    │
    ├─→ Create/update User in db
    │
    └─→ req.user = user object
         req.role = 'user' | 'provider'
         req.uid = Firebase UID
         
    ▼
Route handler can now access req.user
```

### Encryption Pipeline (Private Keys)

```
Generate wallet
    │
    ├─→ ethers.Wallet.createRandom()
    │    └─→ privateKey (plaintext)
    │
    ├─→ secretManager.encrypt(privateKey, password)
    │    ├─→ Generate random salt
    │    ├─→ Derive key from password + salt (PBKDF2)
    │    ├─→ AES-256-GCM encrypt
    │    │    ├─→ iv (initialization vector)
    │    │    ├─→ ciphertext
    │    │    └─→ authTag (verify integrity)
    │    │
    │    └─→ Return: {
    │         encryptedPrivateKey,
    │         salt,
    │         iv,
    │         authTag
    │       }
    │
    └─→ Store encrypted in database
    
Store encrypted key in database
    │
    (Later, when signing transaction)
    │
    ├─→ secretManager.decrypt(encrypted, password)
    │    ├─→ Verify authTag (prevent tampering)
    │    ├─→ AES-256-GCM decrypt
    │    └─→ Return plaintext privateKey
    │
    ├─→ ethers.Wallet.fromPrivateKey(key)
    │
    ├─→ Sign transaction
    │
    └─→ Private key immediately discarded from memory
```

---

## 7️⃣ Rate Limiting Strategy

### Global vs Specific Limits

```
Express Middleware Stack
    │
    ├─→ globalLimiter
    │    ├─→ 100 requests / 15 minutes
    │    ├─→ Per IP address
    │    └─→ Applied to ALL routes
    │
    ├─→ authLimiter (stricter)
    │    ├─→ 5 attempts / 15 minutes
    │    └─→ Applied to: POST /api/auth/*
    │
    ├─→ tasksLimiter
    │    ├─→ 20 requests / 15 minutes
    │    └─→ Applied to: POST /api/tasks
    │
    └─→ simulationLimiter
         ├─→ 2 requests / 15 minutes (batch can be expensive)
         └─→ Applied to: POST /api/simulate
```

---

## 📊 Summary Table

| Pattern | Where | Why |
|---------|-------|-----|
| **SAGA** | paymentSaga.js | Atomic distributed transactions |
| **Strategy** | strategyDefinitions.js | Pluggable orchestration strategies |
| **Repository** | ledger.js, taskEngine.js | Abstraction for persistence |
| **Factory** | walletProvider.js | Create wallet providers dynamically |
| **Middleware** | app.js | Security + logging pipeline |
| **Store** | authStore.js, walletStore.js | Reactive state management |
| **Error Handler** | errorHandler middleware | Centralized error processing |
| **Rate Limiter** | rateLimit.js | Prevent abuse |
| **Encryption** | secretManager.js | Secure key storage |

---

Cet architecture est bien pensée pour garantir **sécurité**, **atomicité** et **scalabilité**.
