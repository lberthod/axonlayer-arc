# Deployment Guide - Arc USDC Network

## Overview

The system consists of:
- **Frontend**: Vue 3 + Vite app deployed to Firebase Hosting (`https://axonlayer.web.app`)
- **Backend**: Node.js + Express API running on VPS (`https://wool-alternatives-com-intention.trycloudflare.com`)
- **Database**: Persistent JSON stores (ledger, treasury, wallets) on VPS

## Architecture

```
User Browser (axonlayer.web.app)
          ↓
    Cloudflare Tunnel
          ↓
VPS Backend (72.61.108.21:3001)
```

The backend uses Cloudflare Tunnel to expose port 3001 publicly without opening it directly to the internet.

---

## Setup Instructions

### Prerequisites

- SSH access to VPS (72.61.108.21)
- Node.js 18+ installed on VPS
- PM2 globally installed: `npm install -g pm2`
- Git installed on VPS
- Cloudflare Tunnel configured (already running)

### 1. Initial VPS Setup

```bash
# SSH into VPS
ssh root@72.61.108.21

# Clone the repo (if not already cloned)
cd /app
git clone https://github.com/lberthod/arcagenthub.git arc-usdc-network
cd arc-usdc-network

# Install backend dependencies
cd backend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings:
# - WALLET_PROVIDER=onchain
# - ONCHAIN_NETWORK=arc-testnet
# - ONCHAIN_DRY_RUN=false (when ready for live txs)
# - FIREBASE_PROJECT_ID=agenthubarc
# - FIREBASE_SERVICE_ACCOUNT=firebase-service-account.json

# Download Firebase service account (from Firebase Console)
# Place it at: backend/firebase-service-account.json

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend
npm run build

# Set up PM2 startup hook
cd ../backend
pm2 start 'npm start' --name 'arc-backend' --env production
pm2 startup
pm2 save
```

### 2. Verify Setup

```bash
# Check services
pm2 list

# View logs
pm2 logs arc-backend

# Health check
curl https://wool-alternatives-com-intention.trycloudflare.com/api/health
```

### 3. Deploy Updates

From your local machine:

```bash
# Make sure everything is committed
git status

# Run deploy script
./deploy-vps.sh root@72.61.108.21
```

The script will:
1. Stop services
2. Pull latest code
3. Install dependencies
4. Build frontend
5. Restart services
6. Verify health

---

## Real-time Batch Progress (SSE Streaming)

The new `/api/simulate/stream` endpoint uses Server-Sent Events to stream mission progress in real-time.

### Frontend Configuration

**File**: `frontend/.env.production`

```env
VITE_API_BASE_URL=https://wool-alternatives-com-intention.trycloudflare.com
```

### Backend Configuration

**File**: `backend/src/app.js`

CORS is configured to accept requests from:
- `https://axonlayer.web.app` (production)
- `https://axonlayer.firebaseapp.com` (Firebase alternate domain)
- `http://localhost:3000` (local dev)
- `http://localhost:5173` (Vite dev)

### How It Works

1. **Frontend** initiates batch: `POST /api/simulate/stream`
2. **Backend** streams updates as missions complete:
   ```
   data: {"type":"mission_complete","mission":{...},"progress":{...}}
   data: {"type":"mission_complete","mission":{...},"progress":{...}}
   ...
   data: {"type":"batch_complete","results":{...}}
   ```
3. **Frontend** displays progress in real-time overlay
4. **Report modal** shows final results

### Testing Streaming

```bash
curl -X POST https://wool-alternatives-com-intention.trycloudflare.com/api/simulate/stream \
  -H "Content-Type: application/json" \
  -d '{"count": 3, "selectionStrategy": "score_price"}' \
  -v
```

---

## Monitoring

### View Logs

```bash
# Backend logs
ssh root@72.61.108.21 "pm2 logs arc-backend"

# Specific endpoint logs
ssh root@72.61.108.21 "pm2 logs arc-backend | grep 'simulate'"
```

### Check Health

```bash
curl -s https://wool-alternatives-com-intention.trycloudflare.com/api/health | jq
```

### Database Files

Persistent data stored at:
- `/app/arc-usdc-network/backend/src/data/store.json` - Ledger
- `/app/arc-usdc-network/backend/src/data/treasury.json` - Treasury state
- `/app/arc-usdc-network/backend/src/data/wallets.json` - Agent wallets (generated)

---

## Troubleshooting

### Deployment fails - git pull rejected

```bash
ssh root@72.61.108.21 "cd /app/arc-usdc-network && git status"
# If there are uncommitted changes:
git reset --hard HEAD
git pull origin main
```

### Backend crashes after deploy

```bash
ssh root@72.61.108.21 "pm2 logs arc-backend"
# Common issues:
# - Missing .env file or configuration
# - Firebase service account not found
# - Port 3001 already in use

# Restart
pm2 restart arc-backend
```

### SSE streaming not working from frontend

1. Verify CORS configuration in `backend/src/app.js`
2. Check frontend `.env.production` has correct `VITE_API_BASE_URL`
3. Verify backend is running: `pm2 list`
4. Test endpoint directly: `curl -v https://...api/simulate/stream`

### Firewall/network issues

If you need to restart Cloudflare Tunnel:

```bash
ssh root@72.61.108.21 "systemctl restart cloudflared"
```

---

## Rollback

To revert to previous version:

```bash
ssh root@72.61.108.21 "cd /app/arc-usdc-network && git revert HEAD && npm ci && pm2 restart arc-backend"
```

Or manually:

```bash
cd /app/arc-usdc-network
git log --oneline  # Find commit hash
git checkout <commit-hash>
cd backend && npm ci && pm2 restart arc-backend
```
