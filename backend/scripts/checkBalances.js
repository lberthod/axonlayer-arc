/**
 * Query on-chain USDC + native gas balances for every wallet in wallets.json.
 *
 * Usage:
 *   node scripts/checkBalances.js
 */
import { config } from '../src/config.js';
import walletManager from '../src/core/walletManager.js';

async function main() {
  const { ethers } = await import('ethers').catch(() => {
    throw new Error('ethers is required. Run `npm install` first.');
  });

  await walletManager.load();

  if (Object.keys(walletManager.wallets).length === 0) {
    console.error('No wallets.json found. Run `npm run wallets:generate` first.');
    process.exit(1);
  }

  const { rpcUrl, chainId, usdcAddress, nativeGasAsset, nativeUsdc, nativeDecimals, label } = config.walletProvider.onChain;
  const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);

  console.log(`\nNetwork: ${label} (chainId ${chainId})`);
  console.log(`RPC:     ${rpcUrl}`);
  if (nativeUsdc) {
    console.log(`USDC:    NATIVE (gas asset, ${nativeDecimals} decimals)\n`);
  } else {
    console.log(`USDC:    ${usdcAddress || '(not configured)'}\n`);
  }

  const erc20Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  let usdc = null;
  let erc20Decimals = 6;
  if (!nativeUsdc && usdcAddress && usdcAddress !== '0x0000000000000000000000000000000000000000') {
    usdc = new ethers.Contract(usdcAddress, erc20Abi, provider);
    try {
      erc20Decimals = Number(await usdc.decimals());
    } catch {
      console.warn('(Could not fetch decimals; assuming 6.)');
    }
  }

  if (nativeUsdc) {
    console.log('Wallet'.padEnd(28), 'Address'.padEnd(44), 'USDC (native)'.padStart(16));
    console.log('-'.repeat(90));
    for (const [id, w] of Object.entries(walletManager.wallets)) {
      const nativeBalance = await provider.getBalance(w.address).catch(() => 0n);
      console.log(
        id.padEnd(28),
        w.address.padEnd(44),
        ethers.formatUnits(nativeBalance, nativeDecimals).padStart(16)
      );
    }
  } else {
    console.log('Wallet'.padEnd(28), 'Address'.padEnd(44), `${nativeGasAsset} gas`.padStart(14), 'USDC'.padStart(14));
    console.log('-'.repeat(100));
    for (const [id, w] of Object.entries(walletManager.wallets)) {
      const nativeBalance = await provider.getBalance(w.address).catch(() => 0n);
      let usdcBalance = 0n;
      if (usdc) {
        usdcBalance = await usdc.balanceOf(w.address).catch(() => 0n);
      }
      console.log(
        id.padEnd(28),
        w.address.padEnd(44),
        ethers.formatEther(nativeBalance).padStart(14),
        ethers.formatUnits(usdcBalance, erc20Decimals).padStart(14)
      );
    }
  }

  console.log();
}

main().catch((err) => {
  console.error('Failed to check balances:', err.message);
  process.exit(1);
});
