# 🔌 API Reference & Usage Guide

## Base URL
```
http://localhost:3001
```

## Authentication
Toutes les routes protégées nécessitent un **JWT Firebase** :

```bash
curl -H "Authorization: Bearer {JWT}" \
     -H "Content-Type: application/json" \
     http://localhost:3001/api/...
```

---

## 📝 TASK ENDPOINTS

### 1. Create & Execute Task
**Endpoint**: `POST /api/tasks`

Crée et exécute une tâche dans un seul appel.

```http
POST /api/tasks
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "input": "Summarize this 10-page report about AI trends",
  "taskType": "summarize",
  "budget": 0.0005,
  "strategy": "balanced"
}
```

**Response** (200 OK):
```json
{
  "id": "task_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "input": "Summarize this 10-page report...",
  "taskType": "summarize",
  "status": "completed",
  "createdAt": "2024-04-26T10:30:00Z",
  "updatedAt": "2024-04-26T10:30:05Z",
  "result": "This report discusses AI trends...",
  "validation": {
    "isValid": true,
    "score": 0.95
  },
  "transactions": [
    {
      "id": "tx_abc123",
      "from": "user_wallet",
      "to": "agent_wallet",
      "amount": 0.0002,
      "status": "completed"
    },
    {
      "id": "tx_def456",
      "from": "user_wallet",
      "to": "treasury",
      "amount": 0.0003,
      "status": "completed"
    }
  ],
  "requesterUid": "user123",
  "providerIds": ["agent_47ac10b"]
}
```

**Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `input` | string | ✅ | - | Task description/text to process |
| `taskType` | enum | ✅ | - | `summarize`, `rewrite`, or `translate` |
| `budget` | number | ❌ | 0.0005 | Max USDC to spend (must be > 0) |
| `strategy` | enum | ❌ | balanced | `cost-first`, `quality-first`, or `balanced` |

**Error Responses**:
```
400 Bad Request
{
  "error": "Invalid input",
  "details": "budget must be > 0"
}

402 Payment Required
{
  "error": "Insufficient balance",
  "details": "User balance: 0.0002, required: 0.0005"
}

504 Gateway Timeout
{
  "error": "Agent unreachable",
  "details": "No available agents for summarize task"
}
```

---

### 2. Get Task Details
**Endpoint**: `GET /api/tasks/:id`

Récupère les détails d'une tâche spécifique.

```http
GET /api/tasks/task_f47ac10b-58cc-4372-a567-0e02b2c3d479
Authorization: Bearer {JWT}
```

**Response** (200 OK):
```json
{
  "id": "task_f47ac10b...",
  "input": "Summarize this...",
  "status": "completed",
  "result": "AI trends report summary...",
  "transactions": [...]
}
```

---

### 3. List User Tasks
**Endpoint**: `GET /api/tasks`

Liste toutes les tâches de l'utilisateur connecté.

```http
GET /api/tasks
Authorization: Bearer {JWT}
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset (default: 0) |
| `status` | string | Filter by status: `pending`, `completed`, `failed` |

**Response** (200 OK):
```json
{
  "tasks": [
    { "id": "task_1", "status": "completed", ... },
    { "id": "task_2", "status": "pending", ... }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

## 💰 BALANCE & WALLET ENDPOINTS

### 4. Get All Balances
**Endpoint**: `GET /api/balances`

Récupère tous les soldes USDC (utilisateur, agents, treasury).

```http
GET /api/balances
Authorization: Bearer {JWT}
```

**Response** (200 OK):
```json
{
  "user_uid_123": 0.8500,
  "agent_47ac10b": 0.2345,
  "agent_58cc4372": 0.1234,
  "treasury": 0.5000
}
```

---

### 5. Get User Wallet Details
**Endpoint**: `GET /api/auth/me`

Récupère l'info utilisateur + portefeuille + balance.

```http
GET /api/auth/me
Authorization: Bearer {JWT}
```

**Response** (200 OK):
```json
{
  "uid": "user123",
  "email": "user@example.com",
  "role": "user",
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f42921",
  "balance": 0.8500,
  "arcAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42921",
  "missionWalletAddress": "0xA89044f1d22e8CD292B3Db092C8De28eB1728d74"
}
```

---

## 📊 TRANSACTIONS ENDPOINTS

### 6. Get All Transactions
**Endpoint**: `GET /api/transactions`

Récupère l'historique de toutes les transactions.

```http
GET /api/transactions
Authorization: Bearer {JWT}
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `wallet` | string | Filter by wallet address |
| `taskId` | string | Filter by task ID |
| `latest` | number | Get only last N transactions |

**Response** (200 OK):
```json
{
  "transactions": [
    {
      "id": "tx_abc123",
      "from": "0x742d35...",
      "to": "0x847a5e...",
      "amount": 0.0002,
      "taskId": "task_...",
      "timestamp": "2024-04-26T10:30:05Z",
      "status": "completed",
      "txHash": "0xabcd1234...",
      "blockNumber": 12345
    }
  ]
}
```

---

## 🤖 AGENT ENDPOINTS

### 7. List All Agents
**Endpoint**: `GET /api/agents`

Liste les agents disponibles avec leurs stats.

```http
GET /api/agents
Authorization: Bearer {JWT}
```

**Response** (200 OK):
```json
{
  "agents": [
    {
      "id": "agent_47ac10b",
      "name": "AI Summarizer",
      "capabilities": ["summarize"],
      "costPerTask": 0.0002,
      "qualityScore": 0.95,
      "speedScore": 0.87,
      "totalTasksCompleted": 1234,
      "successRate": 0.98,
      "walletAddress": "0x847a5e...",
      "isOnline": true,
      "lastSeen": "2024-04-26T10:29:00Z"
    }
  ]
}
```

---

### 8. Get Task Quote (Pricing Estimate)
**Endpoint**: `POST /api/agents/quote`

Obtient un devis pour une tâche avant exécution.

```http
POST /api/agents/quote
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "input": "Summarize this document",
  "taskType": "summarize",
  "budget": 0.0005,
  "strategy": "balanced"
}
```

**Response** (200 OK):
```json
{
  "quote": {
    "taskType": "summarize",
    "budget": 0.0005,
    "selectedAgents": [
      {
        "agentId": "agent_47ac10b",
        "name": "AI Summarizer",
        "estimatedCost": 0.0002,
        "qualityScore": 0.95,
        "estimatedTime": 2000
      }
    ],
    "pricing": {
      "clientPayment": 0.0005,
      "workerPayment": 0.0002,
      "validatorPayment": 0.0001,
      "orchestratorMargin": 0.0002
    },
    "estimatedDuration": 2000,
    "confidence": 0.96
  }
}
```

---

## 🧪 SIMULATION ENDPOINTS

### 9. Run Batch Simulation
**Endpoint**: `POST /api/simulate`

Exécute un batch de tâches simulées (test).

```http
POST /api/simulate
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "count": 50,
  "taskType": "summarize",
  "selectionStrategy": "balanced"
}
```

**Response** (200 OK):
```json
{
  "executed": 50,
  "failed": 0,
  "transactionsCreated": 100,
  "summary": {
    "grossVolume": 0.025,
    "workerRevenue": 0.01,
    "validatorRevenue": 0.005,
    "orchestratorMargin": 0.01
  },
  "perTaskType": {
    "summarize": {
      "count": 50,
      "volume": 0.025
    }
  },
  "missions": [
    {
      "taskId": "task_1",
      "status": "completed",
      "result": "...",
      "executionTime": 1234,
      "cost": 0.0005
    }
  ],
  "averageExecutionTime": 1200,
  "totalExecutionTime": 60000
}
```

---

### 10. Stream Batch Progress (SSE)
**Endpoint**: `POST /api/simulate/stream`

Exécute un batch et stream la progression en temps réel (Server-Sent Events).

```http
POST /api/simulate/stream
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "count": 50,
  "taskType": "summarize"
}
```

**Response** (200 OK - text/event-stream):
```
data: {"index":0,"status":"running","progress":0}
data: {"index":1,"status":"completed","result":"...","cost":0.0005}
data: {"index":2,"status":"running","progress":4}
...
data: {"status":"completed","summary":{"grossVolume":0.025,...}}
```

**Frontend usage**:
```javascript
const eventSource = new EventSource('/api/simulate/stream', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Progress: ${progress.index}/${count}`);
};

eventSource.onerror = () => {
  console.error('Stream failed');
  eventSource.close();
};
```

---

## 📈 METRICS ENDPOINTS

### 11. Get Operational Metrics
**Endpoint**: `GET /api/metrics`

Récupère les métriques du système (opérationnelles + économiques).

```http
GET /api/metrics
Authorization: Bearer {JWT}
```

**Response** (200 OK):
```json
{
  "system": {
    "uptime": 3600000,
    "requestCount": 1234,
    "errorCount": 5,
    "avgResponseTime": 245
  },
  "tasks": {
    "totalExecuted": 5678,
    "totalFailed": 42,
    "successRate": 0.9926,
    "avgExecutionTime": 2100,
    "totalByType": {
      "summarize": 3000,
      "rewrite": 1500,
      "translate": 1178
    }
  },
  "economics": {
    "grossVolume": 2.8390,
    "workerRevenue": 1.1356,
    "validatorRevenue": 0.5678,
    "orchestratorMargin": 1.1356
  },
  "agents": {
    "totalRegistered": 12,
    "totalOnline": 10,
    "averageQualityScore": 0.92,
    "totalTasksAssigned": 5678
  }
}
```

---

## 🔐 AUTHENTICATION ENDPOINTS

### 12. Get Current User
**Endpoint**: `GET /api/auth/me`

(Voir endpoint #5 ci-dessus)

---

### 13. Become a Provider (Agent)
**Endpoint**: `POST /api/auth/becomeProvider`

Transforme un utilisateur en fournisseur/agent.

```http
POST /api/auth/becomeProvider
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "capabilities": ["summarize", "rewrite"],
  "costPerTask": 0.0002,
  "walletAddress": "0x847a5e..."
}
```

**Response** (200 OK):
```json
{
  "uid": "user123",
  "role": "provider",
  "capabilities": ["summarize", "rewrite"],
  "wallet": "0x847a5e...",
  "apiKey": "sk_test_abc123def456",
  "status": "active"
}
```

---

### 14. Rotate API Key
**Endpoint**: `POST /api/auth/rotateApiKey`

Génère une nouvelle clé API (invalide l'ancienne).

```http
POST /api/auth/rotateApiKey
Authorization: Bearer {JWT}
```

**Response** (200 OK):
```json
{
  "apiKey": "sk_test_xyz789uvw123",
  "createdAt": "2024-04-26T10:35:00Z",
  "expiresAt": null,
  "previousKey": "sk_test_abc123def456"
}
```

---

## 🏥 HEALTH ENDPOINTS

### 15. Liveness Check
**Endpoint**: `GET /api/health`

Vérifie si le serveur fonctionne (Kubernetes liveness probe).

```http
GET /api/health
```

**Response** (200 OK):
```json
{
  "status": "alive"
}
```

---

### 16. Readiness Check
**Endpoint**: `GET /api/readiness`

Vérifie si le serveur est prêt à servir (Kubernetes readiness probe).

```http
GET /api/readiness
```

**Response** (200 OK):
```json
{
  "ready": true,
  "ledger": "loaded",
  "wallets": "initialized",
  "blockchain": "connected"
}
```

---

### 17. Configuration
**Endpoint**: `GET /api/config`

Récupère la configuration du serveur.

```http
GET /api/config
Authorization: Bearer {JWT}
```

**Response** (200 OK):
```json
{
  "auth": {
    "enabled": true,
    "provider": "firebase"
  },
  "pricing": {
    "profile": "nano",
    "clientPayment": 0.0005,
    "workerPayment": 0.0002,
    "validatorPayment": 0.0001,
    "orchestratorMargin": 0.0002
  },
  "walletProvider": {
    "mode": "onchain",
    "onChain": {
      "network": "arc-testnet",
      "chainId": 5042002,
      "label": "Circle Arc Testnet",
      "dryRun": false,
      "rpcUrl": "https://rpc.testnet.arc.network"
    }
  },
  "features": {
    "simulation": true,
    "streaming": true,
    "apiMetrics": true
  }
}
```

---

## 📚 Common Usage Patterns

### Pattern 1: Submit a Task & Wait for Result

```javascript
const response = await fetch('http://localhost:3001/api/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: 'Summarize this article...',
    taskType: 'summarize',
    budget: 0.0005,
    strategy: 'balanced'
  })
});

const task = await response.json();
console.log(`Task completed: ${task.id}`);
console.log(`Result: ${task.result}`);
console.log(`Cost: ${task.pricing.clientPayment} USDC`);
```

---

### Pattern 2: Get Price Quote Before Committing

```javascript
// Step 1: Get quote
const quote = await fetch('http://localhost:3001/api/agents/quote', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: 'Summarize this...',
    taskType: 'summarize',
    budget: 0.0005,
    strategy: 'balanced'
  })
}).then(r => r.json());

console.log(`Estimated cost: ${quote.pricing.clientPayment} USDC`);
console.log(`Quality score: ${quote.selectedAgents[0].qualityScore}`);

// Step 2: Execute if price is acceptable
if (quote.pricing.clientPayment <= userBudget) {
  const task = await fetch(...).then(r => r.json());
  console.log('Task completed!');
}
```

---

### Pattern 3: Stream Batch Progress

```javascript
const eventSource = new EventSource('http://localhost:3001/api/simulate/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    count: 50,
    taskType: 'summarize'
  })
});

let completedCount = 0;

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  
  if (progress.status === 'completed') {
    completedCount++;
    updateProgressBar((completedCount / 50) * 100);
  }
};

eventSource.onerror = () => {
  eventSource.close();
  console.log('Batch complete!');
};
```

---

### Pattern 4: Monitor User Balance

```javascript
// Get current balance
const user = await fetch('http://localhost:3001/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(`Current balance: ${user.balance} USDC`);

// Get all transactions
const txs = await fetch('http://localhost:3001/api/transactions', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

const totalSpent = txs.transactions
  .filter(tx => tx.from === user.wallet)
  .reduce((sum, tx) => sum + tx.amount, 0);

console.log(`Total spent: ${totalSpent} USDC`);
```

---

## 🔒 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 100 requests | 15 minutes |
| `/api/auth/*` | 5 requests | 15 minutes |
| `/api/tasks` | 20 requests | 15 minutes |
| `/api/simulate` | 2 requests | 15 minutes |

**Response** (429 Too Many Requests):
```json
{
  "error": "Too many requests",
  "retryAfter": 300
}
```

---

## 🚨 Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| `400` | Bad Request | Invalid input format |
| `401` | Unauthorized | Invalid JWT token |
| `402` | Payment Required | Insufficient balance |
| `403` | Forbidden | Not a provider |
| `404` | Not Found | Task doesn't exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected error |
| `502` | Bad Gateway | Blockchain RPC error |
| `504` | Gateway Timeout | No agents available |

---

C'est une API complète et robuste pour orchestrer les tâches !
