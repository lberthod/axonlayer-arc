import ledger from './ledger.js';
import { config } from '../config.js';

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
import walletManager from './walletManager.js';

class OnChainWalletProvider {
  constructor(options) {
    this.mode = 'onchain';
    this.options = options;
    this.dryRun = options.dryRun !== false;
    this.ethers = null;
    this.ready = false;
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

    const live = await this.ensureReady();

    // 1️⃣ BROADCAST PHASE: Send tx to chain
    //    If broadcast fails, we do NOT mutate the ledger.
    if (live && !this.dryRun) {
      try {
        const toAddress = walletManager.getAddress(to) || to;
        if (!this.ethers.isAddress(toAddress)) {
          throw new Error(`Recipient "${to}" has no on-chain address`);
        }

        const signer = await walletManager.getSigner(from);
        if (!signer) {
          throw new Error(`Sender "${from}" has no signer configured`);
        }

        let response;
        if (this.options.nativeUsdc) {
          // Arc: USDC is the native asset. Use a plain value transfer.
          const value = this.ethers.parseUnits(String(amount), this.options.nativeDecimals);
          response = await signer.sendTransaction({ to: toAddress, value });
        } else {
          // Standard ERC-20 USDC transfer.
          const contract = await walletManager.getUsdcContract(from);
          const decimals = await contract.decimals();
          const scaled = this.ethers.parseUnits(String(amount), Number(decimals));
          response = await contract.transfer(toAddress, scaled);
        }

        chainTxHash = response.hash;

        // 2️⃣ CONFIRMATION PHASE: Wait for at least 1 block confirmation
        //    For Arc (sub-second settlement), this is typically < 2 seconds.
        //    If confirmation fails/times out, still mark as 'pending' in ledger
        //    and retry logic should handle it.
        try {
          const receipt = await response.wait(1, 60000); // wait up to 60s for 1 confirm
          confirmations = receipt?.confirmations || 1;
          settlementType = 'onchain';
          console.log(`[OnChainWalletProvider] tx ${chainTxHash} confirmed with ${confirmations} confirmations`);
        } catch (confirmError) {
          // Confirmation timeout — still mark as broadcast but pending
          settlementType = 'onchain-pending';
          console.warn(`[OnChainWalletProvider] tx ${chainTxHash} broadcast but confirmation timeout:`, confirmError.message);
        }
      } catch (error) {
        console.error('[OnChainWalletProvider] on-chain transfer failed, aborting:', error.message);
        // Do NOT mutate the ledger — surface the error to the caller so the
        // orchestrator can mark the task as failed and not charge the client.
        throw new Error(`onchain transfer failed: ${error.message}`);
      }
    }

    // 3️⃣ LEDGER PHASE: Mirror into the local ledger ONLY AFTER broadcast success
    //    In dryRun mode this is the only side-effect.
    //    In live mode the ledger entry is written only AFTER the chain tx was
    //    broadcast successfully (confirmations pending or complete).
    const tx = await ledger.createTransaction(from, to, amount, asset, reason, taskId, type);
    return {
      ...tx,
      settlementType,
      chainTxHash,
      confirmations,
      onChainStatus: settlementType === 'onchain' ? 'confirmed' : 'pending'
    };
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
