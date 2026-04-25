# ⚡ Commandes Essentielles du Backend

## 🚀 Démarrage

### Première Fois (Setup HTTPS)
```bash
cd backend
./setup-https.sh    # Génère les certificats
./restart.sh        # Démarre le serveur
```

### Redémarrage Normal
```bash
cd backend
./restart.sh        # Mode dev avec hot reload
```

ou

```bash
cd backend
./restart.sh prod   # Mode production stable
```

### Sans le Script
```bash
cd backend
npm run dev         # Développement
npm start           # Production
```

---

## 🛑 Arrêt

### Dans le Terminal
```bash
# Appuyez sur Ctrl+C
# Ou Cmd+C sur Mac
```

### Arrêter un Processus en Arrière-Plan
```bash
# Voir les processus
lsof -i :3001

# Arrêter (remplacez 12345 par le PID)
kill -TERM 12345

# Force stop
kill -KILL 12345

# Ou avec killall
killall node
```

---

## 🔍 Vérification

### Endpoint Health
```bash
curl -k https://72.61.108.21:3001/api/health
```

### Liste des Processus
```bash
# Port 3001
lsof -i :3001

# Tous les node processes
ps aux | grep node
```

### Configuration HTTPS
```bash
# Vérifier .env
grep -E "HTTPS|PORT|CORS" backend/.env

# Vérifier les certificats
ls -la backend/*.pem
```

---

## 📦 Dépendances

### Installation
```bash
cd backend
npm install
```

### Vérifier les Versions
```bash
npm list
npm list --depth=0
```

### Audit de Sécurité
```bash
npm audit          # Voir les problèmes
npm audit fix      # Corriger les problèmes
```

---

## 🧪 Tests

### Exécuter les Tests
```bash
cd backend
npm test           # Tests une seule fois
npm run test:watch # Watch mode
npm run test:coverage # Avec coverage
```

---

## 🎨 Code Quality

### Linting
```bash
npm run lint       # Vérifier les erreurs
```

### Formatage
```bash
npm run format     # Formater le code
```

---

## 💰 Wallets

### Générer des Wallets
```bash
cd backend
npm run wallets:generate
```

### Vérifier les Balances
```bash
cd backend
npm run wallets:balances
```

---

## 📋 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Production mode |
| `npm run dev` | Development mode (hot reload) |
| `npm test` | Run tests once |
| `npm run test:watch` | Tests with file watching |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | Check code quality |
| `npm run format` | Format code |
| `npm run wallets:generate` | Generate Arc wallets |
| `npm run wallets:balances` | Check wallet balances |

---

## 🔐 HTTPS

### Générer les Certificats
```bash
cd backend
./setup-https.sh
```

### Vérifier les Certificats
```bash
# Expiration
openssl x509 -in cert.pem -noout -dates

# Contenu
openssl x509 -in cert.pem -noout -text
```

### Régénérer les Certificats
```bash
cd backend
rm -f key.pem cert.pem    # Supprimer les anciens
./setup-https.sh          # Générer les nouveaux
./restart.sh              # Redémarrer
```

---

## 🌐 Endpoints

### Health Check
```bash
curl -k https://72.61.108.21:3001/api/health
```

### Config
```bash
curl -k https://72.61.108.21:3001/api/config
```

### Auth Me (avec token)
```bash
curl -k -H "Authorization: Bearer YOUR_TOKEN" \
  https://72.61.108.21:3001/api/auth/me
```

### All Endpoints (voir OpenAPI)
```bash
# Swagger UI disponible à:
# https://72.61.108.21:3001/api-docs
curl -k https://72.61.108.21:3001/api-docs
```

---

## 📊 Logs

### Voir les Logs en Direct
```bash
npm run dev
# Les logs s'affichent dans le terminal
```

### Sauvegarder les Logs
```bash
nohup npm start > backend.log 2>&1 &
tail -f backend.log
```

### Archiver les Logs
```bash
mv backend.log backend.log.old
gzip backend.log.old
```

---

## 🚨 Erreurs Courantes

| Erreur | Commande de Correction |
|--------|----------------------|
| Port 3001 occupé | `./restart.sh` |
| Certificats manquants | `./setup-https.sh` |
| Dependencies manquantes | `npm install` |
| Permissions issues | `chmod +x *.sh` |

---

## 📱 Via SSH (VPS)

```bash
# Connecter au VPS
ssh user@72.61.108.21

# Aller au dossier
cd /path/to/arc-USDC1/backend

# Démarrer en background
nohup ./restart.sh prod > backend.log 2>&1 &

# Monitorer les logs
tail -f backend.log

# Arrêter
killall node
```

---

## ✅ Checklist Déploiement

- [ ] `./setup-https.sh` exécuté
- [ ] `key.pem` et `cert.pem` créés
- [ ] `.env` mis à jour
- [ ] `./restart.sh` lancé
- [ ] `curl -k https://72.61.108.21:3001/api/health` OK
- [ ] Frontend déployé
- [ ] `https://axonlayer.web.app/api/health` OK
- [ ] Pas d'erreurs dans la console du navigateur

---

## 📚 Aide

```bash
# Voir l'aide d'une commande npm
npm help <command>

# Exemple
npm help start
npm help run

# Voir tous les scripts
cat backend/package.json | grep '"scripts"' -A 10
```
