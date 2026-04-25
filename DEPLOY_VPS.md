# Déploiement sur VPS

## Quick Deploy (simple)

```bash
./deploy-vps.sh user@your-vps.com
```

## Ou manuellement sur le VPS:

```bash
ssh user@your-vps.com
cd /home/arc-agent/arc-USDC1
git pull origin main
cd backend && npm install --production
pm2 restart arc-backend
# ou si PM2 n'est pas installé:
# npm run start:prod
```

## Vérifier le status:

```bash
# SSH sur le VPS
ssh user@your-vps.com
pm2 status
pm2 logs arc-backend --lines 50

# Ou vérifier directement l'API
curl -i http://localhost:3001/api/health
```

## Que déployer:

✅ **Backend changes** (app.js): `npm run start:prod` sur le VPS  
✅ **Frontend changes**: `firebase deploy --only hosting`

---

## Commits récents:
- `b6ff2d6` - fix: Correct API route prefixes and simplify CORS configuration
