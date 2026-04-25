# 🔄 Redémarrage du Backend

## ⚡ Utilisation Rapide

### Mode Développement (avec hot reload)
```bash
cd backend
./restart.sh
```

Le serveur redémarre automatiquement quand vous modifiez un fichier.

### Mode Production
```bash
cd backend
./restart.sh prod
```

ou

```bash
cd backend
./restart.sh production
```

---

## 📋 Ce Que le Script Fait

1. ✅ Arrête tout processus existant sur le port 3001
2. ✅ Vérifie les certificats SSL (key.pem, cert.pem)
3. ✅ Vérifie la configuration HTTPS dans .env
4. ✅ Installe les dépendances NPM
5. ✅ Démarre le serveur en mode dev ou production

---

## 📊 Modes de Démarrage

### `npm run dev` (Mode Développement)
```bash
npm run dev
```

**Caractéristiques:**
- ✅ Hot reload (redémarre quand vous modifiez un fichier)
- ✅ Messages de debug plus verbeux
- ✅ Parfait pour le développement
- ✅ Peut être plus lent

**Quand l'utiliser:**
- Pendant le développement local
- Quand vous modifiez le code backend
- Pour tester les changements rapidement

### `npm start` (Mode Production)
```bash
npm start
```

**Caractéristiques:**
- ✅ Pas de hot reload
- ✅ Plus rapide au démarrage
- ✅ Consomme moins de ressources
- ✅ Recommandé pour la production

**Quand l'utiliser:**
- Sur le serveur VPS en production
- Quand le backend est stable
- Pour éviter les redémarrages inattendus

---

## 🔧 Utilisation Manuelle (sans script)

Si vous préférez sans le script:

### Mode Développement
```bash
cd backend
npm run dev
```

### Mode Production
```bash
cd backend
npm start
```

### Arrêter le serveur
```bash
# Ctrl+C dans le terminal
```

### Arrêter le processus s'il s'exécute en arrière-plan
```bash
# Voir le processus
lsof -i :3001

# Arrêter (remplacez PID par le numéro affiché)
kill -TERM <PID>

# Force kill si necessary
kill -KILL <PID>
```

---

## 📝 Exemple Complet

### Déploiement Backend avec HTTPS

**1. Configuration initiale (une seule fois)**
```bash
cd backend
./setup-https.sh
# Suivez les instructions, générez les certificats
```

**2. Démarrer le backend**
```bash
cd backend
./restart.sh
# ou: ./restart.sh prod
```

**3. Vérifier que ça fonctionne**
```bash
curl -k https://72.61.108.21:3001/api/health
```

**4. En cas de modification du code**
- Si vous utilisez `npm run dev` → redémarrage automatique
- Si vous utilisez `npm start` → arrêtez et relancez avec `./restart.sh prod`

---

## ✅ Vérification Post-Démarrage

```bash
# Check que le port 3001 écoute
lsof -i :3001

# Doit retourner quelque chose comme:
# node    12345  user   43u  IPv6 ...  TCP *:3001 (LISTEN)
```

```bash
# Test l'endpoint health
curl -k https://72.61.108.21:3001/api/health

# Doit retourner:
# {"status":"ok","message":"API Proxy is running",...}
```

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| "Address already in use" | Exécutez `./restart.sh` (tue le processus existant) |
| "EACCES: permission denied" | `chmod +x restart.sh` |
| "SSL certificates not found" | Exécutez `./setup-https.sh` |
| "Cannot find module" | `npm install` |
| Pas de hot reload | Utilisez `npm run dev` au lieu de `npm start` |
| Serveur ne démarre pas | Vérifiez `.env`: HTTPS_ENABLED, chemins des certificats |

---

## 📱 Depuis le VPS (SSH)

```bash
# SSH au VPS
ssh user@72.61.108.21

# Allez dans le dossier backend
cd /path/to/arc-USDC1/backend

# Lancez avec nohup (continues même si vous déconnectez)
nohup ./restart.sh prod > backend.log 2>&1 &

# Ou avec screen/tmux pour un terminal permanent
screen -S arc-backend
./restart.sh prod
# Ctrl+A puis D pour détacher
```

---

## 🔄 Cycle de Développement

**Pendant le dev:**
```bash
./restart.sh  # Mode dev avec hot reload
# Modifiez le code...
# Le serveur redémarre automatiquement
```

**Avant la production:**
```bash
./restart.sh prod  # Mode production stable
```

---

## 📊 Logs

Le serveur affiche les logs à l'écran. Pour persister les logs:

```bash
# Sauvegarder les logs
nohup ./restart.sh prod > backend.log 2>&1 &

# Lire les logs
tail -f backend.log

# Ou avec npm
npm start > backend.log 2>&1 &
```

---

## ✨ Prochaines Étapes

Après le redémarrage:
1. ✅ Vérifiez que le backend écoute sur port 3001
2. ✅ Testez l'endpoint `/api/health`
3. ✅ Déployez le frontend
4. ✅ Testez depuis le navigateur

```bash
# Test rapide
curl -k https://72.61.108.21:3001/api/health
curl https://axonlayer.web.app/api/health
```
