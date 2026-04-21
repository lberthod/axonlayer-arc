# Audit & Plan de Sprints — Agent-to-Agent USDC Task Network

_Date de l'audit : 2026-04-19_
_Périmètre : backend Node.js/Express + frontend Vue 3 + intégration Circle Arc._

---

## 1. Synthèse exécutive

Le MVP est **fonctionnellement complet** par rapport au cahier des charges (`consing.md`) et va même au-delà (Phase 2 et 3 implémentées : wallet provider onchain, marketplace, Firebase Auth, LLM worker, dashboards multi-rôles). Le code est modulaire, lisible, et l'architecture respecte la séparation orchestrateur / agents / ledger / payment adapter.

**Cependant**, le projet présente plusieurs **faiblesses bloquantes pour un passage en production** ou une démo live sur mainnet :

- Aucun test automatisé (unitaire ou intégration).
- Persistance fragile (JSON réécrit à chaque transaction, pas de lock, tâches en mémoire perdues au redémarrage).
- Incohérence possible entre ledger interne et chaîne en mode `onchain` (le ledger est muté **avant** la transaction on-chain).
- Sécurité minimale (pas de rate-limit, pas de `helmet`, CORS ouvert, secrets potentiellement commit).
- Artefacts parasites versionnés (`backend/src.zip`, `frontend/src.zip`, `.DS_Store`, pas de `.gitignore` racine visible).
- Pas de CI/CD, pas de Docker, pas d'OpenAPI.
- Observabilité réduite à des `console.log`.

**Score global** : 7/10 pour un MVP de hackathon, 4/10 pour une mise en production.

---

## 2. Inventaire rapide du code

### Backend (`@/Users/berthod/Desktop/arc-USDC1/backend`)
- **Agents** : `baseAgent`, `orchestratorAgent`, `workerAgent`, `validatorAgent`, `translatorAgent`, `classifierAgent`, `sentimentAgent`.
- **Core** : `ledger`, `paymentAdapter`, `walletProvider` (simulated + onchain), `walletManager`, `taskEngine`, `simulationEngine`, `pricingEngine`, `agentRegistry`, `metricsEngine`, `auth`, `userStore`, `providerStore`, `jsonStore`, `llmClient`.
- **Routes** : `tasks`, `balances`, `transactions`, `simulation`, `metrics`, `agents`, `auth`, `providers`, `admin`.

### Frontend (`@/Users/berthod/Desktop/arc-USDC1/frontend`)
- Vues : `DashboardView`, `UserDashboardView`, `ProviderDashboardView`, `AdminDashboardView`, `LoginView`.
- Composants : `TaskForm`, `TaskResult`, `WalletBalances`, `TransactionsTable`, `ExecutionTimeline`, `SimulationPanel`, `AgentsPanel`, `MetricsPanel`, `AppHeader`.
- Stack : Vue 3, Vite, Tailwind, Vue Router, Firebase JS SDK.

---

## 3. Constats détaillés (par criticité)

### 🔴 Critique (bloquant production / démo mainnet)

1. **Incohérence ledger ↔ chaîne**
   `@/Users/berthod/Desktop/arc-USDC1/backend/src/core/walletProvider.js:108-149` — `ledger.createTransaction()` est appelé **avant** la transaction on-chain. Si le broadcast échoue (`onchain-error`), le solde local est déjà débité. Divergence entre ce que voit l'UI et la réalité on-chain.

2. **Aucun test automatisé**
   Zéro fichier `*.test.js` / `*.spec.js` dans le projet. Le moindre refactor est risqué, surtout sur le moteur de pricing (invariant `client = worker + validator + margin`) et le ledger.

3. **Persistance non-atomique et non concurrente**
   `@/Users/berthod/Desktop/arc-USDC1/backend/src/core/ledger.js:29-36` — `fs.writeFile` sur `store.json` à chaque transaction. Sous charge (simulation 50+ tx), on a :
   - pas de lock → écritures concurrentes peuvent corrompre le JSON,
   - O(N) de réécriture du fichier entier,
   - pas d'atomicité (pas de `rename` temporaire).

4. **Tâches en mémoire uniquement**
   `@/Users/berthod/Desktop/arc-USDC1/backend/src/core/taskEngine.js:6` — `new Map()`. Redémarrage = perte de toutes les tâches (historique `/api/tasks/mine`, `getTask` etc.). Incohérent avec un ledger persistant.

5. **Fichiers d'archive commit**
   `@/Users/berthod/Desktop/arc-USDC1/backend/src.zip` et `@/Users/berthod/Desktop/arc-USDC1/frontend/src.zip` traînent dans le repo. Risque : fuite de secrets si `.env` s'y trouve.

6. **Secrets potentiellement versionnés**
   `backend/.env` ouvert dans l'IDE : s'il est committé (pas de `.gitignore` racine confirmé), les clés Firebase / OpenAI / clé privée Arc fuitent. `wallets.json` contient des **clés privées** en clair → risque direct de perte de fonds.

### 🟠 Haut (qualité / sécurité générale)

7. **CORS totalement ouvert**
   `@/Users/berthod/Desktop/arc-USDC1/backend/src/app.js:18` — `app.use(cors())` sans origin allowlist. À restreindre avant prod.

8. **Pas de rate-limit ni helmet**
   Endpoints `POST /api/tasks` et `POST /api/simulate` exploitables en déni de service ou pour vider un wallet.

9. **Validation d'input faible**
   Seulement `length > 5000` et enum de `taskType`. Pas de sanitation anti-prompt-injection (critique avec le LLM worker).

10. **Pas de logger structuré**
    Uniquement `console.log`. Impossible de corréler une requête à ses transactions ledger/on-chain. Prévoir `pino` + un `requestId` middleware.

11. **Pas de gestion d'erreur globale**
    Pas de `app.use((err, ...))` après les routes. Les erreurs non catchées tombent sur le handler Express par défaut.

12. **Pas d'idempotence sur `POST /api/tasks`**
    Un double-click crée deux tâches et deux paiements. Prévoir une clé `Idempotency-Key`.

13. **Mode `dryRun` onchain peu explicite côté UI**
    `@/Users/berthod/Desktop/arc-USDC1/backend/src/app.js:47` renvoie `dryRun` mais aucune bannière front ne le signale visiblement. Risque de confusion en démo.

### 🟡 Moyen (dette technique / DX)

14. **Pas de CI/CD, pas de linter, pas de formatter**
    Pas de `eslint`, `prettier`, `.editorconfig`, ni action GitHub.

15. **Pas de Dockerfile / docker-compose**
    Déploiement actuellement tributaire d'un Node 20 local.

16. **Pas d'OpenAPI / Swagger**
    Documentation uniquement dans le README. Pas d'auto-génération de client pour le frontend.

17. **Arrondi monétaire par `toFixed(6)`**
    `@/Users/berthod/Desktop/arc-USDC1/backend/src/core/ledger.js:38-40` — `Number.toFixed(6)` introduit des erreurs de flottant. Pour USDC, utiliser `BigInt` en "micro-unités" (6 décimales) ou la `bigint` d'ethers.

18. **Registry et providers chargés en dur au démarrage**
    Un admin qui approve un provider n'est pas réflété sans `hydrateFromProviders` re-déclenché à chaque changement — à vérifier, peut causer un décalage de sélection d'agents.

19. **Pas de pagination sur `/api/transactions`**
    En simulation massive, la réponse peut devenir lourde. Ajouter `limit`/`cursor`.

20. **Composants Vue sans tests, pas de store global**
    Le state est géré par vues individuelles + un `stores/` quasi-vide. Prévoir Pinia si le périmètre grossit.

### 🟢 Faible (polish)

21. **`.DS_Store` committé** (macOS noise).
22. **README très long** : scinder en `docs/` (installation, architecture, arc, phases).
23. **Pas de favicon / branding produit.**
24. **Pas d'internationalisation** (FR/EN mixés dans l'UI et les commentaires).
25. **`consing.md`** : typo du titre (devrait être `consigne.md`).

---

## 4. Risques économiques spécifiques au modèle A2A

- **Invariant pricing non testé** : `clientPayment = workerPayment + validatorPayment + orchestratorMargin`. Un bug d'arrondi = fuite ou création de valeur. ➜ test property-based obligatoire.
- **Slashing automatique sur `validation.valid === false`** : un validateur défaillant peut slasher à tort un worker honnête. Prévoir un mécanisme d'arbitrage (double validation, quorum, stake côté validateur).
- **Pas de limite de dépense par tâche** : un input de 5000 caractères en profil `standard` × multiplier `translate=1.5` peut dépasser le solde client sans pre-check explicite.
- **Quota utilisateur en mémoire** (`userStore`) : reset du jour possible si le process redémarre selon l'implémentation.

---

## 5. Plan de Sprints (2 semaines chacun)

### 🏁 Sprint 0 — Hygiène du repo (3 jours, pré-sprint)

**Objectif** : rendre le projet safe à cloner/démo.

- [ ] Créer un `.gitignore` racine (node_modules, .env, .DS_Store, wallets.json, *.zip).
- [ ] Supprimer `backend/src.zip`, `frontend/src.zip`, `.DS_Store`.
- [ ] Vérifier que `backend/.env` et `backend/firebase-service-account.json` ne sont pas dans git (`git log -- <path>`). Si oui : rotate les clés + `git filter-repo`.
- [ ] Ajouter `SECURITY.md` + section "Do not commit secrets" dans le README.
- [ ] Ajouter ESLint + Prettier + `.editorconfig`.

**DoD** : `git status` propre, `npm run lint` passe côté backend et frontend.

---

### Sprint 1 — Fiabilité & Tests (2 semaines)

**Objectif** : sécuriser les invariants économiques et la persistance.

**User stories**
- En tant que dev, je veux des tests automatisés pour ne pas casser le ledger au prochain refactor.
- En tant qu'orchestrateur, je veux que mon ledger reste cohérent sous 100+ tx parallèles.
- En tant qu'opérateur onchain, je veux que le ledger reflète la réalité de la chaîne.

**Tâches**
1. Ajouter Vitest + tests unitaires sur :
   - `pricingEngine` (invariant `client = worker + validator + margin`, bornes min/max, profils standard/nano/micro).
   - `ledger` (insufficient balance, double-spend, concurrence).
   - `agentRegistry` (sélection `price`, `score`, `score_price`).
   - `simulationEngine` (50 tx génèrent bien ≥100 transactions).
2. Tests d'intégration Supertest : `POST /api/tasks`, `/api/simulate`, `/api/metrics`.
3. Refactor `ledger.save()` → écriture atomique via `write + rename` + `async-mutex`.
4. Migrer `taskEngine` vers persistance disque (ajouter `tasks.json` via `jsonStore`).
5. **Fix critique walletProvider onchain** : appeler la chaîne **d'abord** (ou en deux phases `pending → completed`), puis muter le ledger sur succès ; sur erreur, état `failed` explicite au lieu de `onchain-error` silencieux.
6. Passer les montants internes à `BigInt` micro-USDC (conversion à la frontière uniquement).
7. CI GitHub Actions : `lint + test` sur chaque PR.

**DoD** : couverture ≥70 % sur `core/`, CI verte, simulation 200 tâches stable.

---

### Sprint 2 — Sécurité & Multi-tenant robuste (2 semaines)

**Objectif** : rendre l'API défendable face à un trafic externe.

**Tâches**
1. `helmet` + CORS allowlist configurable par env.
2. `express-rate-limit` sur `/api/tasks`, `/api/simulate`, `/api/auth/*`.
3. Middleware `pino-http` + `requestId` propagé dans le ledger (`tx.requestId`).
4. Handler d'erreur global + format d'erreur standardisé `{ error: { code, message, requestId } }`.
5. Idempotency-Key header sur `POST /api/tasks`.
6. Validation stricte via `zod` sur tous les body/query (remplacer les `typeof` manuels).
7. Chiffrer `wallets.json` au repos (passphrase + scrypt) ou migrer vers un KMS (dev: `age`, prod: AWS KMS/GCP KMS).
8. Rotation d'API key forcée après 90 j + révocation côté admin.
9. Pre-check budgétaire : refuser une tâche si `client_wallet.balance < pricing.clientPayment` avant toute écriture.

**DoD** : `npm audit` niveau high = 0, pentest interne OWASP Top 10 documenté.

---

### Sprint 3 — Observabilité & Production readiness (2 semaines)

**Objectif** : rendre le service opérable.

**Tâches**
1. Dockerfile backend + frontend (multi-stage, image distroless).
2. `docker-compose.yml` dev (backend + frontend + volumes pour `data/`).
3. OpenAPI 3.1 générée depuis les schémas `zod` + UI Swagger sur `/api/docs`.
4. Endpoint `/api/metrics` format Prometheus (en plus du JSON existant).
5. Traces OpenTelemetry optionnelles (`OTEL_EXPORTER_OTLP_ENDPOINT`).
6. Healthcheck enrichi : RPC onchain reachable, ledger writable, firebase OK.
7. Scripts `wallets:backup` et `wallets:restore` chiffrés.
8. Documentation runbook : incident "onchain tx failed", "ledger corrupt", "provider slashé à tort".

**DoD** : `docker compose up` démarre la stack complète, Swagger accessible, dashboard Grafana de démo fourni (JSON exporté).

---

### Sprint 4 — UX & Démo produit (2 semaines)

**Objectif** : valoriser le produit lors des pitchs / démos investisseurs.

**Tâches**
1. Bannière claire **DRY-RUN / LIVE / SIMULATED** en haut du dashboard selon `settlementMode`.
2. Timeline d'exécution animée en temps réel (SSE ou WebSocket sur `/api/tasks/:id/stream`).
3. Lien "voir sur l'explorer" (`explorer` du preset réseau) pour chaque tx `onchain`.
4. Graphiques métriques : volume/min, marge cumulée, répartition par type de tâche (Recharts/ECharts).
5. Store Pinia + loading states cohérents.
6. i18n (`vue-i18n`) FR/EN.
7. Mode démo "1 clic" : bouton qui lance 50 tâches + défile la timeline.
8. Page publique `/marketplace` : catalogue des agents approuvés avec prix/score/latence.

**DoD** : parcours démo complet en <3 min sans erreur, Lighthouse ≥90 partout.

---

### Sprint 5 — Arbitrage & Décentralisation des validateurs (2 semaines)

**Objectif** : durcir le modèle économique contre les validateurs malveillants.

**Tâches**
1. Quorum de validation : 2-of-3 validateurs pour tâches > seuil USDC.
2. Stake côté validateur + slashing si minorité face au quorum.
3. Système de challenge : un provider slashé peut ouvrir un dispute (fenêtre 24 h).
4. Historique réputation EMA exposé publiquement (`/api/agents/:id/history`).
5. Signature ECDSA des résultats par le worker (traçabilité forte des livrables).
6. Export CSV comptable (`/api/admin/ledger.csv`) pour audit externe.

**DoD** : scénario test "validateur menteur" → sa stake est bien réduite, worker honnête indemnisé.

---

## 6. Quick wins (faisables en < 1 journée)

Classés par ROI :

1. Ajouter `.gitignore` + supprimer les `*.zip` et `.DS_Store`. _(15 min)_
2. `helmet` + rate-limit sur `/api/simulate`. _(30 min)_
3. Wrapper global `try/catch` → format d'erreur unifié. _(1 h)_
4. Bannière `settlementMode` dans `AppHeader.vue`. _(30 min)_
5. Ajouter un test Vitest sur l'invariant de pricing. _(1 h)_
6. `pino` + `requestId`. _(2 h)_
7. Badge "onchain" avec lien explorer dans `TransactionsTable.vue`. _(1 h)_

---

## 7. Backlog long-terme (post-Sprint 5)

- Passage SQLite → Postgres managé (Neon / Supabase) pour tasks + ledger miroir.
- Agent discovery décentralisé (ENS / on-chain registry).
- SDK client JavaScript publié sur npm (`@arc-usdc/client`).
- Webhook sortant : notifier le client quand une tâche est complétée.
- Mode "batch settlement" : agréger N paiements worker en une seule tx on-chain pour diviser les frais.
- Support multi-chain simultané (Arc + Base) avec routage selon le coût de gas.
- Marketplace reverse-auction : le client publie un prix max, les workers enchèrent à la baisse.

---

## 8. Indicateurs de succès (OKR proposés sur 6 mois)

| Domaine | KPI | Cible |
|--------|-----|-------|
| Fiabilité | Couverture de tests `core/` | ≥ 85 % |
| Fiabilité | Incohérences ledger ↔ chaîne | 0 sur 1 000 tx |
| Sécu | Vulns `high`/`critical` en prod | 0 |
| Performance | p95 latence `POST /api/tasks` (simulé) | < 150 ms |
| Performance | Simulation 1 000 tâches | < 30 s |
| Adoption | Providers approuvés actifs | ≥ 10 |
| Economie | Marge orchestrateur / volume brut | ≥ 30 % |

---

## 9. Résumé des fichiers à créer/modifier en priorité

- Créer : `.gitignore`, `backend/tests/*.test.js`, `SECURITY.md`, `.github/workflows/ci.yml`, `Dockerfile` (x2), `docker-compose.yml`.
- Modifier en priorité 🔴 :
  - `@/Users/berthod/Desktop/arc-USDC1/backend/src/core/ledger.js` (atomicité, BigInt).
  - `@/Users/berthod/Desktop/arc-USDC1/backend/src/core/walletProvider.js` (ordre ledger/chaîne).
  - `@/Users/berthod/Desktop/arc-USDC1/backend/src/core/taskEngine.js` (persistance).
  - `@/Users/berthod/Desktop/arc-USDC1/backend/src/app.js` (helmet, rate-limit, error handler, CORS allowlist).
- Supprimer : `backend/src.zip`, `frontend/src.zip`, tous les `.DS_Store`.
