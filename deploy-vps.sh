#!/bin/bash

# VPS Deployment Script for Arc USDC Network
# Usage: ./deploy-vps.sh [VPS_USER@VPS_HOST]

set -e

VPS_TARGET="${1:-root@72.61.108.21}"
REPO_PATH="/app/arc-usdc-network"
BACKEND_PATH="$REPO_PATH/backend"
FRONTEND_PATH="$REPO_PATH/frontend"

echo "🚀 Deploying Arc USDC Network to $VPS_TARGET"

# 1. Stop PM2 apps on VPS
echo "⏹️  Stopping services..."
ssh "$VPS_TARGET" "cd $BACKEND_PATH && pm2 stop all || true" 2>/dev/null || true

# 2. Pull latest code
echo "📥 Pulling latest code..."
ssh "$VPS_TARGET" "cd $REPO_PATH && git pull origin main"

# 3. Install backend deps if package.json changed
echo "📦 Installing backend dependencies..."
ssh "$VPS_TARGET" "cd $BACKEND_PATH && npm ci"

# 4. Install frontend deps if package.json changed
echo "📦 Installing frontend dependencies..."
ssh "$VPS_TARGET" "cd $FRONTEND_PATH && npm ci"

# 5. Build frontend
echo "🏗️  Building frontend..."
ssh "$VPS_TARGET" "cd $FRONTEND_PATH && npm run build"

# 6. Start services with PM2
echo "▶️  Starting services..."
ssh "$VPS_TARGET" "cd $BACKEND_PATH && pm2 start 'npm start' --name 'arc-backend' --env production"

# 7. Verify health
echo "✅ Verifying health..."
sleep 2
HEALTH_CHECK=$(curl -s -f "https://wool-alternatives-com-intention.trycloudflare.com/api/health" || echo "FAILED")
if [ "$HEALTH_CHECK" = "FAILED" ]; then
  echo "❌ Health check failed!"
  ssh "$VPS_TARGET" "pm2 logs arc-backend --lines 20"
  exit 1
fi

echo "✅ Deployment complete!"
echo ""
echo "📊 Services running:"
ssh "$VPS_TARGET" "pm2 list"
echo ""
echo "📝 Recent logs:"
ssh "$VPS_TARGET" "pm2 logs arc-backend --lines 10"
