# 🚀 Axonlayer - Developer Onboarding (v0.0.1)

## Contexte Actuel

**Status:** Production avec test sur VPS  
**Version:** 0.0.1  
**Architecture:** Frontend (Firebase) + Backend (VPS) + CloudFlare Tunnel

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Vue3 + Vite)                    │
│              Deployed on Firebase Hosting                   │
│          https://axonlayer.web.app (v0.0.1)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTPS (CORS OK)
                         │
┌────────────────────────▼────────────────────────────────────┐
│          CloudFlare Tunnel (Quick Tunnel Mode)              │
│   https://wool-alternatives-com-intention.trycloudflare.com │
│          (Auto-CORS handling, HTTPS proxy)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP (internal)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Backend (Node.js)                         │
│              Running on VPS (Hostinger)                     │
│        IP: 72.61.108.21 | Port: 3100 (localhost)           │
│          SSH: root@srv1126284.hstgr.cloud                   │
│   • Express + Helmet + CORS + Rate Limiting                 │
│   • Firebase Admin Auth (credentials stored on VPS)         │
│   • Arc Blockchain Integration                              │
│   • PM2 Process Manager                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Stack Actuel

### Frontend
- **Framework:** Vue 3 + Vite
- **Styling:** Tailwind CSS
- **Deployment:** Firebase Hosting (auto-build on push)
- **Auth:** Firebase Authentication
- **Version:** 0.0.1 (visible en bas du site)

### Backend
- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Auth:** Firebase Admin SDK
- **Blockchain:** Ethers.js (Arc Network)
- **Monitoring:** Pino logging, Prometheus metrics
- **Process Manager:** PM2
- **Tunneling:** CloudFlare Tunnel (quick tunnel mode)

### Infrastructure
- **VPS:** Hostinger (Ubuntu 24.04 LTS)
- **Domain:** srv1126284.hstgr.cloud
- **Tunnel:** CloudFlare Tunnel (auto-CORS, no ngrok issues)
- **CI/CD:** GitHub Actions (ready but not configured yet)

---

## 🔧 Comment Ça Marche

### 1. **Développement Local**
```bash
# Frontend
cd frontend
npm run dev  # Vite dev server sur http://localhost:5173

# Backend
cd backend
npm run dev  # Node watch mode sur http://localhost:3100
```

### 2. **Déploiement Frontend**
```bash
cd frontend
npm run build
firebase deploy --only hosting
# 🎉 Auto-live sur https://axonlayer.web.app
```

### 3. **Déploiement Backend (VPS)**
```bash
# Sur ta machine locale:
git push origin main

# Sur le VPS (SSH):
cd /root/arcagenthub
git pull origin main
cd backend
npm install
pm2 restart arc-backend
# ou voir les logs: pm2 logs arc-backend
```

### 4. **CloudFlare Tunnel (Running sur VPS)**
```bash
# Le tunnel est lancé en background avec nohup:
nohup cloudflared tunnel --url http://localhost:3100 > cloudflared.log 2>&1 &

# Voir la URL du tunnel:
tail cloudflared.log | grep "trycloudflare"

# Si besoin de relancer:
pkill -9 cloudflared
nohup cloudflared tunnel --url http://localhost:3100 > cloudflared.log 2>&1 &
```

---

## 🔐 Configuration Requise

### Sur VPS (`/root/arcagenthub/backend/`)
**REQUIS** (sinon `/api/auth/me` retourne 503):
- ✅ `firebase-service-account.json` - Credentials Firebase (à télécharger depuis Firebase Console)
  - Settings → Service Accounts → Generate Private Key → Télécharger JSON
  - SCP vers VPS: `scp ./firebase-key.json root@72.61.108.21:/root/arcagenthub/backend/firebase-service-account.json`

**ENV Variables** (`.env` ou `--env-file-if-exists`):
```
HTTPS_ENABLED=false        # Cloud tunnel gère HTTPS
PORT=3100
NODE_ENV=production
```

### Localement (`frontend/.env.production`)
```
VITE_API_BASE_URL=https://wool-alternatives-com-intention.trycloudflare.com
VITE_ENVIRONMENT=production
VITE_ONCHAIN_ENABLED=true
VITE_WALLET_PROVIDER=onchain
```

---

## 📊 Statut Actuel - Qu'est-ce qui Fonctionne

| Feature | Status | Notes |
|---------|--------|-------|
| Frontend Deploy | ✅ | Firebase Hosting, auto-build on push |
| Backend API | ✅ | Express sur port 3100, PM2 managed |
| CORS | ✅ | CloudFlare Tunnel handles it (no ngrok issues!) |
| Firebase Auth | ✅ | Credentials stored on VPS |
| Blockchain (Arc) | ✅ | Testnet integration ready |
| Rate Limiting | ✅ | Express rate-limit configured |
| Logging | ✅ | Pino + Prometheus metrics |
| Version Display | ✅ | Visible en bas du footer (v0.0.1) |

---

## 🚨 Important - À Savoir

### ⚠️ CloudFlare Tunnel Limitations
- **Quick Tunnel Mode:** URL change chaque redémarrage de `cloudflared`
  - Solution: Sauvegarde l'URL dans `frontend/.env.production`
  - Mets à jour + rebuild + deploy après chaque restart tunnel
- **No Uptime Guarantee:** Gratuit, peut avoir des interruptions
  - Solution: Upgrade vers CloudFlare Paid ou utiliser un domaine custom

### 🔄 Workflow de Déploiement
1. **Dev local** → `git push origin main`
2. **Frontend auto-déploie** sur Firebase Hosting (voir Actions)
3. **Backend:** SSH sur VPS, `git pull` + `pm2 restart arc-backend`
4. **Tunnel:** Relancer si URL change (rare)

---

## 📝 Prochaines Étapes Pour Toi

### Analyser le Code
```bash
# Start here:
1. Lire /backend/src/app.js - Config CORS, routes
2. Lire /backend/src/server.js - Démarrage du serveur
3. Lire /frontend/src/main.js - Point d'entrée Vue
4. Lire /frontend/src/services/api.js - Appels API

# Architecture:
- /backend/src/core/ - Logique métier (auth, blockchain, etc)
- /backend/src/routes/ - Endpoints API
- /frontend/src/components/ - Vue components
- /frontend/src/stores/ - State management (Pinia/Vue store)
```

### Test Local
```bash
# 1. Lance le backend
cd backend && npm run dev

# 2. Dans un autre terminal, lance le frontend
cd frontend && npm run dev

# 3. Ouvre http://localhost:5173

# 4. Teste les API dans la console:
curl http://localhost:3100/api/health
curl http://localhost:3100/api/config
```

### Checklist Onboarding
- [ ] Clone du repo: `git clone https://github.com/lberthod/arcagenthub.git`
- [ ] SSH access au VPS: `ssh root@72.61.108.21` (test)
- [ ] Firebase Console access: https://console.firebase.google.com/project/agenthubarc
- [ ] Lire ce fichier (ONBOARDING.md) ✅
- [ ] Lancer le projet en local (npm run dev)
- [ ] Tester une API call (curl ou dev tools)
- [ ] Lire ARCHITECTURE.md pour la structure détaillée
- [ ] Poser des questions sur le code dans les comments

---

## 🆘 Troubleshooting Rapide

### API retourne 503
**Cause:** Firebase not initialized  
**Solution:** Vérifier `firebase-service-account.json` existe sur VPS

### CORS errors dans le navigateur
**Cause:** CloudFlare Tunnel URL changée  
**Solution:** Update `frontend/.env.production` + rebuild + firebase deploy

### PM2 error "Process not found"
**Cause:** Backend non lancé sur le VPS  
**Solution:** `cd /root/arcagenthub/backend && npm start`

### CloudFlare Tunnel 503 errors
**Cause:** Backend down ou tunnel pas connecté  
**Solution:** 
```bash
ssh root@72.61.108.21
ps aux | grep cloudflared   # Vérifier si tourne
ps aux | grep node          # Vérifier backend
```

---

## 📚 Fichiers Clés à Connaître

```
arcagenthub/
├── README.md                          # Vue d'ensemble projet
├── ARCHITECTURE.md                    # Architecture détaillée
├── SECURITY.md                        # Sécurité
├── frontend/
│   ├── .env.production               # API URL (à jour: CloudFlare Tunnel)
│   ├── package.json                  # v0.0.1
│   ├── src/
│   │   ├── App.vue                   # Composant racine
│   │   ├── main.js                   # Entry point
│   │   ├── services/api.js           # API calls (utilise VITE_API_BASE_URL)
│   │   ├── components/PublicFooter.vue  # Version display ✨
│   │   └── stores/                   # State management
│   └── dist/                         # Build output (Firebase deploy)
├── backend/
│   ├── package.json                  # v0.0.1
│   ├── firebase-service-account.json # REQUIS (not in git, SCP from local)
│   ├── src/
│   │   ├── server.js                 # HTTP server
│   │   ├── app.js                    # Express config + CORS
│   │   ├── config.js                 # Configuration
│   │   ├── routes/                   # API endpoints
│   │   └── core/                     # Business logic
│   └── .env                          # Variables (PORT, etc)
└── .archive/                         # Old docs (not needed)
```

---

## 🎯 Objectif de Cette Config

**Le projet est maintenant en PRODUCTION TESTING:**
- ✅ Frontend stable sur Firebase
- ✅ Backend testable sur VPS
- ✅ CORS résolu avec CloudFlare Tunnel (pas de ngrok!)
- ✅ Version tracking (0.0.1)
- ✅ Easy to update (git push + firebase deploy + ssh pull)

**Prochaine phase:** Aller de "quick tunnel" à un domaine custom + orchestration automatisée.

---

**Questions?** Pose-les dans les comments du code ou ouvre une issue GitHub.  
**Besoin d'aide?** Vérifie Troubleshooting ou demande en SSH.

🚀 Happy coding!
