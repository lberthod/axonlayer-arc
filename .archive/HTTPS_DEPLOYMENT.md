# 🔒 Déploiement Complet avec HTTPS

Voici le processus complet pour déployer votre application avec HTTPS.

## 📋 Récapitulatif des Changements

### Backend
- ✅ `backend/setup-https.sh` - Script pour générer les certificats et configurer HTTPS
- ✅ `backend/src/server.js` - Support HTTPS déjà implémenté
- ✅ `backend/src/config.js` - CORS configuré pour HTTPS et Firebase Hosting

### Frontend
- ✅ `frontend/.env.production` - Mis à jour pour utiliser HTTPS (https://72.61.108.21:3001)
- ✅ `frontend/firebase.json` - Simplifié (pas de Cloud Functions pour éviter les problèmes de permissions)
- ✅ `frontend/src/services/api.js` - Client API avec support Bearer token

---

## 🚀 Étapes de Déploiement

### Phase 1: Backend - Activation HTTPS (5 minutes)

**Sur votre serveur local ou VPS:**

```bash
# 1. Allez dans le dossier backend
cd backend

# 2. Exécutez le script de configuration HTTPS
./setup-https.sh

# Suivez les instructions:
# - Pour "Common Name", entrez: 72.61.108.21 (ou votre IP)
# - Appuyez sur Entrée pour les autres champs
# - Le script génère les certificats et met à jour .env
```

**Vérifiez la configuration:**
```bash
# Vérifiez que les fichiers existent
ls -la key.pem cert.pem

# Vérifiez .env
grep -E "HTTPS_ENABLED|HTTPS_KEY_PATH|HTTPS_CERT_PATH|CORS_ORIGINS" .env
```

**Redémarrez le backend:**
```bash
# Option 1: npm
npm run dev
# ou: npm start

# Option 2: node directement
node src/server.js

# Vous devriez voir:
# Server running on https://localhost:3001
# 🔒 HTTPS enabled (cert: ./cert.pem)
```

### Phase 2: Frontend - Reconfiguration

**Vérifiez la configuration:**
```bash
cat frontend/.env.production
# Doit avoir: VITE_API_BASE_URL=https://72.61.108.21:3001
```

### Phase 3: Frontend - Build et Déploiement (3 minutes)

```bash
cd frontend

# Build
npm run build
# ✓ built in X.XXs

# Deploy
firebase deploy --only hosting
# ✔  hosting[axonlayer]: file upload complete
# ✔  hosting[axonlayer]: release complete
```

---

## ✅ Vérification du Déploiement

### 1. Backend HTTPS
```bash
# Test avec certificat auto-signé (flag -k pour ignorer l'avertissement)
curl -k https://72.61.108.21:3001/api/health

# Résultat attendu:
# {"status":"ok","message":"API Proxy is running",...}
```

### 2. Frontend
```bash
# Test du health endpoint (via Firebase Hosting)
curl https://axonlayer.web.app/api/health

# Résultat attendu:
# {"status":"ok",...}
```

### 3. Dans le Navigateur
1. Allez à: https://axonlayer.web.app
2. Ouvrez DevTools (F12)
3. Onglet Console
4. Onglet Network
5. Rechargez (Ctrl+R)
6. ✅ Pas d'erreurs réseau
7. ✅ Les requêtes `/api/*` retournent 200
8. ✅ Pas de messages d'erreur

---

## 📊 Vérification des Endpoints

```bash
# 1. Health check
curl -k https://72.61.108.21:3001/api/health

# 2. Config
curl -k https://72.61.108.21:3001/api/config

# 3. Auth (nécessite Firebase token)
curl -k -H "Authorization: Bearer <token>" https://72.61.108.21:3001/api/auth/me
```

---

## ⚠️ Informations Importantes

### Certificats Auto-Signés
- ✅ Parfaits pour le développement/test
- ✅ Pas de coût
- ❌ Les navigateurs affichent un avertissement
- ❌ À éviter en production avec utilisateurs réels

### Pour la Production Réelle
Installer Let's Encrypt (sur le VPS):
```bash
# Ubuntu/Debian
sudo apt-get install certbot

# Générer le certificat
sudo certbot certonly --standalone -d votre-domaine.com

# Configurer dans .env
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/etc/letsencrypt/live/votre-domaine.com/privkey.pem
HTTPS_CERT_PATH=/etc/letsencrypt/live/votre-domaine.com/fullchain.pem
```

### Sécurité CORS
La configuration accepte:
```
http://localhost:3000
http://localhost:5173
https://72.61.108.21
http://72.61.108.21:3001
https://axonlayer.web.app
```

Vous pouvez restreindre en éditant `backend/src/config.js`.

---

## 🔄 Mise à Jour en Cas de Changements

### Backend
```bash
cd backend
npm run dev
# Redémarre automatiquement avec nodemon
```

### Frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
# Déploiement rapide (quelques secondes)
```

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| "Address already in use" | `kill $(lsof -t -i:3001)` |
| "Permission denied" sur key.pem | `chmod 600 key.pem` |
| Certificat expiré | Relancer `backend/setup-https.sh` |
| "Mixed content" errors | Vérifiez que l'URL est en HTTPS |
| 404 sur `/api/*` | Vérifiez que le backend est en cours d'exécution |
| CORS errors | Vérifiez CORS_ORIGINS dans `backend/src/config.js` |

---

## 📱 Tester depuis le Navigateur

**Console DevTools:**
```javascript
// Test health endpoint
fetch('https://axonlayer.web.app/api/health')
  .then(r => r.json())
  .then(console.log)

// Résultat:
// {status: 'ok', message: 'API Proxy is running', ...}
```

---

## 🎉 Félicitations!

Votre application est maintenant deployée avec:
- ✅ HTTPS sur le backend
- ✅ Frontend sur Firebase Hosting
- ✅ API sécurisée avec CORS
- ✅ Authentification Firebase
- ✅ Support complet des migrations

Prêt pour la production! 🚀
