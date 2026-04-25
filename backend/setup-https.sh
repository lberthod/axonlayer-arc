#!/bin/bash

echo "🔒 Setting up HTTPS for ARC USDC Backend"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL not found. Install it first:${NC}"
    echo "  macOS: brew install openssl"
    echo "  Ubuntu: sudo apt-get install openssl"
    exit 1
fi

# Step 1: Generate certificates
echo -e "${YELLOW}📜 Generating SSL certificates...${NC}"
echo ""
echo "You'll be asked some questions. You can press Enter to skip most of them."
echo "The important one is 'Common Name (CN)' - enter your server IP or domain"
echo ""

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

if [ ! -f "key.pem" ] || [ ! -f "cert.pem" ]; then
    echo -e "${RED}❌ Certificate generation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Certificates generated${NC}"
echo "  - key.pem (private key)"
echo "  - cert.pem (certificate)"
echo ""

# Step 2: Update .env
echo -e "${YELLOW}📝 Updating .env configuration...${NC}"

# Check if HTTPS_ENABLED is already in .env
if grep -q "HTTPS_ENABLED" .env; then
    echo "HTTPS_ENABLED already in .env, updating..."
    sed -i.bak 's/HTTPS_ENABLED=.*/HTTPS_ENABLED=true/' .env
else
    echo "HTTPS_ENABLED=true" >> .env
fi

# Add HTTPS_KEY_PATH
if grep -q "HTTPS_KEY_PATH" .env; then
    sed -i.bak 's|HTTPS_KEY_PATH=.*|HTTPS_KEY_PATH=./key.pem|' .env
else
    echo "HTTPS_KEY_PATH=./key.pem" >> .env
fi

# Add HTTPS_CERT_PATH
if grep -q "HTTPS_CERT_PATH" .env; then
    sed -i.bak 's|HTTPS_CERT_PATH=.*|HTTPS_CERT_PATH=./cert.pem|' .env
else
    echo "HTTPS_CERT_PATH=./cert.pem" >> .env
fi

echo -e "${GREEN}✓ .env updated${NC}"
echo ""

# Step 3: Update CORS origins
echo -e "${YELLOW}🔐 Updating CORS origins for HTTPS...${NC}"

# Update .env with HTTPS origins
if grep -q "CORS_ORIGINS" .env; then
    # Add HTTPS origin to existing CORS_ORIGINS
    CURRENT_CORS=$(grep "CORS_ORIGINS=" .env | sed 's/CORS_ORIGINS=//')
    NEW_CORS="$CURRENT_CORS,https://72.61.108.21,https://axonlayer.web.app"
    sed -i.bak "s|CORS_ORIGINS=.*|CORS_ORIGINS=$NEW_CORS|" .env
else
    echo 'CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://72.61.108.21,http://72.61.108.21:3001,https://axonlayer.web.app' >> .env
fi

echo -e "${GREEN}✓ CORS origins updated${NC}"
echo ""

# Step 4: Show configuration
echo -e "${BLUE}📋 Current HTTPS Configuration:${NC}"
echo ""
echo "Backend URL (for frontend .env.production):"
echo -e "  ${YELLOW}VITE_API_BASE_URL=https://72.61.108.21:3001${NC}"
echo ""
echo ".env settings:"
grep -E "HTTPS_ENABLED|HTTPS_KEY_PATH|HTTPS_CERT_PATH" .env
echo ""

# Step 5: Start instructions
echo -e "${GREEN}✅ HTTPS Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1️⃣  Update frontend .env.production:"
echo -e "   ${BLUE}VITE_API_BASE_URL=https://72.61.108.21:3001${NC}"
echo ""
echo "2️⃣  Rebuild and redeploy frontend:"
echo "   cd frontend"
echo "   npm run build"
echo "   firebase deploy --only hosting"
echo ""
echo "3️⃣  Restart backend with HTTPS:"
echo "   npm run dev"
echo "   or: npm start"
echo ""
echo "4️⃣  Test:"
echo -e "   ${BLUE}curl -k https://72.61.108.21:3001/api/health${NC}"
echo "   (The -k flag ignores self-signed certificate warnings)"
echo ""
echo -e "${YELLOW}⚠️  Warning:${NC}"
echo "This is a self-signed certificate for testing only."
echo "For production, use Let's Encrypt or a proper CA certificate."
echo ""
