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
    createdAt: user.createdAt,
    wallet: user.wallet,
    balance: user.balance || 0
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

// Create Arc USDC wallet for user
router.post('/wallet/create', requireAuth, async (req, res) => {
  try {
    // Generate a simulated Arc wallet address
    const walletAddress = `0xArc${Math.random().toString(16).substr(2, 40).toUpperCase()}`;
    const wallet = {
      address: walletAddress,
      chain: 'arc',
      token: 'USDC',
      createdAt: new Date().toISOString()
    };

    // Store wallet for user
    const user = await userStore.setWallet(req.user.uid, wallet);
    res.json({
      success: true,
      address: wallet.address,
      user: sanitize(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fund user's wallet (add USDC budget)
router.post('/wallet/fund', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Update user balance
    const currentBalance = req.user.balance || 0;
    const newBalance = currentBalance + amount;

    const user = await userStore.setBalance(req.user.uid, newBalance);

    res.json({
      success: true,
      balance: newBalance,
      transactionId: `tx-${Date.now()}`,
      user: sanitize(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
