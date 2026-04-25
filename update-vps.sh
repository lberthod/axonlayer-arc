#!/bin/bash

################################################################################
# Arc-USDC VPS Quick Update Script
# Usage: ./update-vps.sh [VPS_IP] [USER]
# Example: ./update-vps.sh 72.61.108.21 ubuntu
################################################################################

VPS_IP="${1:-72.61.108.21}"
VPS_USER="${2:-ubuntu}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Arc-USDC VPS Update${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo "VPS: ${VPS_USER}@${VPS_IP}"
echo ""

# Execute on VPS
ssh "${VPS_USER}@${VPS_IP}" << 'EOF'

echo -e "\033[0;33m[1/4] Pulling latest code...\033[0m"
cd ~/arc-usdc
git pull origin main
echo -e "\033[0;32m✓ Code updated\033[0m"
echo ""

echo -e "\033[0;33m[2/4] Updating dependencies...\033[0m"
cd ~/arc-usdc/backend
npm ci --omit=dev
cd ~/arc-usdc/frontend
npm ci --omit=dev
echo -e "\033[0;32m✓ Dependencies updated\033[0m"
echo ""

echo -e "\033[0;33m[3/4] Building frontend...\033[0m"
cd ~/arc-usdc/frontend
npm run build
echo -e "\033[0;32m✓ Frontend built\033[0m"
echo ""

echo -e "\033[0;33m[4/4] Restarting services...\033[0m"
pm2 restart arc-backend
pm2 save
sleep 2
pm2 status
echo -e "\033[0;32m✓ Services restarted\033[0m"
echo ""

echo -e "\033[0;34m════════════════════════════════════════════════════════════\033[0m"
echo -e "\033[0;32m✓ Update completed!\033[0m"
echo -e "\033[0;34m════════════════════════════════════════════════════════════\033[0m"
echo ""
echo "Checking logs..."
pm2 logs arc-backend --lines 10

EOF

echo -e "${GREEN}✓ Done!${NC}"
