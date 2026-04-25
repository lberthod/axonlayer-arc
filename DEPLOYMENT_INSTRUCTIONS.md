# 🚀 AXON LAYER DEPLOYMENT GUIDE

## ✅ Status: READY TO DEPLOY

Everything has been configured. Follow these exact steps:

---

## 🎯 STEP 1: Execute Backend Deployment (10 min)

Run this **one command** on your local machine:

```bash
bash /tmp/ONE_SHOT_DEPLOY.sh
```

This will:
- ✅ Prepare VPS (create directories, install Node.js, PM2, nginx)
- ✅ Copy backend files & .env
- ✅ Install npm dependencies
- ✅ Start backend with PM2
- ✅ Configure nginx as reverse proxy
- ✅ Build frontend for production

---

## 🎯 STEP 2: Deploy Frontend to Firebase

After the script completes, run:

```bash
cd /Users/berthod/Desktop/arc-USDC1/frontend
firebase deploy
```

---

## 🔍 VERIFICATION

### Backend is Live
```bash
curl http://72.61.108.21
```

Should return backend response.

### Frontend is Live
- Visit: https://axonlayer.web.app
- Should connect to backend at 72.61.108.21
- Create a mission with **onchain settlement**

### Monitor Logs
```bash
ssh root@72.61.108.21 "pm2 logs axon-backend"
```

---

## 📊 Configuration Files Created

✅ **Frontend:**
- `.env.production` - Backend URL configured
- `src/services/api.js` - API client pointing to VPS

✅ **Backend (on VPS):**
- `/root/axonlayer/backend/.env` - Production config
- `/root/axonlayer/ecosystem.config.js` - PM2 process manager
- `/etc/nginx/sites-available/axon` - Reverse proxy config

---

## 🔑 Key URLs

| Service | URL |
|---------|-----|
| Backend API | http://72.61.108.21 |
| API Health | http://72.61.108.21/health |
| Frontend | https://axonlayer.web.app |
| VPS SSH | ssh root@72.61.108.21 |

---

## 📋 Useful Commands

### SSH to VPS
```bash
ssh root@72.61.108.21
```

### View Backend Logs
```bash
ssh root@72.61.108.21 "pm2 logs axon-backend"
```

### Restart Backend
```bash
ssh root@72.61.108.21 "pm2 restart axon-backend"
```

### Check Backend Status
```bash
ssh root@72.61.108.21 "pm2 status"
```

### Stop Backend
```bash
ssh root@72.61.108.21 "pm2 stop axon-backend"
```

### Nginx Status
```bash
ssh root@72.61.108.21 "systemctl status nginx"
```

---

## 🐛 Troubleshooting

### Backend not responding
1. SSH to VPS: `ssh root@72.61.108.21`
2. Check PM2: `pm2 logs axon-backend`
3. Check nginx: `systemctl status nginx`
4. Check port: `netstat -tuln | grep 3001`

### Frontend can't reach backend
1. Check .env.production has correct URL
2. Check CORS in backend
3. Check nginx reverse proxy config
4. Restart nginx: `systemctl restart nginx`

### Firebase deploy fails
```bash
firebase login
firebase projects:list
firebase deploy
```

---

## ✨ What's Next

After deployment:
1. Test mission creation with Arc testnet USDC
2. Monitor onchain settlements
3. Set up SSL/TLS certificate (optional, nginx on port 80)
4. Configure monitoring/alerts
5. Scale horizontally if needed

---

**Ready? Run:** `bash /tmp/ONE_SHOT_DEPLOY.sh`
