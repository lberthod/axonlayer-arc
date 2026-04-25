#!/bin/bash

# VPS deployment script
# Usage: ./deploy-vps.sh [user@host]
# Example: ./deploy-vps.sh root@192.168.1.100

VPS_HOST="${1:-}"
PROJECT_PATH="${2:-/home/arc-agent/arc-USDC1}"

if [ -z "$VPS_HOST" ]; then
  echo "Usage: ./deploy-vps.sh user@host [project_path]"
  echo "Example: ./deploy-vps.sh root@192.168.1.100"
  exit 1
fi

echo "🚀 Deploying to VPS: $VPS_HOST"
echo "📂 Project path: $PROJECT_PATH"
echo ""

ssh "$VPS_HOST" bash -c "
  set -e

  echo '📥 Fetching latest code...'
  cd $PROJECT_PATH
  git fetch origin
  git pull origin main

  echo '📦 Installing backend dependencies...'
  cd backend
  npm install --production

  echo '🔄 Restarting backend service...'
  pm2 restart arc-backend || pm2 start 'npm start' --name arc-backend:prod

  echo '✅ Backend deployment complete!'
  echo ''
  pm2 logs arc-backend --lines 20
"

echo ""
echo "✨ Deployment finished!"
