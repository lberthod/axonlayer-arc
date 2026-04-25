# Activation HTTPS pour le Backend

## 🚀 Étapes Rapides

### Étape 1: Exécutez le script de configuration
```bash
cd backend
./setup-https.sh
```

Le script va:
1. ✅ Générer les certificats SSL auto-signés
2. ✅ Mettre à jour `.env` avec la configuration HTTPS
3. ✅ Ajouter les origines CORS pour HTTPS
4. ✅ Afficher les instructions suivantes

### Étape 2: Redémarrez le backend
```bash
cd backend
npm run dev
# ou: npm start
```

Vous devriez voir:
```
Server running on https://localhost:3001
🔒 HTTPS enabled (cert: ./cert.pem)
```

### Étape 3: Mettez à jour le frontend
Éditez `frontend/.env.production`:
```
VITE_API_BASE_URL=https://72.61.108.21:3001
```

### Étape 4: Redéployez le frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Étape 5: Testez
```bash
# Accepter le certificat auto-signé avec -k
curl -k https://72.61.108.21:3001/api/health

# Résultat attendu:
# {"status":"ok","message":"API Proxy is running","backend":"..."}
```

---

## 📋 Fichiers Créés/Modifiés

### Backend
- **setup-https.sh** - Script de configuration (nouveau)
- **.env** - Mis à jour avec:
  ```
  HTTPS_ENABLED=true
  HTTPS_KEY_PATH=./key.pem
  HTTPS_CERT_PATH=./cert.pem
  ```
- **key.pem** - Clé privée (généré)
- **cert.pem** - Certificat (généré)

### Frontend
- **.env.production** - À mettre à jour:
  ```
  VITE_API_BASE_URL=https://72.61.108.21:3001
  ```

---

## ✅ Vérification Post-Déploiement

1. **Vérifiez HTTPS du backend**
   ```bash
   curl -k https://72.61.108.21:3001/api/health
   ```
   Doit retourner: `{"status":"ok",...}`

2. **Vérifiez le déploiement frontend**
   ```bash
   curl https://axonlayer.web.app/api/health
   ```
   Doit retourner: `{"status":"ok",...}`

3. **Vérifiez dans le navigateur**
   - Allez à https://axonlayer.web.app
   - Ouvrez la console (F12)
   - Vérifiez qu'il n'y a pas d'erreurs réseau

---

## ⚠️ Notes Importantes

### Certificat Auto-Signé
- ✅ Bon pour le développement et les tests
- ❌ Pas bon pour la production
- 🔒 Les navigateurs affichent un avertissement

### Pour la Production
Installez un certificat Let's Encrypt:
```bash
# Sur le VPS, avec certbot
sudo apt-get install certbot
sudo certbot certonly --standalone -d 72.61.108.21
# Ou utilisez votre domaine au lieu de l'IP
```

### Dépannage

**Erreur: "Address already in use"**
- Le serveur utilise déjà le port 3001
- Arrêtez le serveur existant: `kill $(lsof -t -i:3001)`

**Erreur: "permission denied" sur key.pem**
```bash
chmod 600 key.pem
chmod 644 cert.pem
```

**Certificat expiré**
- Générez un nouveau certificat avec le script
- Les certificats auto-signés expirent après 365 jours

**Le navigateur refuse toujours la connexion**
- C'est normal pour les certificats auto-signés
- Cliquez sur "Avancé" → "Continuer vers le site" (ou équivalent)

---

## 🔄 Résumé Complet du Déploiement

```bash
# 1. Backend - Activation HTTPS
cd backend
./setup-https.sh
npm run dev

# 2. Frontend - Configuration
cd ../frontend
# Éditez .env.production
# VITE_API_BASE_URL=https://72.61.108.21:3001

# 3. Frontend - Build & Deploy
npm run build
firebase deploy --only hosting

# 4. Test
curl -k https://72.61.108.21:3001/api/health
curl https://axonlayer.web.app/api/health
```

---

## 📚 Ressources

- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Node.js HTTPS Module](https://nodejs.org/api/https.html)
- [Firebase Hosting & CORS](https://firebase.google.com/docs/hosting)
