import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import userStore from './userStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let adminApp = null;
let adminAuth = null;
let initPromise = null;

async function initFirebase() {
  if (adminAuth) return adminAuth;
  if (!config.auth.enabled) return null;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const admin = await import('firebase-admin');
      const saPath = config.auth.serviceAccountPath;

      let credential;
      if (saPath) {
        const resolved = path.isAbsolute(saPath) ? saPath : path.join(__dirname, '..', '..', saPath);
        const raw = await fs.readFile(resolved, 'utf-8');
        credential = admin.default.credential.cert(JSON.parse(raw));
      } else if (config.auth.firebaseProjectId) {
        credential = admin.default.credential.applicationDefault();
      } else {
        console.warn('[auth] no FIREBASE_PROJECT_ID or service account — auth disabled, anonymous mode only.');
        return null;
      }

      adminApp = admin.default.initializeApp({
        credential,
        projectId: config.auth.firebaseProjectId || undefined
      });
      adminAuth = admin.default.auth(adminApp);
      console.log('[auth] firebase-admin initialized for project', config.auth.firebaseProjectId || '(default)');
      return adminAuth;
    } catch (error) {
      console.error('[auth] firebase-admin init failed:', error.message);
      return null;
    }
  })();

  return initPromise;
}

export async function initializeAuth() {
  await userStore.load();
  await initFirebase();
}

/**
 * Express middleware: reads `Authorization: Bearer <firebaseIdToken>` or
 * `x-api-key: <apiKey>`, verifies, and attaches `req.user` + `req.role`.
 * Anonymous requests are allowed (req.user = null) — guards enforce roles per-route.
 */
export function authMiddleware() {
  return async (req, res, next) => {
    req.user = null;
    req.role = 'anonymous';

    const apiKey = req.header('x-api-key');
    if (apiKey) {
      const user = userStore.getByApiKey(apiKey);
      if (user) {
        req.user = user;
        req.role = user.role;
        return next();
      }
      return res.status(401).json({ error: 'invalid api key' });
    }

    const authHeader = req.header('authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && config.auth.enabled) {
      const auth = await initFirebase();
      if (!auth) return res.status(503).json({ error: 'auth backend not configured' });
      try {
        const decoded = await auth.verifyIdToken(match[1]);
        const user = await userStore.upsertFromFirebase({
          uid: decoded.uid,
          email: decoded.email,
          displayName: decoded.name
        });
        req.user = user;
        req.role = user.role;
        req.firebaseToken = decoded;
      } catch (error) {
        return res.status(401).json({ error: 'invalid id token' });
      }
    }

    next();
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'authentication required' });
    if (roles.length && !roles.includes(req.role)) {
      return res.status(403).json({ error: `role ${req.role} not allowed` });
    }
    next();
  };
}

export const requireAuth = requireRole();
export const requireAdmin = requireRole('admin');
export const requireProvider = requireRole('provider', 'admin');
