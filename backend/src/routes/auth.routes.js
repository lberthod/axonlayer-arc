import { Router } from 'express';
import userStore from '../core/userStore.js';
import { requireAuth } from '../core/auth.js';

const router = Router();

function sanitize(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    walletAddress: user.walletAddress,
    apiKey: user.apiKey,
    usage: user.usage,
    createdAt: user.createdAt
  };
}

router.get('/me', requireAuth, (req, res) => {
  res.json(sanitize(req.user));
});

router.post('/apikey/rotate', requireAuth, async (req, res) => {
  const user = await userStore.rotateApiKey(req.user.uid);
  res.json(sanitize(user));
});

router.post('/wallet', requireAuth, async (req, res) => {
  const address = req.body?.address;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'address required' });
  }
  const user = await userStore.setWalletAddress(req.user.uid, address);
  res.json(sanitize(user));
});

router.post('/role/provider', requireAuth, async (req, res) => {
  if (req.user.role === 'admin') return res.json(sanitize(req.user));
  const user = await userStore.setRole(req.user.uid, 'provider');
  res.json(sanitize(user));
});

export default router;
