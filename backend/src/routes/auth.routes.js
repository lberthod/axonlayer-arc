import { Router } from 'express';
import userStore from '../core/userStore.js';
import { requireAuth } from '../core/auth.js';
import ArcWalletService from '../core/arcWalletService.js';
import arcBlockchain from '../core/arcBlockchainService.js';

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

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = sanitize(req.user);

    // Get real on-chain balance if user has wallet
    if (user.wallet?.address) {
      const onChainBalance = await arcBlockchain.getBalance(user.wallet.address);
      user.onChainBalance = onChainBalance;
      // Update stored balance with on-chain balance
      user.balance = onChainBalance;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user balance:', error);
    res.json(sanitize(req.user));
  }
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
    // Generate a real Arc USDC wallet with private key
    const wallet = ArcWalletService.generateWallet();
    wallet.balance = 0;

    // Store wallet for user (including private key for security)
    const user = await userStore.setWallet(req.user.uid, wallet);

    // Return wallet details INCLUDING private key (user must secure it)
    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic,
        chain: wallet.chain,
        token: wallet.token,
        createdAt: wallet.createdAt,
        // Instructions for user
        instructions: 'Save your private key and mnemonic in a secure location. You will need to send USDC to this address to fund your account.'
      },
      user: sanitize(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blockchain status
router.get('/blockchain/status', async (req, res) => {
  try {
    const status = await arcBlockchain.getNetworkStatus();
    res.json({
      rpc: arcBlockchain.rpcUrl,
      usdcContract: arcBlockchain.usdcContractAddress,
      ...status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get on-chain balance for wallet
router.get('/wallet/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!arcBlockchain.isValidArcAddress(address)) {
      return res.status(400).json({ error: 'Invalid Arc address format' });
    }

    const balance = await arcBlockchain.getBalance(address);
    res.json({
      address,
      balance,
      currency: 'USDC',
      network: 'arc-testnet'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
