# Deployment Guide

## Problems Fixed

### 1. **API Connection Error (ERR_CONNECTION_REFUSED)**
- **Issue**: Frontend couldn't reach backend at `https://72.61.108.21`
- **Root Cause**: Backend was HTTP-only, Firebase Hosting is HTTPS (mixed content blocking)
- **Solution**: Created Firebase Cloud Functions proxy to route `/api/*` requests to backend

### 2. **Missing API Methods**
- **Issue**: `api.getMe()`, `api.getBalances()`, `api.getMetrics()` not exported correctly
- **Fix**: Restructured API object with proper namespacing:
  - `api.auth.getMe()` - with Bearer token
  - `api.balances.getBalances()` - new method
  - `api.metrics.getMetrics()` - new method
  - Added `api.auth.becomeProvider()` and `api.auth.rotateApiKey()`

### 3. **CORS Configuration**
- **Issue**: Backend CORS origins didn't include Firebase Hosting domains
- **Fix**: Updated `backend/src/config.js` to accept:
  - `https://agenthubarc.web.app`
  - `http://72.61.108.21:3001`
  - `https://72.61.108.21`

### 4. **HTTPS Support**
- **Issue**: Mixed content (HTTPS frontend → HTTP backend) blocked by browsers
- **Solution**: 
  - Option 1: Use Firebase Functions proxy (implemented)
  - Option 2: Enable HTTPS on backend with certificates

## Deployment Steps

### Backend (VPS)

1. **No code changes needed** - Backend already listens on port 3001
2. **Update CORS origins** via environment variables:
   ```bash
   export CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://agenthubarc.web.app,http://72.61.108.21:3001"
   ```
3. **Optional: Enable HTTPS** (recommended for production):
   ```bash
   export HTTPS_ENABLED=true
   export HTTPS_KEY_PATH=/path/to/key.pem
   export HTTPS_CERT_PATH=/path/to/cert.pem
   ```
   To generate self-signed cert for testing:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

### Frontend (Firebase Hosting)

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Install Firebase CLI** (if not already):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Deploy**:
   ```bash
   # From project root
   firebase deploy
   ```
   This will deploy:
   - Frontend static assets to Firebase Hosting
   - Cloud Functions for API proxy

## Configuration Files

- **Frontend production env**: `frontend/.env.production`
  - `VITE_API_BASE_URL=/api` (uses Firebase Functions proxy)
  
- **Backend config**: `backend/src/config.js`
  - CORS origins updated for production domains
  
- **Firebase config**: `firebase.json`
  - Routes `/api/**` requests to Cloud Functions
  - Routes `**` to `index.html` (SPA routing)

- **Cloud Functions**: `functions/index.js`
  - Proxies requests from Firebase to backend VPS
  - Handles CORS headers automatically

## Testing

1. **Local testing** (before deploy):
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```
   Frontend at http://localhost:5173 should connect to backend at http://localhost:3001

2. **Production testing** (after deploy):
   - Visit https://agenthubarc.web.app
   - Sign in with Google
   - Check browser console for any API errors
   - Verify `/api/auth/me` endpoint works (check Network tab)

## Troubleshooting

### "Failed to fetch" errors
- Check browser console Network tab for the actual error
- Verify CORS origins in backend config
- Ensure Firebase Functions are deployed

### Mixed content warnings (HTTPS → HTTP)
- Use Firebase Functions proxy (already implemented)
- Or enable HTTPS on backend with proper certificates

### Backend unreachable
- Check VPS firewall allows port 3001
- Verify backend is running: `curl http://72.61.108.21:3001/api/health`
- Check Cloud Functions logs: `firebase functions:log`

## Next Steps

1. Update backend `.env` with production CORS origins
2. Deploy backend to VPS (restart service)
3. Run `firebase deploy` from project root
4. Test at https://agenthubarc.web.app
5. Monitor logs for any issues
