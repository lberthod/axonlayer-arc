#!/bin/bash
set -e

echo "🚀 Deploying ARC USDC Frontend"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the frontend directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ firebase.json not found. Run this script from the frontend directory.${NC}"
    exit 1
fi

# Step 1: Install Cloud Functions dependencies
echo -e "${YELLOW}📦 Installing Cloud Functions dependencies...${NC}"
cd functions
npm install
cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 2: Build frontend
echo ""
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built${NC}"

# Step 3: Deploy
echo ""
echo -e "${YELLOW}🚀 Deploying to Firebase...${NC}"
firebase deploy

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Frontend: https://axonlayer.web.app"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Check Cloud Functions: firebase functions:log"
    echo "2. Visit https://axonlayer.web.app"
    echo "3. Test API: curl https://axonlayer.web.app/api/health"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
