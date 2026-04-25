# 🚀 VPS Update & Restart Commands

## SSH into VPS
```bash
ssh ubuntu@72.61.108.21
# ou si user différent:
ssh your_user@your_vps_ip
```

---

## 1️⃣ UPDATE CODE (Git Pull)

```bash
cd ~/arc-usdc
git pull origin main
echo "✓ Code updated"
```

---

## 2️⃣ UPDATE DEPENDENCIES (if needed)

```bash
# Backend
cd ~/arc-usdc/backend
npm ci --omit=dev
echo "✓ Backend dependencies updated"

# Frontend
cd ~/arc-usdc/frontend
npm ci --omit=dev
echo "✓ Frontend dependencies updated"
```

---

## 3️⃣ REBUILD FRONTEND (if frontend changed)

```bash
cd ~/arc-usdc/frontend
npm run build
echo "✓ Frontend built"
```

---

## 4️⃣ RESTART SERVICES

### Option A: Using PM2 (Recommended)
```bash
# Restart backend only
pm2 restart arc-backend
pm2 logs arc-backend

# Or restart all
pm2 restart all
pm2 save
```

### Option B: Full restart
```bash
# Stop
pm2 stop all
sudo systemctl stop nginx

# Start
pm2 start npm --name "arc-backend" -- start
pm2 save
sudo systemctl start nginx

# Check status
pm2 status
pm2 logs arc-backend
```

---

## 🔄 ONE-LINER (Git Pull + Restart)

```bash
cd ~/arc-usdc && git pull origin main && pm2 restart arc-backend && pm2 logs arc-backend --lines 20
```

---

## ✅ VERIFY DEPLOYMENT

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs arc-backend --lines 30

# Check if responding
curl -s http://localhost:3001/api/health | jq .

# Check frontend
curl -s http://localhost/api/health | jq .
```

---

## 🛑 TROUBLESHOOTING

### If backend won't start:
```bash
# Check error logs
pm2 logs arc-backend

# Stop it
pm2 stop arc-backend

# Check .env is correct
cat ~/arc-usdc/backend/.env | grep -v "^#" | grep -v "^$"

# Start manually to see errors
cd ~/arc-usdc/backend
npm start
```

### If stuck:
```bash
# Kill all node processes
pkill -f "node"

# Restart fresh
pm2 restart all

# Or manually restart
cd ~/arc-usdc/backend
pm2 start npm --name "arc-backend" -- start
```

### Check blockchain connection:
```bash
# Test RPC connectivity
curl -s https://rpc.testnet.arc.network \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq .

# Should return: {"jsonrpc":"2.0","result":"0x4caa62","id":1}
```

---

## 📊 FULL STATUS CHECK

```bash
#!/bin/bash
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Backend Logs (last 5 lines) ==="
pm2 logs arc-backend --lines 5

echo ""
echo "=== Backend Health ==="
curl -s http://localhost:3001/api/health | jq .

echo ""
echo "=== Frontend Build ==="
ls -lh ~/arc-usdc/frontend/dist/index.html 2>/dev/null || echo "Frontend not built"

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager || echo "Nginx not running"

echo ""
echo "✓ Status check complete"
```

Save as `status-check.sh` and run:
```bash
chmod +x status-check.sh
./status-check.sh
```

---

## 🔁 AUTO-RESTART ON CRASH

PM2 handles this automatically. To enable:
```bash
# Enable startup script
pm2 startup

# Save PM2 config
pm2 save
```

Then if backend crashes, it auto-restarts within seconds.

---

## 📝 QUICK REFERENCE

| Task | Command |
|------|---------|
| SSH to VPS | `ssh ubuntu@72.61.108.21` |
| Update code | `cd ~/arc-usdc && git pull origin main` |
| Restart backend | `pm2 restart arc-backend` |
| View logs | `pm2 logs arc-backend` |
| Check status | `pm2 status` |
| Full update+restart | `cd ~/arc-usdc && git pull && pm2 restart arc-backend && pm2 logs arc-backend --lines 20` |

