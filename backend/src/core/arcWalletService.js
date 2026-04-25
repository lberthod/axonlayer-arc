import crypto from 'crypto';
import { ethers } from 'ethers';

/**
 * Arc USDC Wallet Service
 * Generates real wallets with private keys for Arc blockchain
 * Uses ethers.js for proper ECDSA address derivation
 */
class ArcWalletService {
  /**
   * Generate a new Arc USDC wallet
   * Returns { address, privateKey, publicKey, mnemonic }
   * Uses ethers.Wallet for proper Ethereum-compatible address generation
   */
  static generateWallet() {
    // Generate random private key (32 bytes = 64 hex chars)
    const privateKeyBuffer = crypto.randomBytes(32);
    const privateKeyHex = '0x' + privateKeyBuffer.toString('hex');

    // Use ethers.Wallet to derive address correctly (ECDSA + Keccak256)
    const wallet = new ethers.Wallet(privateKeyHex);

    // Generate mnemonic-like representation
    const mnemonic = this.generateMnemonic(wallet.privateKey);

    return {
      address: wallet.address,
      privateKey: wallet.privateKey.startsWith('0x') ? wallet.privateKey.slice(2) : wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic,
      chain: 'arc',
      token: 'USDC',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Derive public key from private key
   */
  static derivePublicKey(privateKey) {
    // Simplified: hash the private key to get public key
    const hash = crypto.createHash('sha256').update(privateKey).digest();
    return '0x' + hash.toString('hex');
  }

  /**
   * Generate human-readable mnemonic
   */
  static generateMnemonic(privateKey) {
    // Create a 12-word mnemonic representation
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent',
      'absorb', 'abstract', 'abuse', 'access', 'accident', 'account',
      'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across',
      'act', 'action', 'actor', 'acuity', 'acute', 'adapt'
    ];

    // Use private key to seed word selection
    const seed = parseInt(privateKey.slice(0, 8), 16);
    const mnemonic = [];
    for (let i = 0; i < 12; i++) {
      const index = (seed + i) % words.length;
      mnemonic.push(words[index]);
    }
    return mnemonic.join(' ');
  }

  /**
   * Validate Arc wallet address format
   */
  static isValidAddress(address) {
    if (!address) return false;
    if (typeof address !== 'string') return false;
    if (!address.startsWith('0x')) return false;
    if (address.length !== 42) return false; // 0x + 40 hex chars
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return false;
    return true;
  }

  /**
   * Validate Arc private key format
   */
  static isValidPrivateKey(privateKey) {
    if (!privateKey) return false;
    if (typeof privateKey !== 'string') return false;
    if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) return false; // 64 hex chars
    return true;
  }

  /**
   * Export wallet as JSON (with private key)
   */
  static exportWallet(wallet) {
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic,
      chain: 'arc',
      token: 'USDC',
      createdAt: wallet.createdAt,
      // Security warning
      warning: 'KEEP THIS PRIVATE KEY SECRET. Anyone with access can drain your wallet.'
    };
  }

  /**
   * Import wallet from address + private key
   */
  static importWallet(address, privateKey) {
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid Arc wallet address');
    }
    if (!this.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid Arc private key format (must be 64 hex characters)');
    }

    return {
      address,
      privateKey,
      publicKey: this.derivePublicKey(privateKey),
      mnemonic: this.generateMnemonic(privateKey),
      chain: 'arc',
      token: 'USDC',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Format wallet for display (hide private key)
   */
  static formatForDisplay(wallet) {
    return {
      address: wallet.address,
      chain: wallet.chain,
      token: wallet.token,
      createdAt: wallet.createdAt,
      balance: wallet.balance || 0,
      // Public info only, no private key
      addressShort: wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4)
    };
  }
}

export default ArcWalletService;
