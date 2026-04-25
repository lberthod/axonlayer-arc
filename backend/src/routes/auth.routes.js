import { Router } from 'express';
import userStore from '../core/userStore.js';
import ArcWalletService from '../core/arcWalletService.js';
import arcBlockchain from '../core/arcBlockchainService.js';
import { config } from '../config.js';

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
    treasuryWallet: user.treasuryWallet,
    balance: user.balance || 0
  };
}

router.get('/me', async (req, res) => {
  try {
    let user = req.user;

    // In dev mode (auth disabled), get the first user from store
    if (!config.auth.enabled && !user) {
      const allUsers = Object.values(userStore.users);
      if (allUsers.length > 0) {
        user = allUsers[0];
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'authentication required' });
    }

    // Get real on-chain balance if user has wallet
    if (user.wallet?.address) {
      try {
        const onChainBalance = await arcBlockchain.getBalance(user.wallet.address);
        user.balance = onChainBalance;
        await userStore.store.flush();
      } catch (err) {
        console.warn('Could not fetch on-chain balance:', err.message);
      }
    }

    const sanitized = sanitize(user);
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/apikey/rotate', async (req, res) => {
  if (!config.auth.enabled) {
    return res.json({ apiKey: 'dev-api-key-rotated' });
  }
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  const user = await userStore.rotateApiKey(req.user.uid);
  res.json(sanitize(user));
});

router.post('/wallet', async (req, res) => {
  const address = req.body?.address;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'address required' });
  }
  if (!config.auth.enabled) {
    return res.json({ walletAddress: address });
  }
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  const user = await userStore.setWalletAddress(req.user.uid, address);
  res.json(sanitize(user));
});

router.post('/role/provider', async (req, res) => {
  if (!config.auth.enabled) {
    return res.json({ role: 'provider' });
  }
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  if (req.user.role === 'admin') return res.json(sanitize(req.user));
  const user = await userStore.setRole(req.user.uid, 'provider');
  res.json(sanitize(user));
});

// Create Arc USDC wallet for user
router.post('/wallet/create', async (req, res) => {
  try {
    // Generate a real Arc USDC wallet with private key
    const wallet = ArcWalletService.generateWallet();

    let uid, user;
    if (!config.auth.enabled) {
      // Dev mode: use dev user UID
      uid = 'dev-user-000';
      // Ensure dev user exists in store
      const existingUser = userStore.getByUid(uid);
      if (!existingUser) {
        await userStore.upsertFromFirebase({
          uid: 'dev-user-000',
          email: 'dev@localhost',
          displayName: 'Dev User'
        });
      }
    } else {
      if (!req.user) return res.status(401).json({ error: 'authentication required' });
      uid = req.user.uid;
    }

    // Store wallet for user (both dev and prod modes)
    user = await userStore.setWallet(uid, wallet);

    // Register wallet in walletManager so it can be used for on-chain transactions
    const walletManager = (await import('../core/walletManager.js')).default;
    await walletManager.load();
    await walletManager.registerUserWallet(uid, wallet);

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
        instructions: 'Save your private key and mnemonic in a secure location. You will need to send USDC to this address to fund your account.'
      },
      user: sanitize(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blockchain status (debug info)
router.get('/blockchain/status', async (req, res) => {
  try {
    const status = await arcBlockchain.getNetworkStatus();
    res.json({
      rpc: arcBlockchain.rpcUrl,
      usdcContract: arcBlockchain.usdcContractAddress,
      providerInitialized: !!arcBlockchain.provider,
      contractInitialized: !!arcBlockchain.usdcContract,
      ...status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blockchain debug info
router.get('/blockchain/debug', async (req, res) => {
  try {
    const info = {
      rpc: arcBlockchain.rpcUrl,
      usdcContract: arcBlockchain.usdcContractAddress,
      providerInitialized: !!arcBlockchain.provider,
      contractInitialized: !!arcBlockchain.usdcContract,
      timestamp: new Date().toISOString()
    };

    if (arcBlockchain.provider) {
      try {
        const network = await arcBlockchain.provider.getNetwork();
        info.network = {
          name: network.name,
          chainId: network.chainId
        };
        const block = await arcBlockchain.provider.getBlockNumber();
        info.latestBlock = block;
      } catch (e) {
        info.networkError = e.message;
      }
    }

    res.json(info);
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

// Debug: Test contract call directly
router.get('/wallet/balance-debug/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!arcBlockchain.isValidArcAddress(address)) {
      return res.status(400).json({ error: 'Invalid Arc address format' });
    }

    const debugInfo = {
      address,
      rpc: arcBlockchain.rpcUrl,
      contract: arcBlockchain.usdcContractAddress,
      timestamp: new Date().toISOString()
    };

    // Check provider
    if (!arcBlockchain.provider) {
      debugInfo.providerStatus = 'NOT_INITIALIZED';
      return res.json(debugInfo);
    }

    // Check network
    try {
      const network = await arcBlockchain.provider.getNetwork();
      debugInfo.network = network;
    } catch (e) {
      debugInfo.networkError = e.message;
    }

    // Try to call balanceOf directly
    try {
      if (!arcBlockchain.usdcContract) {
        debugInfo.contractStatus = 'NOT_INITIALIZED';
      } else {
        const rawBalance = await arcBlockchain.usdcContract.balanceOf(address);
        debugInfo.rawBalance = rawBalance.toString();
        debugInfo.balanceDecimal = Number(rawBalance.toString()) / 1e6;
      }
    } catch (e) {
      debugInfo.contractError = e.message;
      debugInfo.contractErrorCode = e.code;
    }

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
