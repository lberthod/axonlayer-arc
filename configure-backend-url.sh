#!/bin/bash

echo "🔧 Configure Backend URL for Cloud Functions"
echo "=============================================="
echo ""

# Current backend URL in functions/index.js
CURRENT_URL=$(grep "BACKEND_URL = " functions/index.js | sed "s/.*BACKEND_URL = process.env.BACKEND_URL || '\(.*\)'.*/\1/")
echo "Current backend URL in functions/index.js:"
echo "  $CURRENT_URL"
echo ""

# Test current URL
if command -v curl &> /dev/null; then
    echo "Testing backend health endpoint..."
    if curl -s "$CURRENT_URL/api/health" > /dev/null 2>&1; then
        echo "✅ Backend is accessible at: $CURRENT_URL"
    else
        echo "❌ Cannot reach backend at: $CURRENT_URL"
        echo ""
        echo "Enter your backend URL (e.g., http://72.61.108.21:3001):"
        read -p "Backend URL: " NEW_URL

        if [ -z "$NEW_URL" ]; then
            echo "No URL provided. Exiting."
            exit 1
        fi

        # Test new URL
        echo "Testing new URL..."
        if curl -s "$NEW_URL/api/health" > /dev/null 2>&1; then
            echo "✅ New backend is accessible!"

            # Update functions/index.js
            sed -i.bak "s|BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'|BACKEND_URL = process.env.BACKEND_URL || '$NEW_URL'|" functions/index.js
            echo "Updated functions/index.js with new backend URL"

            # Also set environment variable for local testing
            export BACKEND_URL="$NEW_URL"
            echo "Set BACKEND_URL=$NEW_URL"
        else
            echo "❌ Cannot reach new URL: $NEW_URL"
            exit 1
        fi
    fi
else
    echo "⚠️  curl not found. Cannot test backend URL."
    echo ""
    echo "Manually set backend URL:"
    echo "1. Edit functions/index.js"
    echo "2. Change line: const BACKEND_URL = process.env.BACKEND_URL || '...'"
    echo "3. Set to your backend URL (e.g., http://72.61.108.21:3001)"
fi

echo ""
echo "✅ Configuration complete. Ready to deploy with: firebase deploy"
