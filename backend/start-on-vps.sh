#!/bin/bash

echo "🚀 Starting Backend on VPS"
echo "=========================="
echo ""

VPS_IP="72.61.108.21"
VPS_USER="root"
BACKEND_PATH="/root/arc-USDC1/backend"

echo "Connecting to VPS: $VPS_USER@$VPS_IP"
echo "Backend path: $BACKEND_PATH"
echo ""

# Execute on VPS
ssh $VPS_USER@$VPS_IP << 'REMOTECMD'

echo "Step 1: Stop other node servers..."
pkill -f "node /root/axonlayer" || true
pkill -f "node /var/www" || true
pkill -f "node /psynex" || true
pkill -f "node /opt/learnthai" || true
pkill -f "node /root/mvpalex" || true
sleep 2

echo "Step 2: Stop any existing process on port 3001..."
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
sleep 2

echo "Step 3: Starting ARC USDC Backend..."
cd /root/arc-USDC1/backend

# Verify .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env not found!"
    exit 1
fi

# Verify certificates exist
if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    echo "ERROR: SSL certificates not found!"
    exit 1
fi

# Install dependencies if needed
npm install --production 2>&1 | tail -5

# Start backend
nohup npm start > backend.log 2>&1 &

# Wait for startup
sleep 3

# Check if running
if lsof -i :3001 > /dev/null; then
    echo "✓ Backend started successfully!"
    echo ""
    echo "Checking health endpoint..."
    curl -k https://localhost:3001/api/health 2>/dev/null | head -c 100
    echo ""
else
    echo "ERROR: Backend failed to start"
    echo "Last 20 lines of log:"
    tail -20 backend.log
    exit 1
fi

REMOTECMD

echo ""
echo "✅ Done!"
echo ""
echo "Test endpoint:"
echo "  curl -k https://$VPS_IP:3001/api/health"
