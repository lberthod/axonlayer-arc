/**
 * Generate one EVM EOA per logical agent wallet and write them to
 * src/data/wallets.json.
 *
 * Usage:
 *   node scripts/generateWallets.js [--force]
 *
 * Safety:
 *   - Refuses to overwrite an existing wallets.json unless --force is passed.
 *   - The output file is gitignored by default.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT = path.join(__dirname, '..', 'src', 'data', 'wallets.json');

const WALLET_IDS = Object.keys(config.initialBalances);

async function main() {
  const { ethers } = await import('ethers').catch(() => {
    throw new Error('ethers is required. Run `npm install` first.');
  });

  const force = process.argv.includes('--force');

  try {
    await fs.access(OUTPUT);
    if (!force) {
      console.error(`Refusing to overwrite ${OUTPUT} (use --force to replace).`);
      process.exit(1);
    }
  } catch {
    // file does not exist — good
  }

  const wallets = {};
  for (const id of WALLET_IDS) {
    const w = ethers.Wallet.createRandom();
    wallets[id] = { address: w.address, privateKey: w.privateKey };
  }

  const payload = {
    network: config.walletProvider.onChain.network,
    chainId: config.walletProvider.onChain.chainId,
    label: config.walletProvider.onChain.label,
    generatedAt: new Date().toISOString(),
    wallets
  };

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2), { mode: 0o600 });

  console.log(`\nGenerated ${WALLET_IDS.length} wallets for ${payload.label} (chainId ${payload.chainId}).`);
  console.log(`File: ${OUTPUT}`);
  console.log('\nAddresses:');
  for (const [id, w] of Object.entries(wallets)) {
    console.log(`  ${id.padEnd(28)} ${w.address}`);
  }

  if (config.walletProvider.onChain.faucet) {
    console.log(`\nFund these addresses on ${payload.label} via: ${config.walletProvider.onChain.faucet}`);
  }

  console.log('\nNext steps:');
  console.log('  1. Fund `client_wallet` (and `orchestrator_wallet` for gas) with testnet USDC.');
  console.log('  2. Set WALLET_PROVIDER=onchain and ONCHAIN_DRY_RUN=false in backend/.env.');
  console.log('  3. Restart the backend.\n');
}

main().catch((err) => {
  console.error('Failed to generate wallets:', err.message);
  process.exit(1);
});
