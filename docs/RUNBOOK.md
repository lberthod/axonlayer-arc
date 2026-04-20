# Runbook — Agent-to-Agent USDC Task Network

Operational reference for on-call. Each incident lists: **symptom → diagnosis → remediation**.

---

## 1. Service exposure

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Liveness (always 200 if process alive) |
| `GET /api/ready` | Readiness (200 if ledger + onchain + auth are OK, 503 otherwise) |
| `GET /api/metrics` | Economic + operational KPIs in JSON |
| `GET /api/metrics/prometheus` | Prometheus scrape endpoint |
| `GET /api/docs` | Swagger UI |
| `GET /api/openapi.json` | OpenAPI 3.1 spec |

Logs are structured JSON (pino). Every request carries a `x-request-id` header;
use it as the correlation key across logs, the ledger (coming), and the chain.

---

## 2. Common incidents

### 2.1 `/api/ready` returns 503 — `onchain.ok = false`

**Symptom:** readiness endpoint reports `checks.onchain.ok=false`.

**Diagnosis:** the EVM RPC provider (Arc, Base…) is unreachable, the URL is wrong,
or the node is slow. Check:
```bash
curl -sS -X POST $ONCHAIN_RPC_URL \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

**Remediation:**
1. If RPC is down → switch `ONCHAIN_RPC_URL` to a backup (Ankr, Blast, Alchemy).
2. If persistent → flip `ONCHAIN_DRY_RUN=true` so the service keeps serving
   traffic without broadcasting. Tasks still settle in the local ledger.
3. Restart the backend.

### 2.2 Insufficient balance mid-task ("onchain transfer failed")

**Symptom:** logs show `onchain transfer failed: insufficient funds`;
`/api/tasks` returns `status: "failed"`.

**Diagnosis:** the orchestrator or a worker wallet is empty on-chain.

**Remediation:**
```bash
cd backend
npm run wallets:balances
```
Identify the dry wallet, fund it from the faucet
(https://faucet.circle.com) or from treasury. **Do not** edit
`src/data/store.json` by hand — the on-chain state is the source of truth in
live mode.

### 2.3 Ledger divergence (local vs on-chain)

**Symptom:** `/api/balances` shows a different number than the block explorer.

**Diagnosis:** with the Sprint 1 fix this should only happen if the process
crashed between the successful chain broadcast and the ledger write.

**Remediation:**
1. Put the service into read-only mode: `RATE_LIMIT_TASKS=0` then redeploy, or
   stop the container.
2. Reconcile by replaying transfers from the explorer:
   - fetch the list of USDC transfers touching your wallets;
   - for each missing tx, craft a manual ledger entry (future: admin route).
3. Bring back the service.

### 2.4 `store.json` corrupt (e.g. `Unexpected token` on boot)

**Symptom:** `npm start` fails with `SyntaxError: Unexpected token ...` reading
`src/data/store.json`.

**Diagnosis:** a crash during a (pre-Sprint-1) non-atomic write. Since Sprint 1
the writer uses `write-tmp + rename` so this should no longer happen.

**Remediation:**
```bash
cd backend/src/data
cp store.json store.json.corrupt.$(date +%s)
git checkout HEAD -- store.json   # if tracked — otherwise recreate fresh
```
or reset:
```bash
node -e "require('fs').writeFileSync('src/data/store.json', JSON.stringify({transactions:[],balances:{}}, null, 2))"
```
Then fund the wallets again (simulated mode) or re-hydrate from chain state.

### 2.5 Rate-limiter false positives

**Symptom:** legitimate client gets 429 on `/api/tasks`.

**Diagnosis:** too aggressive defaults or shared IP (NAT). Rate-limit keys by
`req.user.uid` when available, so encourage clients to authenticate.

**Remediation:** raise limits via env:
```
RATE_LIMIT_TASKS=120
RATE_LIMIT_TASKS_WINDOW_MS=60000
```
Restart.

### 2.6 Provider slashed "unfairly"

**Symptom:** a provider complains their stake was slashed on a task that
looked valid.

**Diagnosis:** the Validator returned `valid=false`. Today there is **no**
dispute window (see Sprint 5 in `AUDIT_SPRINTS.md`).

**Remediation (manual):**
1. Check the task:
   `curl -sS http://host/api/tasks/<taskId>`
2. If the validator was wrong, manually restore stake:
   `POST /api/providers/:id/stake` (admin) with a positive amount.
3. Document the incident until an automatic dispute flow is shipped.

### 2.7 OpenAI LLM unavailable

**Symptom:** worker logs `[Worker-default] LLM failed, falling back to local`.

**Diagnosis:** key revoked, quota exceeded, or OpenAI outage.

**Remediation:**
- Tasks continue working via the local algorithm (no user-visible failure).
- Check https://status.openai.com. Rotate the key in `.env`, restart.
- Validate the key locally:
  ```bash
  curl -sS https://api.openai.com/v1/responses \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-5-nano-2025-08-07","input":"ping","reasoning":{"effort":"minimal"}}'
  ```

---

## 3. Deployment

### 3.1 Docker (recommended)
```bash
docker compose up --build -d
# open the frontend
open http://localhost:8080
# Swagger UI
open http://localhost:3001/api/docs
```

To enable Prometheus:
```bash
docker compose --profile observability up -d
# open http://localhost:9090
```

### 3.2 Bare metal (node directly)
```bash
cd backend && npm ci && npm start &
cd frontend && npm ci && npm run build && npx serve dist -l 8080
```

### 3.3 Rollback
- Backend is stateful only through `backend/src/data/*.json`. Keep daily
  backups of that folder (`cron`, S3…).
- `docker compose down && docker compose up --build --force-recreate` for
  clean restarts.

---

## 4. On-call quick commands

```bash
# Health + readiness
curl -s http://host/api/health  | jq
curl -s http://host/api/ready   | jq

# Live metrics (JSON)
curl -s http://host/api/metrics | jq

# Prometheus sample
curl -s http://host/api/metrics/prometheus | head -30

# Wallet balances (simulated)
curl -s http://host/api/balances | jq

# Recent transactions
curl -s "http://host/api/transactions?latest=20" | jq

# Filter by taskId
curl -s "http://host/api/transactions?taskId=task_xxx" | jq

# Trace a request end-to-end
grep <request-id> /var/log/arc-usdc-backend.log
```

---

## 5. Escalation

1. Follow this runbook first.
2. If wallet funds are at risk → freeze service with `WALLET_PROVIDER=simulated`
   (disables on-chain broadcasting) and page the security channel.
3. For anything security-related see `SECURITY.md`.
