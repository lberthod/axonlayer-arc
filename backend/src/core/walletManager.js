import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import { config } from '../config.js';
import { secretManager } from './secretManager.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * WalletManager: loads the per-agent on-chain wallet map.
 *
 * File shape (src/data/wallets.json) - ENCRYPTED:
 * {
 *   "network": "arc-testnet",
 *   "chainId": 6699,
 *   "encrypted": true,
 *   "wallets": {
 *     "client_wallet": {
 *       "address": "0x...",
 *       "privateKeyEncrypted": { "encrypted": "...", "iv": "...", "tag": "..." },
 *       "publicKey": "0x...",
 *       "mnemonicEncrypted": { ... } or null
 *     }
 *   }
 * }
 *
 * Private keys are ONLY decrypted when needed and cleared from memory after use.
 */
class WalletManager {
  constructor() {
    this.loaded = false;
    this.wallets = {}; // Only stores address, publicKey (no private keys!)
    this.encryptedWallets = {}; // Encrypted wallet data
    this.ethers = null;
    this.provider = null;
    this.signers = {}; // Cache of ethers.Wallet signers
    this.usdcContracts = {};
  }

  resolvePath(relPath) {
    return path.isAbsolute(relPath)
      ? relPath
      : path.join(__dirname, '..', '..', relPath);
  }

  async load() {
    if (this.loaded) return this;
    this.loaded = true;

    await secretManager.initialize();

    const filePath = this.resolvePath(config.walletProvider.onChain.walletsFile);

    try {
      const data = await secretManager.loadWallets(filePath);

      // Store encrypted wallets for on-demand decryption
      this.encryptedWallets = data.wallets;

      // Store only public data (addresses, etc.)
      this.wallets = {};
      for (const [agentId, wallet] of Object.entries(data.wallets)) {
        this.wallets[agentId] = {
          address: wallet.address,
          publicKey: wallet.publicKey,
          chain: wallet.chain,
          token: wallet.token
          // ❌ NEVER store privateKey or mnemonic here
        };
      }

      this.metadata = {
        network: data.network,
        chainId: data.chainId,
        encrypted: data.encrypted
      };

      logger.info({ agentCount: Object.keys(this.wallets).length, encrypted: data.encrypted },
        'Wallets loaded successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to load wallets');
      this.wallets = {};
      this.encryptedWallets = {};
      this.metadata = { network: null, chainId: null, encrypted: false };
    }

    return this;
  }

  has(walletId) {
    return Boolean(this.wallets[walletId]);
  }

  // Register a user wallet dynamically (for Arc user wallets created at runtime)
  // Private key is encrypted immediately and only decrypted on-demand
  async registerUserWallet(userId, walletData) {
    const walletId = `user_${userId}`;

    // Encrypt the wallet data
    const encryptedWallet = secretManager.encryptWallet({
      address: walletData.address,
      privateKey: walletData.privateKey,
      publicKey: walletData.publicKey || walletData.address,
      mnemonic: walletData.mnemonic || null,
      chain: 'arc',
      token: 'USDC',
      createdAt: new Date().toISOString()
    });

    // Store encrypted version
    this.encryptedWallets[walletId] = encryptedWallet;

    // Store only public data
    this.wallets[walletId] = {
      address: walletData.address,
      publicKey: walletData.publicKey || walletData.address,
      chain: 'arc',
      token: 'USDC'
    };

    // Clear signer cache for this wallet
    delete this.signers[walletId];
    delete this.signers[walletData.address];

    // Persist to wallets.json file for permanence
    try {
      const walletsPath = this.resolvePath(config.walletProvider.onChain.walletsFile);
      const raw = await fs.readFile(walletsPath, 'utf-8');
      const data = JSON.parse(raw);
      data.wallets[walletId] = encryptedWallet;
      await fs.writeFile(walletsPath, JSON.stringify(data, null, 2));
      logger.info({ walletId, address: walletData.address }, 'User wallet persisted to file');
    } catch (err) {
      logger.warn({ err, walletId }, 'Failed to persist user wallet to file');
      // Don't fail the registration, wallet works in-memory but won't survive restart
    }

    logger.info({ walletId, address: walletData.address }, 'User wallet registered');
    return walletId;
  }

  getAddress(walletId) {
    return this.wallets[walletId]?.address || null;
  }

  getAllAddresses() {
    return Object.fromEntries(
      Object.entries(this.wallets).map(([id, w]) => [id, w.address])
    );
  }

  async ensureEthers() {
    if (this.ethers) return this.ethers;
    const mod = await import('ethers');
    this.ethers = mod.ethers;
    return this.ethers;
  }

  async getProvider() {
    if (this.provider) return this.provider;
    const ethers = await this.ensureEthers();
    const { rpcUrl, chainId } = config.walletProvider.onChain;
    this.provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    return this.provider;
  }

  async getSigner(walletIdOrAddress) {
    // Return cached signer if available
    if (this.signers[walletIdOrAddress]) return this.signers[walletIdOrAddress];

    let walletId = walletIdOrAddress;

    // If passed an address, find the wallet ID
    if (!this.wallets[walletId]) {
      for (const [id, wallet] of Object.entries(this.wallets)) {
        if (wallet.address?.toLowerCase() === walletIdOrAddress?.toLowerCase()) {
          walletId = id;
          break;
        }
      }
    }

    // Fallback: use orchestrator_wallet for treasury requests
    if (!this.wallets[walletId] &&
        (walletIdOrAddress === 'arc_treasury_wallet' || walletIdOrAddress === 'treasury_wallet')) {
      walletId = 'orchestrator_wallet';
    }

    const publicWallet = this.wallets[walletId];
    const encryptedWallet = this.encryptedWallets[walletId];

    if (!publicWallet || !encryptedWallet) return null;

    // Decrypt private key on-demand (not stored in memory)
    let privateKey;
    try {
      privateKey = secretManager.decrypt(encryptedWallet.privateKeyEncrypted);
    } catch (error) {
      logger.error({ err: error, walletId }, 'Failed to decrypt private key');
      return null;
    }

    const ethers = await this.ensureEthers();
    const provider = await this.getProvider();

    try {
      const signer = new ethers.Wallet(privateKey, provider);
      this.signers[walletId] = signer;
      this.signers[publicWallet.address] = signer;

      // Clear the decrypted key from memory immediately
      privateKey = null;

      return signer;
    } catch (error) {
      logger.error({ err: error }, 'Failed to create signer');
      privateKey = null;
      return null;
    }
  }

  async getUsdcContract(walletId) {
    if (this.usdcContracts[walletId]) return this.usdcContracts[walletId];

    const signer = await this.getSigner(walletId);
    if (!signer) return null;

    const ethers = await this.ensureEthers();
    const erc20Abi = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];

    const contract = new ethers.Contract(
      config.walletProvider.onChain.usdcAddress,
      erc20Abi,
      signer
    );

    this.usdcContracts[walletId] = contract;
    return contract;
  }
}

export default new WalletManager();
