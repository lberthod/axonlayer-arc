# Deploy Fix Summary

## Problems Solved

### 1. **Connection Error: `ERR_CONNECTION_REFUSED` on `https://72.61.108.21`**
- **Root Cause**: Firebase Hosting (HTTPS) → Backend (HTTP) = mixed content error
- **Solution**: Created Firebase Cloud Functions proxy (`functions/index.js`) to route `/api/*` requests
- **Result**: Frontend now connects to backend securely through Firebase infrastructure

### 2. **Missing API Methods**
- **Error**: `bt.getMe is not a function`, `bt.getBalances is not a function`
- **Root Cause**: API object had incorrect structure; methods weren't exported properly
- **Solution**: Restructured `frontend/src/services/api.js` with proper namespacing:
  ```javascript
  api.auth.getMe()              // WITH Bearer token
  api.balances.getBalances()    // NEW method
  api.metrics.getMetrics()      // NEW method
  api.auth.becomeProvider()     // NEW method
  api.auth.rotateApiKey()       // NEW method
  ```
- **Result**: All API methods now work with proper authentication

### 3. **CORS Not Configured for Production**
- **Root Cause**: Backend CORS only allowed localhost; Firebase Hosting domain not whitelisted
- **Solution**: Updated `backend/src/config.js` security section:
  ```javascript
  corsOrigins: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://agenthubarc.web.app',
    'http://72.61.108.21:3001'
  ]
  ```

### 4. **HTTPS Support for Backend**
- **Issue**: Browsers block mixed content (HTTPS page → HTTP API)
- **Solution**: Added optional HTTPS to backend (`backend/src/server.js`)
  - Uses `HTTPS_ENABLED` env var
  - Falls back to HTTP if certificates not configured
  - Production can use Let's Encrypt certificates

## Files Modified

### Frontend
- ✅ `frontend/src/services/api.js` - Restructured API object, added auth header support
- ✅ `frontend/src/stores/authStore.js` - Updated to use new API methods
- ✅ `frontend/src/stores/appConfigStore.js` - Fixed getConfig/getHealth calls
- ✅ `frontend/src/components/*.vue` - Updated all API calls to use new structure
- ✅ `frontend/.env.production` - Changed to `/api` (Firebase proxy)

### Backend
- ✅ `backend/src/config.js` - Added CORS origins for production
- ✅ `backend/src/server.js` - Added HTTPS support option

### Infrastructure
- ✅ `firebase.json` - New: Firebase Hosting + Cloud Functions configuration
- ✅ `functions/index.js` - New: API proxy Cloud Function
- ✅ `functions/package.json` - New: Cloud Functions dependencies
- ✅ `deploy.sh` - New: Automated deployment script
- ✅ `DEPLOY.md` - New: Complete deployment guide
- ✅ `.gitignore` - Updated for Firebase and functions

## Deployment Instructions

### Quick Start
```bash
# From project root
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment
```bash
# 1. Build frontend
cd frontend && npm run build && cd ..

# 2. Ensure backend is running
# SSH to VPS and verify: curl http://72.61.108.21:3001/api/health

# 3. Deploy to Firebase
firebase login
firebase deploy
```

## Testing the Fix

1. **Local Testing** (before deploy):
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```
   Visit http://localhost:5173, sign in, verify no console errors

2. **Production Testing** (after deploy):
   - Visit https://agenthubarc.web.app
   - Sign in with Google
   - Open browser DevTools → Network tab
   - Check that `/api/*` requests succeed (proxied through Firebase)
   - Monitor logs: `firebase functions:log`

## Environment Variables Needed

### Backend (.env)
```
PORT=3001
AUTH_ENABLED=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://agenthubarc.web.app,http://72.61.108.21:3001

# Optional: Enable HTTPS
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/path/to/key.pem
HTTPS_CERT_PATH=/path/to/cert.pem
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=/api
VITE_ENVIRONMENT=production
```

## What Changed Under the Hood

1. **Firebase Functions Proxy**
   - All `/api/*` requests go through Firebase Cloud Function
   - Function forwards to backend VPS
   - Handles CORS automatically
   - Converts HTTPS ↔ HTTP seamlessly

2. **API Client Refactoring**
   - Auth calls now include `Authorization: Bearer {token}`
   - Proper error handling
   - Backward compatible aliases for old API methods

3. **Authentication Flow**
   - Firebase Auth → get ID token
   - Include token in Authorization header
   - Backend validates Firebase token
   - Returns user data

## Verification Checklist

- [ ] Backend running on 72.61.108.21:3001
- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Firebase project configured (`firebase projects:list`)
- [ ] npm dependencies installed (`npm install` in functions/ dir)
- [ ] Frontend builds without errors (`npm run build`)
- [ ] No console errors when visiting production URL
- [ ] API calls succeed (check Network tab in DevTools)
- [ ] Can log in with Google
- [ ] User profile loads correctly

## Troubleshooting

### "Failed to fetch" after deployment
1. Check Cloud Functions logs: `firebase functions:log`
2. Verify backend is running: `curl http://72.61.108.21:3001/api/health`
3. Check CORS origins in backend config

### Mixed content warnings still appear
- Your frontend is served over HTTP, not HTTPS
- Check Firebase Hosting domain configuration

### Backend certificate errors (if using HTTPS)
- Generate: `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`
- Set env vars: `HTTPS_KEY_PATH` and `HTTPS_CERT_PATH`

## Next Phase

- [ ] Set up Let's Encrypt for proper HTTPS on backend
- [ ] Add monitoring/alerting for Cloud Functions
- [ ] Implement request rate limiting at proxy level
- [ ] Add caching for common API endpoints
