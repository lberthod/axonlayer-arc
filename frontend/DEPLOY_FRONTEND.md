# Déploiement Frontend avec Cloud Functions Proxy

Votre projet Firebase est dans le dossier `frontend/`, pas à la racine. Voici comment déployer correctement:

## 📋 Checklist Pré-déploiement

### 1. Vérifier le Backend
```bash
# Remplacez l'IP/port par votre configuration réelle
curl http://72.61.108.21:3001/api/health

# Doit retourner: {"status":"..."}
```

Si ça échoue, ajustez l'IP/port dans `frontend/functions/index.js` ligne 7:
```javascript
const BACKEND_URL = process.env.BACKEND_URL || 'http://72.61.108.21:3001';
// ↑ Changez cette URL
```

### 2. Installer les dépendances Cloud Functions
```bash
cd frontend/functions
npm install
cd ../..
```

### 3. Vérifier la configuration Firebase
```bash
cd frontend
cat .firebaserc
# Devrait afficher: "projects": { "default": "axonlayer" }
```

## 🚀 Déploiement

**Depuis le dossier `frontend/`:**

```bash
cd frontend

# Build
npm run build

# Deploy (incluant Cloud Functions)
firebase deploy

# OU seulement les functions (rapide)
firebase deploy --only functions
```

## ✅ Vérification Post-déploiement

### 1. Vérifier les Cloud Functions
```bash
firebase functions:log
```

Vous devriez voir:
```
[Proxy] GET /api/health -> http://72.61.108.21:3001/api/health
[Proxy] GET /api/config -> http://72.61.108.21:3001/api/config
```

### 2. Tester les endpoints
```bash
# Depuis le terminal
curl https://axonlayer.web.app/api/health

# Ou depuis la console du navigateur
fetch('https://axonlayer.web.app/api/health').then(r => r.json()).then(console.log)
```

### 3. Tester dans le navigateur
1. Allez à https://axonlayer.web.app
2. Ouvrez DevTools (F12)
3. Onglet Network
4. Rechargez la page
5. Cherchez les requêtes `/api/*`
6. Elles doivent retourner 200 (pas 404)

## 🔧 Structure des Fichiers

```
frontend/
  ├── firebase.json          ← Config Firebase (modifiée)
  ├── .firebaserc            ← Project ID
  ├── dist/                  ← Build output
  ├── src/
  │   ├── services/api.js    ← Client API (modifié)
  │   └── ...
  ├── functions/             ← NEW Cloud Functions
  │   ├── package.json       ← Dépendances
  │   └── index.js           ← Proxy implementation
  └── package.json
```

## 📝 Configuration .env.production

Vérifiez que `frontend/.env.production` a:
```
VITE_API_BASE_URL=/api
```

Cela fait que les requêtes vont à `/api/*` qui est routé vers la Cloud Function.

## 🐛 Dépannage

### "Cannot find module" lors du déploiement
```bash
cd frontend/functions
npm install
cd ../..
firebase deploy
```

### Cloud Functions timeout (plus de 60s)
1. Vérifiez que le backend répond rapidement
2. Augmentez le timeout dans `frontend/functions/index.js` ou dans la config Firebase

### Toujours 404 après déploiement
1. Attendez 2-3 minutes (propagation)
2. Videz le cache navigateur (Ctrl+Shift+Delete)
3. Vérifiez les logs: `firebase functions:log`
4. Vérifiez que le backend est accessible: `curl http://72.61.108.21:3001/api/health`

### Backend connection refused
1. Vérifiez l'IP/port dans `frontend/functions/index.js`
2. Assurez-vous que le backend VPS est en cours d'exécution
3. Vérifiez les pare-feu

## 🔐 Variables d'environnement

Si vous voulez utiliser une variable d'environnement au lieu de modifier le code:

```bash
# Dans le dossier frontend/functions/
export BACKEND_URL="http://72.61.108.21:3001"
firebase deploy --only functions

# Ou créer un .env.local (non committé)
echo "BACKEND_URL=http://72.61.108.21:3001" > .env.local
```

## ✨ Résultat attendu

Après déploiement réussi:
- ✅ Pas d'erreur 404 sur `/api/*`
- ✅ Les requêtes sont proxifiées vers le backend
- ✅ L'authentification fonctionne
- ✅ Les données se chargent correctement

Bonne chance! 🎉
