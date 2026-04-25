import ledger from './ledger.js';
import walletManager from './walletManager.js';
import treasuryStore from './treasuryStore.js';
import { config } from '../config.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Check if an error is retryable (transient network issue)
 */
function isRetryableRpcError(error) {
  const msg = String(
    error?.message ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    ''
  ).toLowerCase();

  return (
    msg.includes('txpool is full') ||
    msg.includes('timeout') ||
    msg.includes('could not coalesce error') ||
    msg.includes('nonce too low') ||
    msg.includes('replacement fee too low') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset')
  );
}

/**
 * Sleep for N milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff for retryable errors
 */
async function sendWithRetry(sendFn, maxRetries = 10) {  // ← Increased from 5 to 10
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendFn();
    } catch (error) {
      lastError = error;
      if (!isRetryableRpcError(error)) {
        throw error;
      }

      // Check if txpool is full - add extra delay
      const isTxpoolFull = String(error?.message || '').toLowerCase().includes('txpool is full');
      const basedelay = 1000 * Math.pow(1.5, attempt - 1);  // Exponential backoff
      const extraDelay = isTxpoolFull ? (3000 + Math.random() * 5000) : 0;  // 3-8s extra for txpool
      const jitter = Math.random() * 500;
      const totalDelay = basedelay + extraDelay + jitter;

      logger.warn(
        { attempt, maxRetries, delay: Math.round(totalDelay), isTxpoolFull, error: error.message },
        '[onchain] retryable RPC error, will retry'
      );
      await sleep(totalDelay);
    }
  }
  throw lastError;
}

/**
 * WalletProvider is the abstraction layer over the actual settlement backend.
 * Two implementations are supplied:
 *
 *   - SimulatedWalletProvider: uses the internal Ledger (default, fully offline)
 *   - OnChainWalletProvider:   speaks to an EVM chain via JSON-RPC to move
 *                              real USDC (ERC-20). Runs in dryRun mode by
 *                              default so nothing is actually broadcast
 *                              unless explicit credentials are provided.
 *
 * Selection is driven by config.walletProvider.mode.
 */

/**
 * Helper: resolve a wallet ID or address to an actual Arc address
 * Handles:
 *   - Treasury wallet ID -> treasuryStore.getAddress()
 *   - Wallet IDs from walletManager (wallets.json)
 *   - Already-valid Arc addresses (0x...)
 *   - Mission wallet IDs (not on-chain) -> returns as-is for ledger mode
 */
function resolveAddress(walletIdOrAddress) {
  if (!walletIdOrAddress) return null;

  // Check if it's already a valid Arc address
  try {
    if (typeof walletIdOrAddress === 'string' && walletIdOrAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
      return walletIdOrAddress;
    }
  } catch (_e) {
    // Not an address, try other resolution methods
  }

  // Check treasury
  if (walletIdOrAddress === 'arc_treasury_wallet' || walletIdOrAddress === 'orchestrator_wallet') {
    const treasuryAddr = treasuryStore.getAddress();
    if (treasuryAddr) return treasuryAddr;
  }

  // Check walletManager
  const managerAddr = walletManager.getAddress(walletIdOrAddress);
  if (managerAddr) return managerAddr;

  // Return as-is (may be symbolic ID for ledger mode)
  return walletIdOrAddress;
}

class SimulatedWalletProvider {
  constructor() {
    this.mode = 'simulated';
  }

  async transfer(from, to, amount, asset, reason, taskId, type = 'payment') {
    const tx = await ledger.createTransaction(from, to, amount, asset, reason, taskId, type);
    return { ...tx, settlementType: 'simulated' };
  }

  async getBalance(walletId) {
    return ledger.getBalance(walletId);
  }

  async getAllBalances() {
    return ledger.getAllBalances();
  }

  async getTransactions(filters = {}) {
    return ledger.getTransactions(filters);
  }

  async setInitialBalances(initialBalances) {
    return ledger.setInitialBalances(initialBalances);
  }

  async hasExistingBalances() {
    const balances = ledger.getAllBalances();
    return Object.keys(balances).length > 0;
  }
}

/**
 * OnChainWalletProvider
 *
 * EVM adapter for ERC-20 USDC transfers, used for Circle Arc and other
 * EVM-compatible chains. Each agent wallet (`client_wallet`,
 * `worker_wallet`, ...) maps to its own on-chain EOA via `walletManager`.
 * A transfer from `X -> Y` is signed by X's EOA and broadcast to the chain,
 * while still being mirrored into the internal ledger so UI/metrics/history
 * continue to work identically.
 *
 * If ethers is missing, credentials aren't configured, or `dryRun=true`,
 * the provider labels the transaction as `onchain-dryrun` and only updates
 * the local ledger — nothing hits the chain.
 */

class OnChainWalletProvider {
  constructor(options) {
    this.mode = 'onchain';
    this.options = options;
    this.dryRun = options.dryRun !== false;
    this.ethers = null;
    this.ready = false;
    this.txHashMap = new Map(); // Store on-chain metadata keyed by ledger tx ID
  }

  async ensureReady() {
    if (this.ready) return true;
    this.ready = true;

    try {
      const mod = await import('ethers');
      this.ethers = mod.ethers;
    } catch (error) {
      console.warn('[OnChainWalletProvider] ethers unavailable — forcing dryRun:', error.message);
      this.dryRun = true;
      return false;
    }

    await walletManager.load();

    if (Object.keys(walletManager.wallets).length === 0) {
      console.warn('[OnChainWalletProvider] no wallets.json found — forcing dryRun. Run `npm run wallets:generate` first.');
      this.dryRun = true;
      return false;
    }

    // For ERC-20 networks we need a real USDC contract address.
    // For nativeUsdc networks (Arc), USDC IS the gas asset → no contract needed.
    if (!this.options.nativeUsdc) {
      if (!this.options.usdcAddress || this.options.usdcAddress === '0x0000000000000000000000000000000000000000') {
        console.warn('[OnChainWalletProvider] ONCHAIN_USDC_ADDRESS not configured — forcing dryRun.');
        this.dryRun = true;
        return false;
      }
    }

    return !this.dryRun;
  }

  async transfer(from, to, amount, asset, reason, taskId, type = 'payment') {
    let chainTxHash = null;
    let settlementType = 'onchain-dryrun';
    let confirmations = 0;
    let retryableError = false;

    const live = await this.ensureReady();

    // 1️⃣ BROADCAST PHASE: Send tx to chain
    //    If broadcast fails, we do NOT mutate the ledger.
    if (live && !this.dryRun) {
      try {
        const toAddress = resolveAddress(to);
        if (!toAddress || !this.ethers.isAddress(toAddress)) {
          throw new Error(`Recipient "${to}" has no on-chain address`);
        }

        // Resolve sender - should be in walletManager
        const fromAddress = resolveAddress(from);
        const signer = await walletManager.getSigner(from);
        if (!signer) {
          throw new Error(`Sender "${from}" has no signer configured (resolved to: ${fromAddress})`);
        }

        // LOG: Check both balances before sending
        const provider = await walletManager.getProvider();
        const nativeBalance = await provider.getBalance(signer.address);
        let usdcBalance = 0n;
        try {
          const usdcContract = await walletManager.getUsdcContract(from);
          if (usdcContract) {
            usdcBalance = await usdcContract.balanceOf(signer.address);
          }
        } catch (_e) {
          logger.warn({ err: _e }, '[wallet] Could not fetch USDC balance');
        }

        logger.info(
          {
            signer: signer.address,
            recipient: toAddress,
            amount,
            nativeBalance: this.ethers.formatEther(nativeBalance),
            usdcBalance: this.ethers.formatUnits(usdcBalance, 6)
          },
          '[OnChainWalletProvider] Sending transaction'
        );

        let response;
        if (this.options.nativeUsdc) {
          // Arc: USDC is the native asset. Use a plain value transfer.
          const value = this.ethers.parseUnits(String(amount), this.options.nativeDecimals);

          // Wrap sendTransaction with retry logic
          response = await sendWithRetry(async () => {
            return await signer.sendTransaction({ to: toAddress, value });
          }, 5);
        } else {
          // Standard ERC-20 USDC transfer.
          const contract = await walletManager.getUsdcContract(from);
          const decimals = await contract.decimals();
          const scaled = this.ethers.parseUnits(String(amount), Number(decimals));

          // Wrap transfer with retry logic
          response = await sendWithRetry(async () => {
            return await contract.transfer(toAddress, scaled);
          }, 5);
        }

        chainTxHash = response.hash;
        logger.info(
          { txHash: chainTxHash, from: signer.address, to: toAddress, amount },
          '[OnChainWalletProvider] Transaction broadcast successfully'
        );

        // 2️⃣ CONFIRMATION PHASE: Wait for at least 1 block confirmation
        //    For Arc (sub-second settlement), this is typically < 2 seconds.
        //    If confirmation fails/times out, still mark as 'pending' in ledger
        //    and retry logic should handle it.
        try {
          const receipt = await response.wait(1, 60000); // wait up to 60s for 1 confirm
          confirmations = receipt?.confirmations || 1;
          settlementType = 'onchain';
          logger.info(
            { txHash: chainTxHash, confirmations },
            '[OnChainWalletProvider] Transaction confirmed on-chain'
          );
        } catch (confirmError) {
          // Confirmation timeout — still mark as broadcast but pending
          settlementType = 'onchain-pending';
          logger.warn(
            { txHash: chainTxHash, error: confirmError.message },
            '[OnChainWalletProvider] Transaction broadcast but confirmation timeout'
          );
        }
      } catch (error) {
        // Check if this is a retryable error
        retryableError = isRetryableRpcError(error);

        logger.error(
          {
            error: error.message,
            isRetryable: retryableError,
            from,
            to,
            amount,
            taskId
          },
          '[OnChainWalletProvider] Transfer failed'
        );

        // For retryable errors, we'll return a special response
        // that the orchestrator can retry instead of failing the task
        if (retryableError) {
          throw new Error(`onchain transfer failed (retryable): ${error.message}`);
        }

        // For non-retryable errors, fail the task immediately
        throw new Error(`onchain transfer failed: ${error.message}`);
      }
    }

    // 3️⃣ LEDGER PHASE: Mirror into the local ledger ONLY AFTER broadcast success
    //    In dryRun mode this is the only side-effect.
    //    In live mode the ledger entry is written only AFTER the chain tx was
    //    broadcast successfully (confirmations pending or complete).
    const tx = await ledger.createTransaction(from, to, amount, asset, reason, taskId, type);

    // Store on-chain metadata so getTransactions() can enrich the ledger tx
    const enrichedData = {
      settlementType,
      chainTxHash,
      confirmations,
      onChainStatus: settlementType === 'onchain' ? 'confirmed' : 'pending',
      retryableError
    };
    this.txHashMap.set(tx.id, enrichedData);

    return {
      ...tx,
      ...enrichedData
    };
  }

  async getBalance(walletId) {
    return ledger.getBalance(walletId);
  }

  async getAllBalances() {
    return ledger.getAllBalances();
  }

  async getTransactions(filters = {}) {
    const transactions = ledger.getTransactions(filters);
    // Enrich with on-chain data (chainTxHash, settlementType, etc.) from txHashMap
    return transactions.map(tx => {
      const onchainData = this.txHashMap.get(tx.id);
      return onchainData ? { ...tx, ...onchainData } : tx;
    });
  }

  async setInitialBalances(initialBalances) {
    return ledger.setInitialBalances(initialBalances);
  }

  async hasExistingBalances() {
    const balances = ledger.getAllBalances();
    return Object.keys(balances).length > 0;
  }
}

function createProvider() {
  const mode = config.walletProvider?.mode || 'simulated';

  if (mode === 'onchain') {
    return new OnChainWalletProvider(config.walletProvider.onChain || {});
  }

  return new SimulatedWalletProvider();
}

const walletProvider = createProvider();

export { SimulatedWalletProvider, OnChainWalletProvider };
export default walletProvider;
