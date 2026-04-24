#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import { secretManager } from '../src/core/secretManager.js';

const logger = pino();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('🔐 Wallet Encryption Utility\n');

  if (!process.env.SECRETS_MASTER_KEY) {
    console.log('⚠️  SECRETS_MASTER_KEY not set.');
    console.log('   Set it before running this script:');
    console.log('   export SECRETS_MASTER_KEY=$(node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")');
    console.log('\n   Or use an existing master key from your KMS/vault.\n');
    process.exit(1);
  }

  const walletsPath = path.join(__dirname, '..', 'src', 'data', 'wallets.json');

  await secretManager.initialize();
  console.log('✓ Master key loaded from SECRETS_MASTER_KEY\n');

  try {
    console.log(`📁 Encrypting wallets file: ${walletsPath}\n`);
    await secretManager.encryptWalletsFile(walletsPath);
    console.log('✅ Wallets encrypted successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Verify the encrypted wallets.json');
    console.log('   2. Keep wallets.json.backup as a recovery copy');
    console.log('   3. Set SECRETS_MASTER_KEY in your production environment');
    console.log('   4. Run: npm start\n');
  } catch (error) {
    logger.error({ err: error }, 'Encryption failed');
    process.exit(1);
  }
}

main();
