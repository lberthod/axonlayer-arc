#!/bin/bash

echo "🚀 Deploying Backend to VPS"
echo "============================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_IP="72.61.108.21"
VPS_USER="root"  # Change if needed
VPS_PATH="/root/arc-USDC1"  # Change if needed
BACKEND_PATH="$VPS_PATH/backend"

# Ask for SSH info
echo -e "${BLUE}VPS Configuration:${NC}"
read -p "VPS IP (default: $VPS_IP): " input_ip
VPS_IP=${input_ip:-$VPS_IP}

read -p "VPS User (default: $VPS_USER): " input_user
VPS_USER=${input_user:-$VPS_USER}

read -p "Backend path on VPS (default: $BACKEND_PATH): " input_path
BACKEND_PATH=${input_path:-$BACKEND_PATH}

echo ""
echo -e "${YELLOW}Deploying to: ${NC}$VPS_USER@$VPS_IP:$BACKEND_PATH"
echo ""

# Step 1: Upload backend files
echo -e "${YELLOW}📤 Uploading backend files...${NC}"

ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "mkdir -p $BACKEND_PATH" || {
    echo -e "${RED}❌ Cannot connect to VPS${NC}"
    echo "Verify:"
    echo "  - SSH access: ssh $VPS_USER@$VPS_IP"
    echo "  - VPS IP is correct: $VPS_IP"
    echo "  - User has permissions"
    exit 1
}

# Copy backend code (exclude node_modules and certificates)
rsync -avz \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'key.pem' \
    --exclude 'cert.pem' \
    --exclude '.firebase' \
    --exclude 'dist' \
    --exclude '.git' \
    ./ $VPS_USER@$VPS_IP:$BACKEND_PATH/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend files uploaded${NC}"
echo ""

# Step 2: Setup on VPS
echo -e "${YELLOW}🔧 Setting up on VPS...${NC}"

ssh $VPS_USER@$VPS_IP << 'EOF'
# Navigate to backend
cd $BACKEND_PATH

# Install dependencies
echo "Installing npm dependencies..."
npm install --production

# Make scripts executable
chmod +x setup-https.sh restart.sh

echo "✓ Setup complete"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Setup failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ VPS setup complete${NC}"
echo ""

# Step 3: Generate HTTPS certificates on VPS
echo -e "${YELLOW}🔒 Generating HTTPS certificates on VPS...${NC}"

ssh $VPS_USER@$VPS_IP << 'EOF'
cd $BACKEND_PATH

# Generate self-signed certificate
echo "Generating SSL certificate..."
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=72.61.108.21"

# Set permissions
chmod 600 key.pem
chmod 644 cert.pem

echo "✓ Certificates generated"
EOF

echo -e "${GREEN}✓ HTTPS certificates generated${NC}"
echo ""

# Step 4: Create .env on VPS
echo -e "${YELLOW}📝 Creating .env on VPS...${NC}"

ssh $VPS_USER@$VPS_IP << 'EOF'
cat > $BACKEND_PATH/.env << 'ENVEOF'
PORT=3001

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

HTTPS_ENABLED=true
HTTPS_KEY_PATH=./key.pem
HTTPS_CERT_PATH=./cert.pem

CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://72.61.108.21,http://72.61.108.21:3001,https://axonlayer.web.app

LOG_LEVEL=info

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5-nano-2025-08-07
OPENAI_MAX_OUTPUT_TOKENS=100512
OPENAI_REASONING_EFFORT=low
ENVEOF

echo "✓ .env created"
EOF

echo -e "${GREEN}✓ Environment file created${NC}"
echo ""

# Step 5: Start backend on VPS
echo -e "${YELLOW}🚀 Starting backend on VPS...${NC}"

ssh $VPS_USER@$VPS_IP << 'EOF'
cd $BACKEND_PATH

# Kill any existing process on port 3001
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend with nohup (continues even if SSH disconnects)
nohup npm start > backend.log 2>&1 &

# Wait a moment for startup
sleep 3

# Check if it's running
if lsof -i :3001 > /dev/null; then
    echo "✓ Backend started successfully on port 3001"
else
    echo "❌ Backend failed to start, check backend.log"
    tail -20 backend.log
fi
EOF

echo -e "${GREEN}✓ Backend started on VPS${NC}"
echo ""

# Step 6: Test
echo -e "${YELLOW}🧪 Testing backend...${NC}"

sleep 2
curl -k https://$VPS_IP:3001/api/health

echo ""
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Backend URL:${NC}"
echo "  https://$VPS_IP:3001"
echo ""
echo -e "${BLUE}Update frontend .env.production:${NC}"
echo "  VITE_API_BASE_URL=https://$VPS_IP:3001"
echo ""
echo -e "${BLUE}View backend logs:${NC}"
echo "  ssh $VPS_USER@$VPS_IP 'tail -f $BACKEND_PATH/backend.log'"
echo ""
echo -e "${BLUE}Restart backend:${NC}"
echo "  ssh $VPS_USER@$VPS_IP 'pkill -f \"npm start\" && cd $BACKEND_PATH && nohup npm start > backend.log 2>&1 &'"
echo ""
