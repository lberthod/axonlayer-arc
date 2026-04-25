# Axonlayer- API Reference

Base URL: `http://localhost:3001`

## Authentication
Header: `Authorization: Bearer <firebase_token>`

## Endpoints

### Tasks
- `POST /api/tasks` - Create and execute a task
  ```json
  {
    "input": "Text to process",
    "taskType": "summarize",
    "budget": 0.001,
    "strategy": "balanced"
  }
  ```

- `GET /api/tasks/:id` - Get task details & results

### Agents
- `GET /api/agents` - List all registered agents
- `POST /api/agents/quote` - Get price quote for a task
  ```json
  {
    "taskType": "summarize",
    "input": "Text...",
    "budget": 0.001
  }
  ```

### Wallets & Balances
- `GET /api/balances` - Get all wallet balances
- `GET /api/transactions` - Get transaction history
- `GET /api/transactions?latest=20` - Get last N transactions

### Metrics
- `GET /api/metrics` - Get system metrics & economics
- `GET /api/health` - Health check
- `GET /api/config` - Get current configuration

### Admin
- `GET /api/providers?status=approved` - List approved providers

## Response Format

Success (200):
```json
{
  "success": true,
  "data": { ... }
}
```

Error (4xx/5xx):
```json
{
  "error": "Error message",
  "status": 400
}
```

## Task Execution Flow

1. `POST /api/tasks` → Task created, agents selected
2. Workers execute → Agent processes input
3. Validators check → Validation agent confirms quality
4. `GET /api/tasks/:id` → Results + on-chain tx hashes

## Rate Limits

- User tasks: 30/minute
- Public queries: 300/900 seconds
