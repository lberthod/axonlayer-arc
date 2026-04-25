# 📋 Analyse Complète - Axonlayer (arc-USDC1)

## 🎯 Vue d'ensemble du projet

**Axonlayer** est un système d'orchestration économique pour agents IA autonomes. C'est une plateforme qui permet:

1. **Aux utilisateurs** : De financer des "missions" (tâches à exécuter)
2. **Au système** : D'orchestrer automatiquement les meilleurs agents
3. **Aux agents** : De gagner des USDC réels via des paiements on-chain

**Stack technique** :
- **Blockchain** : Circle Arc (USDC comme gaz natif)
- **Backend** : Node.js + Express + Ledger en mémoire
- **Frontend** : Vue 3 + Vite + TailwindCSS + Firebase Auth
- **Paiements** : Règlement on-chain avec ethers.js + AES-256-GCM pour clés privées

---

## 🏗️ Architecture générale

```
┌─────────────────────────────┐
│      FRONTEND (Vue 3)       │
│  - Dashboard utilisateur    │
│  - Portefeuilles            │
│  - Formulaires de mission   │
└────────────┬────────────────┘
             │ (HTTP/Firebase Auth)
┌────────────▼────────────────┐
│    BACKEND (Express)        │
│  - API REST                 │
│  - Orchestration            │
│  - Ledger + Transactions    │
└────────────┬────────────────┘
             │ (ethers.js)
┌────────────▼────────────────┐
│   Circle Arc Blockchain     │
│  - USDC Transfers           │
│  - Paiements atomiques      │
└─────────────────────────────┘
```

---

## 🔙 BACKEND - Architecture détaillée

### 📂 Structure des fichiers

```
backend/src/
├── server.js                    # Point d'entrée, démarrage serveur
├── app.js                       # Configuration Express
├── config.js                    # Variables de configuration
├── core/
│   ├── ledger.js               # Livre de comptes (soldes + transactions)
│   ├── taskEngine.js           # Gestion des tâches (stockage persistent)
│   ├── paymentAdapter.js       # Adaptateur paiements (routing)
│   ├── arcBlockchainService.js # Interface avec Arc blockchain
│   ├── v2OrchestratorAgent.js  # Moteur d'orchestration principal
│   ├── simulationEngine.js     # Moteur de simulation (test batch)
│   ├── agentRegistry.js        # Registre des agents
│   ├── capabilityMatcher.js    # Matching agent ↔ tâche
│   ├── scoringSchema.js        # Scoring (qualité/coût)
│   ├── strategyDefinitions.js  # Stratégies de sélection
│   ├── auth.js                 # Authentification Firebase
│   ├── secretManager.js        # Gestion clés privées
│   ├── logger.js               # Logging structuré
│   ├── rateLimit.js            # Rate limiting
│   ├── health.js               # Health checks
│   └── ...
├── routes/
│   ├── tasks.routes.js         # POST /api/tasks (créer tâche)
│   ├── simulation.routes.js    # POST /api/simulate (batch)
│   ├── auth.routes.js          # Auth endpoints
│   ├── balances.routes.js      # GET /api/balances
│   ├── agents.routes.js        # GET /api/agents
│   └── ...
└── data/
    ├── store.json              # Ledger persistent
    ├── tasks.json              # Historique tâches
    └── ...
```

### 🔑 Composants clés du backend

#### 1. **Ledger (store.json)**
File: `backend/src/core/ledger.js`

```javascript
// Structure:
{
  "transactions": [
    {
      "id": "tx_...",
      "from": "wallet1",
      "to": "wallet2",
      "amount": 0.0002,
      "taskId": "task_...",
      "timestamp": "2024-04-26T...",
      "status": "completed"
    }
  ],
  "balances": {
    "treasury": 1.0,
    "agent_wallet_1": 0.0005,
    "user_wallet_1": 0.9995
  }
}
```

**Caractéristiques** :
- ✅ Écritures atomiques (temp file + rename)
- ✅ Sérialisation des opérations (pas de race conditions)
- ✅ Persistance sur disque
- ✅ Normalisation des montants (6 décimales max)

#### 2. **TaskEngine (tasks.json)**
File: `backend/src/core/taskEngine.js`

Gère l'historique complet des tâches :

```javascript
{
  "id": "task_abc123",
  "input": "Summarize this document",
  "taskType": "summarize",
  "status": "completed", // pending | completed | failed
  "createdAt": "2024-04-26T...",
  "updatedAt": "2024-04-26T...",
  "result": "...",
  "validation": null,
  "transactions": ["tx_1", "tx_2"],
  "requesterUid": "user123",
  "providerIds": ["agent_1", "agent_2"]
}
```

#### 3. **V2OrchestratorAgent (Orchestration)**
File: `backend/src/core/v2OrchestratorAgent.js`

**Flux d'exécution d'une mission** :

```
1. User Submit Task
   ↓
2. Capability Matching
   - Liste les agents capables
   - Filtre par stratégie
   ↓
3. Scoring
   - Coût (cost-first)
   - Qualité (quality-first)
   - Combiné (balanced)
   ↓
4. Agent Selection
   - Choisit le meilleur match
   ↓
5. Two-Phase Commit (SAGA pattern)
   a) PREPARE: Réserve les fonds
   b) EXECUTE: Lance le travail
   c) COMMIT: Valide les paiements
   ↓
6. On-Chain Settlement
   - Envoie USDC via Arc blockchain
   ↓
7. Task Complete
```

#### 4. **Simulation Engine**
File: `backend/src/core/simulationEngine.js`

Lance des **batches de tâches** pour tester le système :

```javascript
POST /api/simulate
{
  "count": 50,
  "taskType": "summarize",
  "selectionStrategy": "balanced"
}
```

**Résultat** :
```json
{
  "executed": 50,
  "failed": 0,
  "summary": {
    "grossVolume": 0.025,
    "workerRevenue": 0.01,
    "validatorRevenue": 0.005,
    "orchestratorMargin": 0.01
  },
  "perTaskType": {
    "summarize": { "count": 50, "volume": 0.025 }
  },
  "missions": [...]
}
```

#### 5. **Payment Saga (Two-Phase Commit)**
File: `backend/src/core/paymentSaga.js`

Garantit l'atomicité des paiements :

```
Phase 1 (Prepare):
├─ Valide les fonds utilisateur
├─ Réserve budget utilisateur
└─ Calcule les marges

Phase 2 (Execute):
├─ Lance le travail agent
└─ Enregistre en ledger

Phase 3 (Commit):
├─ Applique les paiements on-chain
├─ Crée les transactions USDC
└─ Met à jour les soldes

Rollback si échecà n'importe quelle phase
```

### 🔐 Authentification & Sécurité

#### Firebase Auth
File: `backend/src/core/auth.js`

```javascript
// Middleware qui extrait le JWT Firebase
app.use(authMiddleware());
// Crée ou met à jour l'utilisateur en base
```

#### Chiffrement des clés privées
File: `backend/src/core/secretManager.js`

```javascript
// AES-256-GCM - jamais plaintext
encryptPrivateKey(key, password) // Stockage sûr
decryptPrivateKey(encryptedKey)  // Déchiffrement à la demande
```

### 📊 Routes principales

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/tasks` | Créer et exécuter une tâche |
| `GET` | `/api/tasks/:id` | Détails d'une tâche |
| `POST` | `/api/simulate` | Lancer un batch de simulations |
| `POST` | `/api/simulate/stream` | Stream SSE du batch en temps réel |
| `GET` | `/api/balances` | Tous les soldes de portefeuilles |
| `GET` | `/api/agents` | Liste des agents avec stats |
| `POST` | `/api/agents/quote` | Devis pour une tâche |
| `GET` | `/api/metrics` | Métriques opérationnelles |
| `GET` | `/api/config` | Configuration serveur |

---

## 🎨 FRONTEND - Architecture détaillée

### 📂 Structure des fichiers

```
frontend/src/
├── App.vue                      # Composant racine
├── main.js                      # Point d'entrée
├── router.js                    # Vue Router config
├── style.css                    # TailwindCSS
├── services/
│   ├── api.js                   # Client API (fetch)
│   └── firebase.js              # Firebase Auth
├── stores/
│   ├── authStore.js             # État utilisateur/auth
│   ├── walletStore.js           # État portefeuille
│   ├── appConfigStore.js        # Configuration app
│   └── toastStore.js            # Notifications
├── components/
│   ├── AppHeader.vue            # Header connecté
│   ├── PublicHeader.vue         # Header public
│   ├── MissionForm.vue          # Formulaire tâche
│   ├── MissionResult.vue        # Résultat tâche
│   ├── MissionWallet.vue        # Portefeuille utilisateur
│   ├── UserProfile.vue          # Profil utilisateur
│   ├── WalletBalances.vue       # Affichage soldes
│   ├── TransactionsTable.vue    # Historique transactions
│   ├── SimulationPanel.vue      # Panel simulation
│   ├── MetricsCharts.vue        # Graphiques
│   ├── BatchProgressOverlay.vue # Progress bar batch
│   ├── ArcProof.vue             # Preuve on-chain
│   └── ToastHost.vue            # Notifications
└── views/
    ├── Home.vue                 # Page d'accueil
    ├── Dashboard.vue            # Dashboard principal
    └── ...
```

### 🔑 Composants clés du frontend

#### 1. **Service API (api.js)**

Client HTTP avec authentification Firebase :

```javascript
// Cache pour éviter rate limiting
const getMeCache = {
  data: null,
  timestamp: null,
  ttl: 30000  // 30 secondes
};

// Endpoints principaux
api.tasks.create(data)           // POST /api/tasks
api.tasks.list()                 // GET /api/tasks
api.auth.getMe()                 // GET /api/auth/me (avec cache)
api.simulation.run(count)        // POST /api/simulate
api.balances.getAll()            // GET /api/balances
```

#### 2. **Store d'authentification (authStore.js)**

Gère l'état d'authentification :

```javascript
const state = {
  initialized: false,
  loading: true,
  firebaseUser: null,        // Utilisateur Firebase
  user: null,                // Données backend (/api/auth/me)
  role: 'anonymous',         // 'user' ou 'provider'
  error: null
};

// Fonctions principales
login()                       // Google SSO
becomeProvider()             // Passer provider
rotateApiKey()               // Renouveler clé API
```

#### 3. **Store de portefeuille (walletStore.js)**

Gère l'état du portefeuille :

```javascript
const state = {
  user: null,
  wallet: null,              // Adresse USDC
  balance: 0,                // Solde USDC
  lastUpdated: null,
  isLoading: false,
  setupComplete: false
};

// Sync avec localStorage et API
updateFromUser(user)         // Met à jour depuis API
updateBalance(balance)       // Maj solde depuis blockchain
subscribe(callback)          // Abonnement aux changements
```

#### 4. **Composant MissionForm**

Interface de création de tâche :

```vue
<template>
  <form @submit.prevent="submitTask">
    <textarea v-model="input" placeholder="Tâche à exécuter" />
    <select v-model="taskType">
      <option value="summarize">Résumer</option>
      <option value="rewrite">Réécrire</option>
      <option value="translate">Traduire</option>
    </select>
    <input v-model="budget" type="number" placeholder="Budget USDC" />
    <select v-model="strategy">
      <option value="balanced">Équilibré</option>
      <option value="cost-first">Moins cher</option>
      <option value="quality-first">Meilleure qualité</option>
    </select>
    <button type="submit">Lancer mission</button>
  </form>
</template>
```

#### 5. **Composant SimulationPanel**

Lance des batches de test :

```vue
<script>
async function runSimulation() {
  isLoading = true;
  try {
    const result = await api.simulation.run(count);
    // Affiche les résultats
    showResults(result.summary);
  } finally {
    isLoading = false;
  }
}
</script>
```

### 🔐 Authentification Firebase

File: `frontend/src/services/firebase.js`

```javascript
// Initialisation
initializeApp(firebaseConfig);
const auth = getAuth();

// Authentification
loginWithGoogle()              // SSO Google
loginWithEmail(email, pwd)     // Email + mot de passe
logout()                       // Déconnexion

// Token
getIdToken()                   // JWT pour API calls
```

### 📊 Routing (router.js)

```javascript
const routes = [
  { path: '/', component: Home },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/profile', component: UserProfile, meta: { requiresAuth: true } },
  { path: '/tasks/:id', component: TaskDetail, meta: { requiresAuth: true } },
  // ...
];
```

---

## 🔄 Flux de données complet

### Scénario: Exécution d'une mission

```
1. UTILISATEUR SOUMET TÂCHE
   Frontend: MissionForm.vue → POST /api/tasks
   Payload: {
     input: "Summarize this...",
     taskType: "summarize",
     budget: 0.0005,
     strategy: "balanced"
   }

2. BACKEND REÇOIT TÂCHE
   server.js → routes/tasks.routes.js
   ↓
   taskEngine.createTask()
   ↓
   v2OrchestratorAgent.executeTask()

3. ORCHESTRATION
   capabilityMatcher.findMatches()    // Agents capables
   ↓
   scoringSchema.score()              // Scoring (coût/qualité)
   ↓
   agentRegistry.selectBest()         // Sélection meilleur agent

4. SAGA - TWO-PHASE COMMIT
   Phase 1 (PREPARE):
     paymentSaga.reserve()
     ledger.getBalance(user)
     
   Phase 2 (EXECUTE):
     agent.work()
     ledger.recordWork()
     
   Phase 3 (COMMIT):
     arcBlockchainService.transfer()  // USDC on-chain
     ledger.recordTransaction()

5. RÉSULTAT
   taskEngine.setTaskResult()
   ↓
   Retour au frontend avec:
   {
     id: "task_...",
     status: "completed",
     result: "...",
     transactions: [...]
   }

6. FRONTEND MET À JOUR
   MissionResult.vue affiche résultat
   ArcProof.vue affiche preuve blockchain
   walletStore.updateBalance()
```

---

## 💰 Économie des paiements

### Distribution d'une mission de $0.0005

```
Budget utilisateur: $0.0005

┌─────────────────────────────┐
│ User paie: $0.0005          │
└─────────────┬───────────────┘
              │
      ┌───────▼──────┐
      │ Axonlayer    │ Orchestrator
      │ (sur Arc)    │
      └───────┬──────┘
              │
      ┌───────┴──────────┬───────────┐
      │                  │           │
      ▼                  ▼           ▼
  Agent Wallet      Validator     Treasury
  $0.0002 USDC      $0.0001 USDC  $0.0002 USDC
```

### Configuration (config.js)

```javascript
pricing: {
  profile: 'nano',           // Micro-pricing
  clientPayment: 0.0005,     // Ce que paye l'user
  workerPayment: 0.0002,     // Ce que gagne l'agent
  validatorPayment: 0.0001,  // Validateur
  orchestratorMargin: 0.0002 // Axonlayer
}
```

**Garanties** :
- ✅ Marge toujours ≥ 0%
- ✅ Pas de quotes agressifs
- ✅ Prix transparent et auditable

---

## 🧪 Tests & Vérification

### Backend Tests
File: `backend/tests/`

```bash
npm test                  # Vitest (223 tests)
npm run test:watch       # Mode watch
npm run test:coverage    # Couverture
```

**Domaines testés** :
- ✅ Unit: Ledger, TaskEngine, Scoring
- ✅ Intégration: Payment Saga, Settlement
- ✅ Invariants: Marges ≥ 0%, Ledger consistent
- ✅ Résilience: RPC failure handling

### Frontend (Vite)

```bash
npm run dev              # Vite dev server
npm run build            # Production build
npm run preview          # Preview prod
```

---

## 🚀 Déploiement & Configuration

### Variables d'environnement critiques

**Backend** (`.env`) :
```bash
PORT=3001
NODE_ENV=production

# Firebase
FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=...

# Blockchain Arc
ONCHAIN_NETWORK=arc-testnet
ONCHAIN_RPC_URL=https://rpc.testnet.arc.network
ONCHAIN_CHAIN_ID=5042002
ONCHAIN_USDC_ADDRESS=0x3600000000000000000000000000000000000000
ONCHAIN_DRY_RUN=false

# Wallet Provider
WALLET_PROVIDER=onchain
PRICING_PROFILE=nano

# HTTPS
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/path/to/key.pem
HTTPS_CERT_PATH=/path/to/cert.pem

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend** (`.env`) :
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
```

---

## 🔗 Points d'intégration clés

### Blockchain (Arc)

**Service** : `backend/src/core/arcBlockchainService.js`

```javascript
// Transferts USDC on-chain
async transfer(fromWallet, toWallet, amount) {
  // Envoie transaction via ethers.js
  // Attends confirmation (< 1 seconde sur Arc)
  // Retourne hash transactionnel
}
```

### Firebase Auth

**Frontend** : Authentification via Google SSO  
**Backend** : Validation token JWT Firebase

---

## ⚠️ Points critiques & Limitations

### ✅ Points forts
- ✅ Orchestration décentralisée d'agents
- ✅ Paiements on-chain atomiques (SAGA pattern)
- ✅ Sécurité: Clés chiffrées AES-256-GCM
- ✅ Persistance: Ledger + tâches sauvegardées
- ✅ Résilience: Auto-retry sur RPC failures
- ✅ Rate limiting et authentication

### ⚠️ Limitations actuelles
- ⚠️ Ledger en mémoire (single-node seulement)
- ⚠️ Pas de base de données distribuée
- ⚠️ Scalabilité limitée pour gros volumes
- ⚠️ Pas de sharding ou partitioning
- ⚠️ Dépend de Circle Arc (testnet)

### 🔒 Sécurité appliquée
- ✅ Helmet.js (headers sécurisés)
- ✅ CORS explicite (allowlist)
- ✅ Rate limiting (auth endpoint spécial)
- ✅ Idempotency (clés de déduplication)
- ✅ Encryption des clés privées
- ✅ Firebase Auth + JWT validation

---

## 📈 Métriques & Observabilité

### Endpoints de monitoring

```
GET /api/health             # Liveness check
GET /api/readiness          # Readiness check
GET /api/metrics            # Prometheus metrics
GET /api/config             # Configuration actuelle
```

### Logging structuré (Pino)

```javascript
// Logs JSON avec contexte
logger.info({ taskId, agentId, amount }, 'Task executed');
```

---

## 🎯 Résumé exécutif

**Axonlayer** est une plateforme de **coordination économique d'agents IA** :

| Aspect | Détail |
|--------|--------|
| **Cœur** | Orchestration intelligente + paiements on-chain |
| **Frontend** | Vue 3 + Firebase Auth + Portefeuille USDC |
| **Backend** | Express + Ledger in-memory + SAGA pattern |
| **Blockchain** | Circle Arc (USDC, < 1 sec finality) |
| **Sécurité** | AES-256-GCM, Helmet, CORS, Rate limiting |
| **Tests** | 223+ tests unitaires + E2E |
| **État** | Production-ready sur Arc testnet |

Le code est bien structuré, avec une séparation claire des responsabilités et des mécanismes robustes pour garantir la fiabilité des transactions.
