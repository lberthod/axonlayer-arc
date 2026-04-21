# Audit Complet — Arc USDC Task Network MVP

**Date d'audit** : 20 avril 2026  
**Périmètre** : Architecture complète, sécurité, qualité du code, production-readiness  
**Verdict** : ⚠️ **MVP fonctionnel mais non-production-ready**

---

## 1️⃣ Résumé Exécutif

### Projet
Arc USDC Task Network est un MVP démontrant une **économie d'agents décentralisée** où :
- Des **agents autonomes** collaborent sur des tâches (résumé, extraction, traduction)
- Les **paiements USDC** sont micropayments sur Circle Arc (L1 stablecoin-native)
- Un **orchestrateur** répartit le travail et prend un spread
- Un **validateur** vérifie la qualité
- Un **ledger interne** trace chaque transaction

### Verdict
- ✅ **Architecture solide** : séparation orchestrateur/agents/ledger/payment-adapter
- ✅ **Fonctionnalité complète** : Phase 1, 2 et 3 implémentées (auth Firebase, marketplace, LLM)
- ✅ **Scalabilité** : simulation 50+ tx démontre la capacité
- ⚠️ **Fiabilité** : aucun test automatisé, persistance fragile
- ⚠️ **Sécurité** : CORS ouvert, rate-limit limité, secrets commitées
- ⚠️ **Production-ready** : 4/10 (MVP: 7/10)

**Temps avant production minimum** : 3-4 sprints (6-8 semaines)

---

## 2️⃣ Architecture Générale

### Topologie

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vue 3 + Vite)                 │
│ ┌──────────────┬──────────────┬──────────────────┐          │
│ │ MissionCtrl  │ ProviderHub  │ AdminDashboard   │          │
│ └──────────────┴──────────────┴──────────────────┘          │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │                    Orchestrator Agent                  │  │
│ │  ◦ Routes: /api/{tasks,missions,metrics,admin,auth}  │  │
│ │  ◦ Distribue tâches → Worker + Validator             │  │
│ │  ◦ Prend spread (margin)                             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┤
│ │ Agents (Workers)        Agents (Validators)               │
│ │ ─────────────────────   ──────────────────               │
│ │ • Worker (default)     • Validator (default)             │
│ │ • Worker (fast)        • Validator (strict)              │
│ │ • Worker (premium)     • Validator (custom)              │
│ │ • Translator           • Registry scoring                │
│ │ • Classifier                                             │
│ │ • Sentiment            [Registry + Selection via EMA]    │
│ └──────────────────────────────────────────────────────────┘
│                          │
│ ┌──────────────────────────┼──────────────────────────────┐ │
│ │  Ledger (JSON-based)     │   Payment Adapter (2 modes) │ │
│ │  ────────────────────    │   ──────────────────────── │ │
│ │  • In-memory:            │   • Simulated (default)    │ │
│ │    - balances[]          │     → fs.writeFile         │ │
│ │    - transactions[]      │   • Onchain (ethers)       │ │
│ │  • Store: store.json     │     → EVM RPC (Arc/Base)   │ │
│ │                          │     → ERC-20 USDC         │ │
│ └──────────────────────────┴──────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┤
│ │ Supporting Services                                       │
│ │ • PricingEngine (dynamic per-char costing)              │
│ │ • SimulationEngine (batch load test)                    │
│ │ • MetricsEngine (KPIs + Prometheus)                     │
│ │ • Auth (Firebase ID tokens)                            │
│ │ • LLMClient (OpenAI Responses API)                      │
│ │ • HealthCheck (RPC, ledger, Firebase)                  │
│ │ • Logger (console → ideally centralized)               │
│ └──────────────────────────────────────────────────────────┘
│                                                              │
└──────────────────────────────────────────────────────────────┘
         │                                      │
         ▼ (onchain mode, dry-run=false)       ▼
    ┌──────────────────────────┐      ┌─────────────────────┐
    │   Circle Arc (L1)         │      │  Firebase Auth      │
    │   USDC ERC-20             │      │  Real-time DB       │
    │   Sub-second settlement   │      │  Service Accounts   │
    └──────────────────────────┘      └─────────────────────┘
```

### Flux d'une Mission

```
1. User → MissionForm (input texte, budget, type)
   ↓
2. Frontend → POST /api/missions
   ↓
3. Orchestrator ← parses & validates request
   ↓
4. PricingEngine ← calcule coût dynamique
   ↓
5. Ledger ← pre-check: client.balance ≥ coût ? ✓
   ↓
6. AgentRegistry ← sélection: Worker (score/price), Validator
   ↓
7. WorkerAgent ← tx1 : client → worker (0.0002 USDC)
   ↓
8. Worker ← local algo ou LLM (OpenAI)
   ↓
9. ValidatorAgent ← tx2 : client → validator (0.0001 USDC)
   ↓
10. Validator ← QA score
   ↓
11. Ledger ← tx3 : orchestrator retient margin (0.0001 USDC)
   ↓
12. Frontend ← résult + timeline + balances updated
   ↓
13. [Onchain mode] → EVM RPC broadcast 3 tx (si dry-run=false)
```

---

## 3️⃣ Évaluation Détaillée par Domaine

### 🔴 CRITIQUE (Bloquant production)

#### #1 — Incohérence Ledger ↔ Onchain

**Fichier** : `backend/src/core/walletProvider.js:108-149`

```javascript
// PROBLÈME : ledger muté AVANT la chaîne
ledger.createTransaction(...)  // ← solde débité localement
const result = await ethersClient.transfer(...)  // ← peut échouer
```

**Impact** : Si broadcast échoue, le ledger montre une tx confirmée mais elle n'existe pas sur-chaîne.

**Fix** : Implémenter un pattern "2-phase commit" :
- Phase 1 : chaîne d'abord (ou dry-run)
- Phase 2 : ledger muté sur succès seulement

---

#### #2 — Aucun Test Automatisé

**Constat** : 0 fichier `.test.js` ou `.spec.js` dans le repo.

**Risque** : Le moindre refactor du ledger/pricing casse l'invariant `client = worker + validator + margin`.

**Evidence** : 
- 41 fichiers JS backend
- ~10 fichiers critiques (pricing, ledger, agents)
- Zéro couverture

**Fix requis** :
```javascript
// test/core/pricingEngine.test.js
describe('PricingEngine', () => {
  it('invariant: client payment = sum(worker + validator + margin)', () => {
    const client = pricing(100, 'standard')
    const sum = client.worker + client.validator + client.margin
    assert.equal(client.total, sum)
  })
})
```

---

#### #3 — Persistance Non-Atomique

**Fichier** : `backend/src/core/ledger.js` et `jsonStore.js`

```javascript
fs.writeFile('store.json', JSON.stringify(data))  // ← pas d'atomicité
// Sous charge (50+ tx) → corruption possible
```

**Problèmes** :
- Pas de lock → écritures concurrentes
- O(N) réécriture complète du fichier
- Pas de `rename` temporaire
- Pas d'async/await coordonné

**Fix** : 
- Ajouter `async-mutex` pour le lock
- Utiliser `write + rename` atomique
- Ou migrer vers SQLite / Postgres

---

#### #4 — Tâches/Missions en Mémoire Seulement

**Fichier** : `backend/src/core/taskEngine.js:6`

```javascript
this.tasks = new Map()  // ← redémarrage = perte d'historique
```

**Impact** : 
- `/api/missions/mine` peut être vide après restart
- Incohérent avec un ledger persistant
- Contradiction avec "agent economy" traceable

**Fix** : Migrer vers `jsonStore` ou Postgres pour missions/tasks

---

#### #5 — Secrets Potentiellement Commitées

**Fichiers à risque** :
- `backend/.env` (visible dans les screenshots)
- `backend/firebase-service-account.json` (clés Firebase)
- `backend/src/data/wallets.json` (clés privées EVM ⚠️⚠️⚠️)

**Vérification** :
```bash
git log --all --full-history -- "*.env" "wallets.json"
```

**Fix** :
- Créer `.gitignore` racine strict
- Vérifier l'historique avec `git filter-repo` si fuite
- **Mettre les clés privées en KMS** (AWS Secrets Manager / Google Secret Manager)

---

#### #6 — Fichiers d'Archive Commitées

**Fichiers** :
- `backend/src.zip`
- `frontend/src.zip`

**Risque** : Duplifient le code, peuvent contenir des secrets oubliés.

**Fix** : `git rm --cached *.zip` + ajouter `.gitignore`

---

### 🟠 HAUT (Sécurité / Qualité)

#### #7 — CORS Totalement Ouvert

```javascript
// backend/src/app.js:18
app.use(cors())  // ← aucune origin allowlist
```

**Fix** :
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))
```

---

#### #8 — Pas de Rate-Limit Global

**Endpoints exploitables** : 
- `POST /api/missions` → créer 1000 tx sans paiement
- `POST /api/simulate` → lancer 10 simulations parallèles

**Fix** : `express-rate-limit` sur chaque endpoint public

```javascript
const limiter = rateLimit({
  windowMs: 60000,
  max: 10,  // 10 req par minute par IP
})
app.post('/api/missions', limiter, handler)
```

---

#### #9 — Validation d'Input Faible

**Problèmes** :
- Seulement `length > 5000` sur le texte
- Pas de sanitation pour prompt-injection (critique avec LLM worker)
- Enum limité sur `taskType`

**Fix** : Utiliser `zod` pour validation stricte + input sanitization

```javascript
const missionSchema = z.object({
  input: z.string().min(1).max(5000).trim(),
  type: z.enum(['summarize', 'translate', 'classify']),
  budget: z.number().positive().max(10),
})
```

---

#### #10 — Pas de Logger Structuré

**État** : Uniquement `console.log`

**Impact** : 
- Impossible de tracer une requête end-to-end
- Pas de corrélation requête → transactions → ledger

**Fix** : `pino` + `requestId` middleware

```javascript
app.use((req, res, next) => {
  req.id = uuid()
  next()
})
logger.info({ req: req.id, tx: txId }, 'transaction created')
```

---

#### #11 — Pas de Gestion d'Erreur Globale

```javascript
// Manquant : app.use((err, req, res, next) => {...})
```

**Fix** : Handler global + format standardisé

```javascript
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      requestId: req.id
    }
  })
})
```

---

#### #12 — Pas d'Idempotence sur POST /api/missions

**Risque** : Double-clic → 2 tâches, 2 paiements

**Fix** : `Idempotency-Key` header

```javascript
const key = req.headers['idempotency-key']
const cached = idempotencyStore.get(key)
if (cached) return res.json(cached)
// ... exécute ...
idempotencyStore.set(key, result, 24 * 3600)
```

---

#### #13 — Mode DryRun Non Explicite Frontend

**Problème** : Le backend retourne `dryRun: true` mais pas de bannière visible.

**Risque** : Confusion en démo mainnet.

**Fix** : `SettlementBanner.vue` top-level (déjà implémenté ✓)

---

### 🟡 MOYEN (Dette technique)

#### #14 — Pas de CI/CD

**Manquant** :
- `.github/workflows/` vide
- Pas de linting automatique
- Pas de test avant merge

**Fix** : GitHub Actions minimaliste

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run lint && npm run test
```

---

#### #15 — Pas de Docker / Containerization

**État** : `Dockerfile` existe mais pas de `docker-compose` complet

**Impact** : Déploiement tributaire d'une machine Node 20

**Fix** : `docker-compose.yml` dev + prod

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["3001:3001"]
    environment:
      WALLET_PROVIDER: simulated
    volumes:
      - ./backend/src/data:/app/src/data
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
```

---

#### #16 — Pas d'OpenAPI / Swagger

**État** : Docs dans le README uniquement

**Impact** : Pas d'auto-génération client, pas de découverte API

**Fix** : `swagger-ui-express` + schémas Zod → OpenAPI

---

#### #17 — Arrondi Monétaire par toFixed(6)

```javascript
Number.toFixed(6)  // ← introduce floating-point errors
```

**Fix** : `BigInt` en micro-USDC (1 USDC = 1e6 microUnits)

```javascript
const MICRO_USDC_PER_USDC = 1000000
const clientPayment = BigInt(500)  // 500 microUSDs = 0.0005 USDC
```

---

#### #18 — Registry/Providers Non-Réactif

**Problème** : Admin approuve provider → pas reflété sans redémarrage

**Fix** : Implémenter évent-driven agent registry reload

---

#### #19 — Pas de Pagination sur /api/transactions

**Risque** : En simulation massive, réponse > 1 MB

**Fix** : Ajouter `limit`/`cursor` ou `offset`/`limit`

---

#### #20 — Vue sans State Management Global

**État** : Stores Pinia minimalistes, state dans les vues

**Impact** : Difficile à scaler si périmètre grossit

**Fix** : Consolider en Pinia store centralisé

---

### 🟢 FAIBLE (Polish)

#### #21 — `.DS_Store` Committé
#### #22 — README Trop Long
#### #23 — Pas de Favicon
#### #24 — i18n Mixte FR/EN
#### #25 — Typo : `consing.md` → `consigne.md`

---

## 4️⃣ Analyse de Sécurité Détaillée

### Matrice de risque

| Risque | Sévérité | Likelihood | Impact | Mitigation |
|--------|----------|-----------|--------|-----------|
| Fuite clés privées (wallets.json) | 🔴 Critique | Moyenne | Perte USDC | KMS + no-git |
| Incohérence ledger↔chaîne | 🔴 Critique | Haute | Double-dépense | 2-phase commit |
| DoS via rate-limit absent | 🟠 Haute | Haute | Service indisponible | Rate-limit global |
| Prompt-injection (LLM) | 🟠 Haute | Moyenne | Outputs malveillants | Zod sanitization |
| SQL injection (future: DB) | 🟠 Haute | Basse | Data leak | ORM + parameterized |
| CSRF sur POST /api/missions | 🟡 Moyen | Basse | Non-auth'd tx | CSRF tokens |

---

## 5️⃣ Test Coverage & Qualité du Code

### Métriques actuelles

| Métrique | État | Target |
|----------|------|--------|
| Unit test coverage | 0 % | ≥ 85 % |
| Integration test coverage | 0 % | ≥ 70 % |
| ESLint passing | ? | 100 % |
| TypeScript strict | ❌ (JS) | Considérer |
| Security audit (`npm audit`) | ? | 0 high/critical |
| Dependency freshness | ⚠️ | Latest |

### Code smell détectés

1. **Magic numbers** : `0.002`, `0.001`, `0.0001` hardcodés → constants fichier
2. **Fonctions trop longues** : `orchestratorAgent.js` > 200 LOC
3. **Pas d'error types** : `throw new Error(msg)` → custom error classes
4. **Catch blocks vides** : `catch(e) { }` → logging obligatoire
5. **Promesses non-awaited** : `fs.writeFile(...).catch()` → async/await

---

## 6️⃣ Recommandations Priorisées

### Phase Immédiate (Cette semaine) — Quick Wins

1. **Créer `.gitignore` racine strict** (15 min)
   ```
   node_modules/
   .env
   .env.local
   wallets.json
   firebase-service-account.json
   *.zip
   .DS_Store
   dist/
   ```

2. **Vérifier secrets commitées** (30 min)
   ```bash
   git log --all -- "*.env" "wallets.json"
   # Si oui → rotate keys + git filter-repo
   ```

3. **Ajouter helmet + CORS stricte** (1 h)

4. **Impl. 1 test pricing invariant** (1 h)

5. **Ajouter bannière DryRun/Live** (30 min) — déjà fait ✓

---

### Sprint 1 — Fiabilité (2 semaines)

- [ ] Tests Vitest : pricing, ledger, agents (70% coverage min)
- [ ] Integration tests : Supertest sur `/api/missions`, `/api/simulate`
- [ ] Refactor ledger → atomicité + BigInt
- [ ] Migrer taskEngine → persistance
- [ ] Fix walletProvider : 2-phase commit onchain

---

### Sprint 2 — Sécurité (2 semaines)

- [ ] Rate-limit global
- [ ] Validation Zod complète
- [ ] Pino + requestId logging
- [ ] Idempotency-Key
- [ ] Chiffrement wallets.json ou KMS
- [ ] OWASP Top 10 pentest

---

### Sprint 3 — Observabilité (2 semaines)

- [ ] Docker + docker-compose
- [ ] OpenAPI / Swagger
- [ ] Prometheus metrics
- [ ] Health checks enrichis
- [ ] Runbooks incident

---

### Sprint 4 — UX / Demo (2 semaines)

- [ ] Graphiques metrics (Recharts)
- [ ] Explorer links (Arc/Base)
- [ ] Real-time SSE timeline
- [ ] Marketplace public listing

---

## 7️⃣ Indicateurs de Succès (OKR)

| Domaine | KPI | Cible | Timeline |
|---------|-----|-------|----------|
| **Fiabilité** | Test coverage `core/` | ≥ 85 % | Sprint 1 |
| **Fiabilité** | Incohérences ledger↔chaîne | 0 / 1000 tx | Sprint 1 |
| **Sécurité** | Vulns high/critical | 0 | Sprint 2 |
| **Perf** | p95 latence `/api/missions` | < 200 ms | Sprint 1 |
| **Perf** | Simulation 1000 tâches | < 60 s | Sprint 1 |
| **UX** | Lighthouse score | ≥ 90 | Sprint 4 |
| **Adoption** | Providers approuvés | ≥ 5 | Ongoing |

---

## 8️⃣ Risques Spécifiques au Modèle Économique

### #1 — Slashing Injuste

**Scénario** : Validateur malveillant slash un worker honnête.

**Mitigation** : 
- Quorum 2-of-3 pour tâches > seuil
- Stake côté validateur + slashing inverse
- Dispute window 24 h

### #2 — Fuite de Valeur (Arrondi)

**Scénario** : Arrondi USDC → valeur créée/détruite.

**Mitigation** : 
- Tests property-based sur pricing invariant
- Audit externe comptable

### #3 — Limite Budgétaire Ignorée

**Scénario** : Tâche coûte plus que budget client.

**Mitigation** : 
- Pre-check budget strict avant paiement
- Refuser task si `balance < pricing.clientPayment`

---

## 9️⃣ Comparaison avec Standards Industrie

| Standard | Arc USDC | Notes |
|----------|----------|-------|
| **OWASP Top 10** | 3/10 | CORS, rate-limit, CSRF manquants |
| **12-Factor App** | 6/10 | Config OK, secrets à fix, logging minimaliste |
| **Twelve-Factor Logs** | 2/10 | Console.log uniquement |
| **Immutability** | 4/10 | Ledger mutable après broadcast |
| **Test Coverage** | 0/10 | Zero automated tests |
| **Type Safety** | 3/10 | JS vanilla, pas TypeScript |

---

## 🔟 Conclusion

### Synthèse

✅ **Strengths**
- Architecture modulaire et lisible
- Fonctionnalité complète vs cahier des charges
- Scalabilité démontrée (50+ tx)
- Wallet provider abstraction bien pensée

⚠️ **Weaknesses**
- Aucun test → risque de régression
- Persistance fragile → corruption sous charge
- Sécurité basique → CORS ouvert, rate-limit absent
- Secrets poten. commitées → risque USDC

### Prochaines Étapes

**Pour une démo gagnante (< 2 semaines)** :
1. Fix `.gitignore` + secrets
2. Ajouter helmet + rate-limit
3. Impl. SettlementBanner (✓ déjà fait)
4. Tests pricing invariant
5. Arrondir les UX issues (graphiques, explorer links)

**Pour production (6-8 semaines)** :
- Respecter le plan 5 sprints (Sprint 0-4) décrit dans `AUDIT_SPRINTS.md`
- Couverture ≥ 85 % sur `core/`
- Zéro vuln critical
- Ledger 100% cohérent avec chaîne

---

## 📋 Checklist de Suivi

- [ ] `.gitignore` racine créée
- [ ] Secrets auditées (`git log --all`)
- [ ] Helmet + CORS appliqués
- [ ] Tests pricing (1 test)
- [ ] SettlementBanner visible
- [ ] Rate-limit sur `/api/missions`
- [ ] Logging structuré (Pino)
- [ ] WalletProvider 2-phase commit
- [ ] TaskEngine persistance
- [ ] CI/CD GitHub Actions
- [ ] Docker + compose
- [ ] OpenAPI / Swagger
- [ ] Pentest OWASP Top 10

---

**Questions / Clarifications** : Consulter `AUDIT_SPRINTS.md` pour le plan sprint détaillé.
