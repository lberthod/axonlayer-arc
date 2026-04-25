#!/bin/bash

echo "🔄 Restarting ARC USDC Backend"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Stop existing backend process
echo -e "${YELLOW}🛑 Stopping existing backend processes...${NC}"

# Kill process on port 3001
if command -v lsof &> /dev/null; then
    PID=$(lsof -t -i:3001)
    if [ ! -z "$PID" ]; then
        echo "Found process on port 3001 (PID: $PID), stopping..."
        kill -TERM $PID 2>/dev/null || true
        sleep 2
        # Force kill if still running
        kill -KILL $PID 2>/dev/null || true
        echo -e "${GREEN}✓ Process stopped${NC}"
    else
        echo "No process running on port 3001"
    fi
else
    echo -e "${YELLOW}⚠️  lsof not found, skipping existing process check${NC}"
fi

echo ""

# Step 2: Verify HTTPS configuration
echo -e "${YELLOW}🔒 Verifying HTTPS configuration...${NC}"

if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    echo -e "${RED}❌ SSL certificates not found!${NC}"
    echo ""
    echo "Run setup-https.sh first:"
    echo "  ./setup-https.sh"
    exit 1
fi

echo -e "${GREEN}✓ SSL certificates found${NC}"

# Check .env configuration
if ! grep -q "HTTPS_ENABLED=true" .env; then
    echo -e "${RED}❌ HTTPS_ENABLED not set to true in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ HTTPS_ENABLED configured${NC}"

echo ""

# Step 3: Install/update dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""

# Step 4: Start the backend
echo -e "${YELLOW}🚀 Starting backend with HTTPS...${NC}"
echo ""
echo -e "${BLUE}Configuration:${NC}"
grep -E "HTTPS_ENABLED|HTTPS_KEY_PATH|HTTPS_CERT_PATH|PORT" .env
echo ""
echo -e "${YELLOW}Starting server...${NC}"
echo ""

# Start with npm dev (includes hot reload) or npm start (production)
# Use npm start for production, npm run dev for development
if [ "$1" == "prod" ] || [ "$1" == "production" ]; then
    echo "Starting in PRODUCTION mode (npm start)..."
    npm start
else
    echo "Starting in DEVELOPMENT mode (npm run dev)..."
    echo "Press Ctrl+C to stop"
    echo ""
    npm run dev
fi
