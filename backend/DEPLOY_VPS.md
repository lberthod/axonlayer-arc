# 🚀 Déploiement Backend sur VPS

## ⚡ Déploiement Automatique (Recommandé)

```bash
cd backend
./deploy-to-vps.sh
```

Le script va:
1. ✅ Se connecter au VPS via SSH
2. ✅ Uploader les fichiers du backend
3. ✅ Installer les dépendances
4. ✅ Générer les certificats HTTPS
5. ✅ Créer le fichier .env
6. ✅ Démarrer le serveur en arrière-plan
7. ✅ Vérifier que ça fonctionne

---

## 📋 Prérequis

### 1. Accès SSH au VPS
```bash
# Vérifier SSH
ssh root@72.61.108.21

# Si ça demande un password, entrez-le
# Si ça demande une clé, assurez-vous que vous avez la clé SSH
```

### 2. Node.js sur le VPS
```bash
# SSH au VPS
ssh root@72.61.108.21

# Vérifier Node.js
node --version
npm --version

# Si pas installé:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. OpenSSL sur le VPS
```bash
ssh root@72.61.108.21
openssl version

# Si pas installé:
sudo apt-get install -y openssl
```

---

## 🔧 Déploiement Étape par Étape

### Étape 1: Configuration SSH
```bash
# Vérifiez que vous pouvez accéder au VPS
ssh root@72.61.108.21 "echo 'SSH works!'"
```

### Étape 2: Exécuter le Script de Déploiement
```bash
cd backend
./deploy-to-vps.sh

# Suivez les instructions:
# - VPS IP: 72.61.108.21
# - VPS User: root
# - Backend path: /root/arc-USDC1/backend
```

### Étape 3: Vérifier le Déploiement
```bash
# Le script teste automatiquement
# Vous devriez voir: {"status":"ok",...}

# Ou testez manuellement
curl -k https://72.61.108.21:3001/api/health
```

---

## 📊 Après Déploiement

### Mettre à Jour le Frontend
```bash
# Éditez frontend/.env.production
VITE_API_BASE_URL=https://72.61.108.21:3001

# Build et déploy
cd frontend
npm run build
firebase deploy --only hosting
```

### Vérifier les Logs du Backend
```bash
ssh root@72.61.108.21 'tail -f /root/arc-USDC1/backend/backend.log'
```

### Redémarrer le Backend
```bash
ssh root@72.61.108.21 'pkill -f "npm start" && cd /root/arc-USDC1/backend && nohup npm start > backend.log 2>&1 &'
```

### Voir les Processus
```bash
ssh root@72.61.108.21 'lsof -i :3001'
```

---

## 🔐 Structure sur le VPS

Après déploiement, votre VPS aura:
```
/root/arc-USDC1/backend/
├── src/
├── node_modules/
├── .env                 ← Créé automatiquement
├── key.pem             ← Certificat (créé automatiquement)
├── cert.pem            ← Certificat (créé automatiquement)
├── backend.log         ← Logs du serveur
├── package.json
└── ...autres fichiers...
```

---

## ⚙️ Configuration .env sur VPS

Le script crée automatiquement `.env` avec:
- `PORT=3001`
- `HTTPS_ENABLED=true`
- `HTTPS_KEY_PATH=./key.pem`
- `HTTPS_CERT_PATH=./cert.pem`
- `CORS_ORIGINS` configuré pour Firebase Hosting
- Configuration de portefeuille blockchain
- Configuration OpenAI

Si vous devez modifier:
```bash
ssh root@72.61.108.21 'nano /root/arc-USDC1/backend/.env'
```

---

## 🧪 Tests

### Test Health Endpoint
```bash
curl -k https://72.61.108.21:3001/api/health
# Doit retourner: {"status":"ok",...}
```

### Test Config Endpoint
```bash
curl -k https://72.61.108.21:3001/api/config
# Doit retourner la configuration du backend
```

### Test CORS (depuis le navigateur)
```javascript
// Depuis la console du navigateur sur axonlayer.web.app
fetch('https://72.61.108.21:3001/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 🐛 Dépannage

### Connexion SSH échoue
```bash
# Vérifier la connectivité
ping 72.61.108.21

# Vérifier SSH
ssh -v root@72.61.108.21

# Vérifier le port SSH (par défaut 22)
ssh -p 22 root@72.61.108.21
```

### Backend ne démarre pas
```bash
# Voir les logs
ssh root@72.61.108.21 'tail -50 /root/arc-USDC1/backend/backend.log'

# Vérifier les dépendances
ssh root@72.61.108.21 'cd /root/arc-USDC1/backend && npm list'

# Vérifier Node.js
ssh root@72.61.108.21 'node --version'
```

### Port 3001 occupé
```bash
# Tuer le processus existant
ssh root@72.61.108.21 'lsof -ti :3001 | xargs kill -9'

# Redémarrer
ssh root@72.61.108.21 'cd /root/arc-USDC1/backend && nohup npm start > backend.log 2>&1 &'
```

### Certificats invalides
```bash
# Régénérer les certificats
ssh root@72.61.108.21 << 'EOF'
cd /root/arc-USDC1/backend
rm -f key.pem cert.pem
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=72.61.108.21"
chmod 600 key.pem
EOF

# Redémarrer
ssh root@72.61.108.21 'pkill -f "npm start" && cd /root/arc-USDC1/backend && nohup npm start > backend.log 2>&1 &'
```

---

## 📚 Commandes Rapides

| Commande | Description |
|----------|-------------|
| `./deploy-to-vps.sh` | Déployer le backend |
| `ssh root@72.61.108.21 'tail -f /root/arc-USDC1/backend/backend.log'` | Voir les logs |
| `curl -k https://72.61.108.21:3001/api/health` | Tester health |
| `ssh root@72.61.108.21 'lsof -i :3001'` | Vérifier port 3001 |
| `ssh root@72.61.108.21 'ps aux \| grep npm'` | Voir les processus |

---

## ✅ Checklist

- [ ] SSH works: `ssh root@72.61.108.21 "echo test"`
- [ ] Node.js installed: `ssh root@72.61.108.21 "node --version"`
- [ ] `./deploy-to-vps.sh` exécuté avec succès
- [ ] Backend démarre (voir les logs)
- [ ] Health endpoint répond: `curl -k https://72.61.108.21:3001/api/health`
- [ ] Frontend .env.production mis à jour
- [ ] Frontend déployé
- [ ] `https://axonlayer.web.app/api/health` fonctionne

---

## 🎉 C'est Fait!

Votre backend est maintenant déployé sur le VPS avec:
- ✅ HTTPS activé
- ✅ Certificats SSL auto-signés
- ✅ CORS configuré
- ✅ Prêt pour la production
