# Fix 404 Errors on API Endpoints

## Problem
After deployment, getting 404 errors on API requests:
- `GET https://axonlayer.web.app/api/health 404 (Not Found)`
- `GET https://axonlayer.web.app/api/config 404 (Not Found)`
- `GET https://axonlayer.web.app/api/auth/me 404 (Not Found)`

## Root Cause
Cloud Functions were not deployed correctly. The API proxy function needs to:
1. Have dependencies installed (`npm install` in functions/)
2. Have correct backend URL configuration
3. Be properly exported as `api` (not `apiProxy`)

## Quick Fix

### Step 1: Verify Backend URL
```bash
# Check if backend is accessible
curl http://72.61.108.21:3001/api/health

# Or use the configuration script
./configure-backend-url.sh
```

### Step 2: Install Cloud Functions Dependencies
```bash
cd functions
npm install
cd ..
```

### Step 3: Check Configuration
Verify `functions/index.js` line 8:
- Should be: `const BACKEND_URL = process.env.BACKEND_URL || 'http://72.61.108.21:3001';`
- Replace `72.61.108.21:3001` with your actual backend IP:port

### Step 4: Redeploy
```bash
# Build frontend
cd frontend && npm run build && cd ..

# Deploy everything including Cloud Functions
firebase deploy --debug

# Or deploy only functions (faster)
firebase deploy --only functions
```

### Step 5: Monitor Deployment
```bash
# Check Cloud Functions logs
firebase functions:log

# You should see messages like:
# [Proxy] GET /api/health -> http://72.61.108.21:3001/api/health
```

### Step 6: Test
```bash
# Test from command line
curl https://axonlayer.web.app/api/health

# Or test in browser console
fetch('https://axonlayer.web.app/api/health').then(r => r.json()).then(console.log)
```

## Changes Made

### firebase.json
- Fixed function name from `apiProxy` to `api`
- Changed rewrite pattern from `/api/**` to `/api{,/**}` (more precise)

### functions/index.js
- Simplified Cloud Function implementation
- Added request logging for debugging
- Fixed header proxying
- Removed node-fetch dependency (use native fetch in Node 18+)
- Added `/health` endpoint for proxy testing

### functions/package.json
- Removed node-fetch dependency
- Updated firebase-functions to ^4.8.0
- Ensured Node 20 compatibility

## Debugging Tips

### Cloud Functions won't start?
1. Check for syntax errors: `node functions/index.js`
2. Check dependencies: `npm ls` in functions/ directory
3. Check logs: `firebase functions:log`

### Backend connection fails?
1. Verify backend is running: `curl http://72.61.108.21:3001/api/health`
2. Check firewall: `telnet 72.61.108.21 3001`
3. Verify CORS is configured in backend

### Still getting 404?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check Network tab - confirm request goes to proxy
3. Check Cloud Functions logs for error messages
4. Ensure `firebase deploy` completed without errors

## Full Redeploy Command
```bash
# Complete fresh deployment
rm -rf frontend/dist .firebase
cd frontend && npm run build && cd ..
npm install  # Update dependencies
firebase deploy --force
```

## Expected Result
After successful deployment:
- ✅ `GET /api/health` returns `{"status":"ok"}`
- ✅ `GET /api/config` returns configuration object
- ✅ `GET /api/auth/me` returns user data (with Bearer token)
- ✅ Console shows no 404 errors
- ✅ Cloud Functions logs show proxy messages
