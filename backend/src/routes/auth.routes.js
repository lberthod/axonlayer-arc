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

    // Auto-generate Treasury Wallet for users who don't have one (migration)
    if (!user.treasuryWallet) {
      const treasuryWallet = ArcWalletService.generateWallet();
      user.treasuryWallet = {
        address: treasuryWallet.address,
        privateKey: treasuryWallet.privateKey,
        mnemonic: treasuryWallet.mnemonic,
        createdAt: new Date().toISOString()
      };
      await userStore.store.flush();
      console.log(`[auth/me] Generated Treasury Wallet for user ${user.uid}`);
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

// Get orchestrator wallet address (the wallet that pays agents)
router.get('/wallet/orchestrator', async (req, res) => {
  try {
    const walletManager = (await import('../core/walletManager.js')).default;
    await walletManager.load();
    const address = walletManager.getAddress('orchestrator_wallet');

    if (!address) {
      return res.status(404).json({ error: 'Orchestrator wallet not configured' });
    }

    res.json({
      address,
      description: 'The wallet that pays agents for mission execution',
      network: 'arc-testnet'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all system wallets with balances
router.get('/wallets/system', async (req, res) => {
  try {
    const walletManager = (await import('../core/walletManager.js')).default;
    const arcBlockchain = (await import('../core/arcBlockchainService.js')).default;

    await walletManager.load();

    const walletNames = ['client_wallet', 'orchestrator_wallet', 'worker_wallet', 'validator_wallet'];
    const wallets = [];

    for (const name of walletNames) {
      const address = walletManager.getAddress(name);
      if (address) {
        let balance = 0;
        try {
          const result = await arcBlockchain.getBalance(address);
          balance = result || 0;
        } catch (err) {
          // Balance fetch failed, set to 0
        }

        wallets.push({
          name,
          address,
          balance,
          description: getWalletDescription(name)
        });
      }
    }

    // Add user's Treasury Wallet if available
    if (req.user?.treasuryWallet?.address) {
      let balance = 0;
      try {
        const result = await arcBlockchain.getBalance(req.user.treasuryWallet.address);
        balance = result || 0;
      } catch (err) {
        // Balance fetch failed
      }

      wallets.push({
        name: 'user_treasury_wallet',
        address: req.user.treasuryWallet.address,
        balance,
        description: `Your personal Treasury Wallet for agent payments`,
        owner: req.user.uid
      });
    }

    res.json({ wallets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getWalletDescription(name) {
  const descriptions = {
    'client_wallet': 'System client wallet for mission funding',
    'orchestrator_wallet': 'Orchestrator wallet that executes and pays agents',
    'worker_wallet': 'Worker agent wallet',
    'validator_wallet': 'Validator agent wallet'
  };
  return descriptions[name] || name;
}

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

// Regenerate all wallets and clear old treasury data
router.post('/wallet/regenerate-all', async (req, res) => {
  try {
    if (!config.auth.enabled) {
      return res.status(400).json({ error: 'Not available in dev mode' });
    }
    if (!req.user) return res.status(401).json({ error: 'authentication required' });

    const uid = req.user.uid;

    // Generate new mission wallet
    const newWallet = ArcWalletService.generateWallet();

    // Generate new treasury wallet
    const newTreasuryWallet = ArcWalletService.generateWallet();

    // Update user with new wallets
    let user = await userStore.setWallet(uid, newWallet);

    // Update treasury wallet
    user.treasuryWallet = {
      address: newTreasuryWallet.address,
      privateKey: newTreasuryWallet.privateKey,
      mnemonic: newTreasuryWallet.mnemonic,
      createdAt: new Date().toISOString()
    };
    await userStore.store.flush();

    // Register new wallets in walletManager
    const walletManager = (await import('../core/walletManager.js')).default;
    await walletManager.load();
    await walletManager.registerUserWallet(uid, newWallet);

    // Clear treasury history for this user (archive old data)
    const treasuryStore = (await import('../core/treasuryStore.js')).default;
    treasuryStore.clearUserHistory(uid);

    console.log(`[auth/wallet/regenerate-all] Regenerated wallets for user ${uid}`);

    res.json({
      success: true,
      message: 'All wallets regenerated and treasury history cleared',
      wallet: {
        address: newWallet.address,
        privateKey: newWallet.privateKey,
        mnemonic: newWallet.mnemonic,
        chain: newWallet.chain,
        token: newWallet.token,
        createdAt: newWallet.createdAt,
        instructions: 'Save your new private key in a secure location. Send USDC to this address to fund your account.'
      },
      treasuryWallet: {
        address: newTreasuryWallet.address,
        privateKey: newTreasuryWallet.privateKey,
        mnemonic: newTreasuryWallet.mnemonic,
        createdAt: newTreasuryWallet.createdAt,
        instructions: 'Your new Treasury Wallet for managing agent payments. Keep the private key secure.'
      },
      user: sanitize(user)
    });
  } catch (error) {
    console.error('[auth/wallet/regenerate-all] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
