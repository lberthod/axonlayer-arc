import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * WalletManager: loads the per-agent on-chain wallet map.
 *
 * File shape (src/data/wallets.json):
 * {
 *   "network": "arc-testnet",
 *   "chainId": 6699,
 *   "wallets": {
 *     "client_wallet":       { "address": "0x...", "privateKey": "0x..." },
 *     "orchestrator_wallet": { "address": "0x...", "privateKey": "0x..." },
 *     ...
 *   }
 * }
 *
 * The file is produced by `npm run wallets:generate` and must never be committed.
 */
class WalletManager {
  constructor() {
    this.loaded = false;
    this.wallets = {};
    this.ethers = null;
    this.provider = null;
    this.signers = {};
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

    const filePath = this.resolvePath(config.walletProvider.onChain.walletsFile);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.wallets = parsed.wallets || {};
      this.metadata = {
        network: parsed.network,
        chainId: parsed.chainId
      };
    } catch (error) {
      this.wallets = {};
      this.metadata = { network: null, chainId: null };
    }

    return this;
  }

  has(walletId) {
    return Boolean(this.wallets[walletId]);
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
    // Handle cache by both wallet ID and address
    if (this.signers[walletIdOrAddress]) return this.signers[walletIdOrAddress];

    let entry = this.wallets[walletIdOrAddress];

    // If not found by ID, try to reverse-map address to wallet ID
    if (!entry) {
      for (const [id, wallet] of Object.entries(this.wallets)) {
        if (wallet.address?.toLowerCase() === walletIdOrAddress?.toLowerCase()) {
          entry = wallet;
          break;
        }
      }
    }

    // Fallback: use orchestrator_wallet for treasury requests
    if (!entry && (walletIdOrAddress === 'arc_treasury_wallet' || walletIdOrAddress === 'treasury_wallet')) {
      entry = this.wallets['orchestrator_wallet'];
    }

    if (!entry?.privateKey) return null;

    const ethers = await this.ensureEthers();
    const provider = await this.getProvider();
    const signer = new ethers.Wallet(entry.privateKey, provider);
    this.signers[walletIdOrAddress] = signer;
    return signer;
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
