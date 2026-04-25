#!/bin/bash

echo "🚀 Starting Backend on VPS (Port 3002)"
echo "======================================="
echo ""

VPS_IP="72.61.108.21"
VPS_USER="root"
VPS_PORT="3002"

echo "Target: $VPS_USER@$VPS_IP:$VPS_PORT"
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

echo "Step 2: Stop any existing process on port 3002..."
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
sleep 1

echo "Step 3: Setup backend directory..."
cd /root/arc-USDC1/backend
pwd

echo "Step 4: Create .env file..."
cat > .env << 'ENVEOF'
PORT=3002

WALLET_PROVIDER=onchain
ONCHAIN_NETWORK=arc-testnet
ONCHAIN_DRY_RUN=false

PRICING_PROFILE=nano

AGENT_SELECTION=score_price

AUTH_ENABLED=true
FIREBASE_PROJECT_ID=agenthubarc
FIREBASE_SERVICE_ACCOUNT=firebase-service-account.json
ADMIN_EMAILS=lberthod@gmail.com

CLIENT_DAILY_QUOTA=1000
CLIENT_MONTHLY_BUDGET=10

PROVIDER_MIN_STAKE=0.1
PROVIDER_SLASH_PENALTY=0.05

HTTPS_ENABLED=false

CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://72.61.108.21,http://72.61.108.21:3002,https://agenthubarc.web.app,https://axonlayer.web.app

LOG_LEVEL=info

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5-nano-2025-08-07
OPENAI_MAX_OUTPUT_TOKENS=100512
OPENAI_REASONING_EFFORT=low
ENVEOF

echo "✓ .env created"

echo "Step 5: Setup SSL certificates..."
if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
  echo "Generating self-signed certificate (valid for 1 year)..."
  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
    -subj "/CN=72.61.108.21/O=ARC/C=US" 2>/dev/null || true
  if [ ! -f "key.pem" ]; then
    echo "⚠️  Could not generate certificates, running on HTTP instead"
  else
    echo "✓ Certificates generated"
  fi
else
  echo "✓ Using existing certificates"
fi

echo "Step 6: Install dependencies..."
npm install --production 2>&1 | grep -E "added|up to date|found"

echo "Step 7: Start backend..."
nohup npm start > backend.log 2>&1 &
BACKEND_PID=$!
echo "Started PID: $BACKEND_PID"

echo "Step 8: Wait for startup..."
sleep 3

echo "Step 9: Verify port 3002 is listening..."
if lsof -i :3002 > /dev/null; then
    echo "✓ Backend is listening on port 3002"
    echo ""
    echo "Health check:"
    curl -k https://localhost:3002/api/health 2>/dev/null | jq . || echo "(jq not available, raw response)"
else
    echo "❌ Backend not listening on port 3002"
    echo ""
    echo "Last 30 lines of log:"
    tail -30 backend.log
    exit 1
fi

REMOTECMD

echo ""
echo "✅ Backend started!"
echo ""
echo "Test from local machine:"
echo "  curl -k https://$VPS_IP:$VPS_PORT/api/health"
echo ""
echo "Update frontend .env.production:"
echo "  VITE_API_BASE_URL=https://$VPS_IP:$VPS_PORT"
