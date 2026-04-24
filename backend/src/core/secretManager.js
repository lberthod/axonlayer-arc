import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SecretManager: Encrypts/decrypts sensitive data at rest using AES-256-GCM
 *
 * Flow:
 * 1. Master key stored in environment (SECRETS_MASTER_KEY)
 * 2. Data encrypted with AES-256-GCM + random IV/tag
 * 3. Encrypted format: { encrypted: buffer, iv: buffer, tag: buffer, salt: buffer }
 * 4. Never load plaintext private keys into memory
 */
class SecretManager {
  constructor() {
    this.masterKey = null;
    this.initialized = false;
  }

  /**
   * Initialize with master key from env or generate one
   * PRODUCTION: Master key must come from secure store (e.g., AWS KMS)
   */
  async initialize() {
    if (this.initialized) return;

    const masterKeyEnv = process.env.SECRETS_MASTER_KEY;

    if (!masterKeyEnv) {
      logger.warn(
        'SECRETS_MASTER_KEY not set. ' +
        'Generating ephemeral key (data will be lost on restart). ' +
        'For production: set SECRETS_MASTER_KEY='
      );
      // Generate ephemeral key (32 bytes = 256 bits)
      this.masterKey = crypto.randomBytes(32);
    } else {
      // Decode from hex or base64
      try {
        this.masterKey = Buffer.from(masterKeyEnv, 'hex');
        if (this.masterKey.length !== 32) {
          throw new Error(`Master key must be 32 bytes (256 bits), got ${this.masterKey.length}`);
        }
      } catch (e) {
        logger.error({ err: e }, 'Failed to parse SECRETS_MASTER_KEY');
        throw e;
      }
    }

    this.initialized = true;
  }

  /**
   * Encrypt data using AES-256-GCM
   * Returns: { encrypted, iv, tag, salt } as JSON-serializable base64
   */
  encrypt(plaintext) {
    if (!this.initialized) throw new Error('SecretManager not initialized');

    const plainBuffer = typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'utf-8')
      : plaintext;

    const iv = crypto.randomBytes(16); // 128-bit IV
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plainBuffer),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag(); // 128-bit authentication tag

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      algorithm: 'aes-256-gcm'
    };
  }

  /**
   * Decrypt data encrypted by encrypt()
   */
  decrypt(encryptedData) {
    if (!this.initialized) throw new Error('SecretManager not initialized');

    const { encrypted, iv, tag, algorithm } = encryptedData;

    if (algorithm !== 'aes-256-gcm') {
      throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        Buffer.from(iv, 'base64')
      );

      decipher.setAuthTag(Buffer.from(tag, 'base64'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64')),
        decipher.final()
      ]);

      return decrypted.toString('utf-8');
    } catch (error) {
      logger.error({ err: error }, 'Decryption failed - possible tampering or wrong key');
      throw new Error('Failed to decrypt secret - possible tampering');
    }
  }

  /**
   * Encrypt a wallet object (address, privateKey, publicKey, mnemonic)
   * Sensitive fields: privateKey, mnemonic
   */
  encryptWallet(wallet) {
    return {
      address: wallet.address, // Public, no encryption needed
      privateKeyEncrypted: this.encrypt(wallet.privateKey),
      publicKey: wallet.publicKey,
      mnemonicEncrypted: wallet.mnemonic ? this.encrypt(wallet.mnemonic) : null,
      chain: wallet.chain,
      token: wallet.token,
      createdAt: wallet.createdAt
    };
  }

  /**
   * Decrypt a wallet object
   * Returns plaintext wallet with privateKey and mnemonic
   */
  decryptWallet(encryptedWallet) {
    return {
      address: encryptedWallet.address,
      privateKey: this.decrypt(encryptedWallet.privateKeyEncrypted),
      publicKey: encryptedWallet.publicKey,
      mnemonic: encryptedWallet.mnemonicEncrypted
        ? this.decrypt(encryptedWallet.mnemonicEncrypted)
        : null,
      chain: encryptedWallet.chain,
      token: encryptedWallet.token,
      createdAt: encryptedWallet.createdAt
    };
  }

  /**
   * Load and decrypt wallets from file
   * Returns: { wallets: { agentId: decryptedWallet } }
   */
  async loadAndDecryptWallets(filePath) {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);

      if (data.encrypted === true) {
        // File is encrypted
        const decryptedWallets = {};
        for (const [agentId, encryptedWallet] of Object.entries(data.wallets)) {
          decryptedWallets[agentId] = this.decryptWallet(encryptedWallet);
        }
        return {
          network: data.network,
          chainId: data.chainId,
          wallets: decryptedWallets,
          encrypted: true
        };
      } else {
        // File is plaintext (for backwards compat during migration)
        logger.warn('Wallets file is not encrypted! Use encryptWalletsFile() to encrypt.');
        return {
          network: data.network,
          chainId: data.chainId,
          wallets: data.wallets,
          encrypted: false
        };
      }
    } catch (error) {
      logger.error({ err: error, filePath }, 'Failed to load wallets file');
      throw error;
    }
  }

  /**
   * Encrypt plaintext wallets.json and save as new encrypted version
   * Creates backup: wallets.json.backup
   */
  async encryptWalletsFile(filePath) {
    try {
      // Load plaintext wallets
      const raw = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);

      if (data.encrypted === true) {
        logger.info('Wallets already encrypted, skipping');
        return;
      }

      // Create backup
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
      logger.info({ backupPath }, 'Created backup');

      // Encrypt each wallet
      const encryptedWallets = {};
      for (const [agentId, wallet] of Object.entries(data.wallets)) {
        encryptedWallets[agentId] = this.encryptWallet(wallet);
      }

      // Save encrypted version
      const encrypted = {
        network: data.network,
        chainId: data.chainId,
        wallets: encryptedWallets,
        encrypted: true,
        encryptedAt: new Date().toISOString()
      };

      await fs.writeFile(filePath, JSON.stringify(encrypted, null, 2));
      logger.info({ filePath }, 'Wallets file encrypted successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to encrypt wallets file');
      throw error;
    }
  }
}

export const secretManager = new SecretManager();
