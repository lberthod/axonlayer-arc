Parfait — on va transformer ça en **plan d’exécution propre type PR (GitHub-ready)** avec des **sous-étapes claires, atomiques, exécutables**.

👉 Objectif :
**passer de MVP solide → démo gagnante jury en 1–2 sessions**

---

# 🧾 PR GLOBAL

## **PR-10: Final Demo Polish — ArcAgent Hub**

---

# 🧩 PR-10.1 — 🔥 Kill the “double world”

## 🎯 Objectif

Supprimer toute confusion entre :

* ancien modèle (task / marketplace)
* nouveau modèle (mission / execution)

---

## ✅ Tasks

### 1. Remove legacy routes

* [ ] supprimer route `/marketplace`
* [ ] supprimer route `/dashboard` (ancienne)
* [ ] rediriger vers `/mission`

---

### 2. Deprecate legacy views

* [ ] renommer `DashboardView.vue` → `LegacyDashboardView.vue`
* [ ] ne plus l’importer dans router
* [ ] commenter header si nécessaire

---

### 3. Remove task naming in UI

* [ ] remplacer tous les labels visibles :

  * `task` → `mission`
* [ ] vérifier :

  * `TaskForm`
  * `TaskResult`
  * `ExecutionTimeline`
* [ ] s’assurer que le user ne voit jamais “task”

---

### 4. Clean imports

* [ ] supprimer imports inutilisés liés aux anciens composants
* [ ] vérifier console warnings Vue

---

👉 ✅ Résultat attendu
Produit = **100% cohérent**
Zéro confusion

---

# 🧩 PR-10.2 — 💥 Hero Banner (impact immédiat)

## 🎯 Objectif

Faire comprendre le projet en 3 secondes

---

## ✅ Tasks

### 1. Ajouter HeroBanner.vue

```vue
<div class="hero">
  <h1>You don’t use APIs.</h1>
  <h1>You fund a mission.</h1>

  <p>
    ArcAgent Hub privately executes it using decentralized agents.
  </p>
</div>
```

---

### 2. Ajouter en haut de MissionControlView

* [ ] import HeroBanner
* [ ] placer AVANT MissionForm

---

### 3. Styling minimal

* [ ] centré
* [ ] bold
* [ ] spacing clean

---

👉 ✅ Résultat attendu
👉 💀 “wow immédiat”

---

# 🧩 PR-10.3 — 🔒 Private Agents VISUAL

## 🎯 Objectif

Rendre ton différenciateur VISIBLE

---

## ✅ Tasks

### 1. Modifier AgentsPanel.vue

Ajouter badge :

```text
PRIVATE AGENT
Hosted externally
Not publicly accessible
Used by orchestrator only
```

---

### 2. Ajouter badge visuel

* [ ] couleur : violet / sombre
* [ ] icône lock 🔒
* [ ] petit texte explicatif

---

### 3. Ajouter “owner”

```text
Owner: External Developer
```

---

👉 ✅ Résultat attendu
👉 Jury comprend :
**ce n’est PAS une marketplace**

---

# 🧩 PR-10.4 — 💰 Live Economic HUD

## 🎯 Objectif

Montrer l’économie en temps réel

---

## ✅ Tasks

### 1. Créer component `MissionBudgetBar.vue`

Affichage :

```text
Budget: 0.050 USDC
Spent: 0.006 USDC
Remaining: 0.044 USDC
```

---

### 2. Ajouter dans MissionControlView

* [ ] au-dessus de la timeline
* [ ] toujours visible

---

### 3. Ajouter progression visuelle

* [ ] progress bar (spent vs total)
* [ ] couleur dynamique

---

👉 ✅ Résultat attendu
👉 compréhension instantanée du modèle

---

# 🧩 PR-10.5 — 🔁 Step-by-step Payments

## 🎯 Objectif

Rendre visible la machine économique

---

## ✅ Tasks

### 1. Modifier ExecutionTimeline.vue

Ajouter étape type :

```text
→ Selecting agent
→ Sending USDC payment
→ Transaction confirmed
→ Executing API
→ Result received
```

---

### 2. Ajouter tx info

* [ ] tx hash
* [ ] amount
* [ ] status

---

### 3. Badge Arc

```text
Settled on Arc
```

---

👉 ✅ Résultat attendu
👉 💀 preuve “agent economy”

---

# 🧩 PR-10.6 — 👥 Agents Involved

## 🎯 Objectif

Montrer réseau décentralisé réel

---

## ✅ Tasks

### 1. Ajouter bloc dans MissionResult.vue

```text
Agents used: 3
Owners: 2 different developers
Execution: fully automated
```

---

### 2. Lier aux données backend

* [ ] utiliser `selectedWorker`
* [ ] utiliser `selectedValidator`

---

👉 ✅ Résultat attendu
👉 preuve network effect

---

# 🧩 PR-10.7 — ⚡ Gas vs Arc Comparison

## 🎯 Objectif

Répondre au brief DIRECTEMENT

---

## ✅ Tasks

### 1. Ajouter component `CostComparison.vue`

```text
Traditional gas: > $0.02 ❌
Arc: $0.001 ✅
```

---

### 2. Ajouter sous metrics panel

---

👉 ✅ Résultat attendu
👉 jury comprend pourquoi Arc est utile

---

# 🧩 PR-10.8 — 📊 Batch Simulation Proof

## 🎯 Objectif

Valider 50+ transactions

---

## ✅ Tasks

### 1. Modifier SimulationPanel.vue

Afficher :

```text
Missions simulated: 25
Transactions: 75
Avg cost per action: 0.002 USDC
```

---

### 2. Bouton visible

* [ ] “Run batch simulation”

---

👉 ✅ Résultat attendu
👉 preuve scalabilité

---

# 🧩 PR-10.9 — 🧠 Kill agent-first thinking

## 🎯 Objectif

Forcer mental model “mission”

---

## ✅ Tasks

### 1. MissionForm.vue

* [ ] supprimer toute référence agent
* [ ] pas de dropdown agent

---

### 2. Rename labels

* [ ] “Select agent” → supprimer
* [ ] “Execution mode” → “Optimize for”

---

👉 ✅ Résultat attendu
👉 user pense “goal”, pas “tools”

---

# 🧩 PR-10.10 — 🎬 Demo Ready Mode

## 🎯 Objectif

Mode démo clean

---

## ✅ Tasks

### 1. Ajouter flag

```js
DEMO_MODE = true
```

---

### 2. Simplifier UI

* [ ] cacher debug panels inutiles
* [ ] afficher uniquement :

  * mission
  * timeline
  * result
  * tx
  * metrics

---

### 3. Pré-remplir mission

* [ ] example prêt à lancer

---

👉 ✅ Résultat attendu
👉 démo fluide sans friction

---

# 🏁 Résultat final attendu

Après ces PR :

👉 Ton produit devient perçu comme :

> 💥 **Execution Layer for Agent Economy**

et NON :

* marketplace
* API tool
* AI wrapper

---

# 🧠 Checklist finale avant démo

* [ ] 1 mission → 3 agents → 3 paiements
* [ ] budget visible
* [ ] tx visibles
* [ ] agents privés visibles
* [ ] batch simulation
* [ ] résultat clair
* [ ] narration simple

---

# 🚀 Prochaine étape

👉 Maintenant tu es prêt pour :

* 🎬 script vidéo EXACT
* 🎤 pitch oral mot à mot
* 🧠 phrases “jury trigger”

---

👉 Dis-moi :

**on passe au script final + narration qui fait gagner ?**
