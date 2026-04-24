import pino from 'pino';
import { ledger } from './ledger.js';
import walletManager from './walletManager.js';
import { treasuryStore } from './treasuryStore.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * PaymentSaga: Implements SAGA pattern for atomic payments
 *
 * Flow:
 * 1. RESERVE: Lock amount from treasury (local state)
 * 2. BROADCAST: Send tx on-chain, get txHash
 * 3. CONFIRM: Wait for confirmation on-chain
 * 4. SETTLE: Update ledger with confirmed tx
 *
 * If any step fails:
 * - Reserve is released
 * - TX status set to 'failed'
 * - Retry can happen automatically
 *
 * Recovery:
 * - Reconciliation job every 5 min checks pending TXs
 * - If confirmed on-chain but not settled → complete settlement
 * - If failed on-chain but reserved → release reservation + alert
 */
class PaymentSaga {
  constructor() {
    this.MAX_CONFIRMATIONS = 1; // Arc chain finality
    this.CONFIRMATION_TIMEOUT = 60000; // 60 seconds
    this.MAX_RETRIES = 3;
  }

  /**
   * Execute atomic payment between wallets
   * Returns: { success: boolean, txHash: string, error: string }
   */
  async executePayment({
    taskId,
    fromWalletId,
    toAddress,
    amount,
    reason = 'Payment'
  }) {
    const txId = `tx_${Date.now()}_${taskId}`;
    logger.info({
      txId,
      taskId,
      fromWallet: fromWalletId,
      toAddress,
      amount,
      reason
    }, '[SAGA] Payment started');

    try {
      // Step 1: RESERVE from treasury
      const reservation = await this._reserve(txId, amount, reason);
      if (!reservation.success) {
        return {
          success: false,
          txId,
          error: 'Insufficient treasury balance',
          code: 'INSUFFICIENT_BALANCE'
        };
      }

      logger.info({ txId, reserved: amount }, '[SAGA] Step 1/4: Reserved');

      // Step 2: BROADCAST on-chain
      let txHash;
      try {
        txHash = await this._broadcast(txId, fromWalletId, toAddress, amount);
      } catch (error) {
        // Release reservation on broadcast failure
        await this._releaseReservation(txId, amount);
        logger.error({ err: error, txId }, '[SAGA] Broadcast failed, released reservation');
        return {
          success: false,
          txId,
          error: `Broadcast failed: ${error.message}`,
          code: 'BROADCAST_FAILED'
        };
      }

      logger.info({ txId, txHash }, '[SAGA] Step 2/4: Broadcasted');

      // Step 3: CONFIRM on-chain
      let confirmed = false;
      try {
        confirmed = await this._confirmTransaction(txHash);
      } catch (error) {
        // Mark as pending for reconciliation job to handle
        logger.warn({ err: error, txId, txHash }, '[SAGA] Confirmation timeout, marked pending');
        ledger.recordTransaction({
          id: txId,
          taskId,
          type: 'payment',
          status: 'pending',
          fromWallet: fromWalletId,
          toAddress,
          amount,
          txHash,
          reason,
          error: 'Confirmation timeout'
        });
        return {
          success: false,
          txId,
          txHash,
          error: 'Confirmation timeout - pending for reconciliation',
          code: 'PENDING_CONFIRMATION'
        };
      }

      if (!confirmed) {
        // Release reservation if confirmation failed
        await this._releaseReservation(txId, amount);
        logger.error({ txId, txHash }, '[SAGA] Confirmation failed, released reservation');
        return {
          success: false,
          txId,
          txHash,
          error: 'Transaction not confirmed on-chain',
          code: 'CONFIRMATION_FAILED'
        };
      }

      logger.info({ txId, txHash }, '[SAGA] Step 3/4: Confirmed');

      // Step 4: SETTLE in ledger
      ledger.recordTransaction({
        id: txId,
        taskId,
        type: 'payment',
        status: 'success',
        fromWallet: fromWalletId,
        toAddress,
        amount,
        txHash,
        reason,
        confirmedAt: new Date().toISOString()
      });

      logger.info({ txId, txHash }, '[SAGA] Step 4/4: Settled');

      return {
        success: true,
        txId,
        txHash,
        amount
      };
    } catch (error) {
      logger.error({ err: error, txId }, '[SAGA] Unexpected error');
      return {
        success: false,
        txId,
        error: error.message,
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Step 1: Reserve amount from treasury
   * Returns: { success: boolean, amount: number, txId: string }
   */
  async _reserve(txId, amount, reason) {
    try {
      const current = treasuryStore.getBalance();
      if (current < amount) {
        return { success: false };
      }

      // Record reservation (soft debit)
      ledger.recordReservation({
        id: txId,
        type: 'reserve',
        amount,
        reason,
        status: 'reserved'
      });

      logger.debug({ txId, amount, reason }, 'Reservation recorded');
      return { success: true, amount, txId };
    } catch (error) {
      logger.error({ err: error, txId }, 'Reservation failed');
      return { success: false };
    }
  }

  /**
   * Release a reservation if payment fails
   */
  async _releaseReservation(txId, amount) {
    try {
      ledger.recordReservation({
        id: txId,
        type: 'release',
        amount,
        reason: 'Payment failed, releasing reservation',
        status: 'released'
      });
      logger.debug({ txId, amount }, 'Reservation released');
    } catch (error) {
      logger.error({ err: error, txId }, 'Failed to release reservation');
    }
  }

  /**
   * Step 2: Broadcast transaction on-chain
   * Returns: txHash (string)
   */
  async _broadcast(txId, fromWalletId, toAddress, amount) {
    try {
      const signer = await walletManager.getSigner(fromWalletId);
      if (!signer) {
        throw new Error(`Wallet ${fromWalletId} not found or unable to decrypt`);
      }

      const contract = await walletManager.getUsdcContract(fromWalletId);
      if (!contract) {
        throw new Error('USDC contract not initialized');
      }

      // Convert amount to USDC units (6 decimals)
      const amountBigInt = BigInt(Math.floor(amount * 1e6));

      logger.debug({
        txId,
        signer: signer.address,
        to: toAddress,
        amount: amountBigInt.toString()
      }, '[BROADCAST] Sending transfer');

      const tx = await contract.transfer(toAddress, amountBigInt);
      const txHash = tx.hash;

      logger.info({
        txId,
        txHash,
        from: signer.address,
        to: toAddress
      }, '[BROADCAST] Transaction sent');

      return txHash;
    } catch (error) {
      logger.error({ err: error, txId }, '[BROADCAST] Failed to send transaction');
      throw error;
    }
  }

  /**
   * Step 3: Wait for on-chain confirmation
   * Returns: boolean (true if confirmed, false otherwise)
   */
  async _confirmTransaction(txHash) {
    try {
      const provider = await walletManager.getProvider();
      let confirmations = 0;
      let attempts = 0;
      const maxAttempts = this.CONFIRMATION_TIMEOUT / 5000; // Check every 5s

      while (confirmations < this.MAX_CONFIRMATIONS && attempts < maxAttempts) {
        const receipt = await provider.getTransactionReceipt(txHash);

        if (receipt) {
          confirmations = receipt.confirmations || 1;
          logger.debug({
            txHash,
            confirmations,
            status: receipt.status
          }, '[CONFIRM] Receipt status');

          if (receipt.status === 0) {
            // Transaction failed on-chain
            return false;
          }

          if (confirmations >= this.MAX_CONFIRMATIONS) {
            return true;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }

      // Timeout reached without confirmation
      logger.warn({ txHash, attempts }, '[CONFIRM] Confirmation timeout');
      return false;
    } catch (error) {
      logger.error({ err: error, txHash }, '[CONFIRM] Error checking confirmation');
      throw error;
    }
  }

  /**
   * Reconciliation: Check pending TXs and complete/fail them
   * Runs periodically to recover from transient failures
   */
  async reconcilePendingTransactions() {
    logger.info('[RECONCILE] Starting pending transaction reconciliation');

    const pending = ledger.getPendingTransactions();
    let resolved = 0;
    let failed = 0;

    for (const tx of pending) {
      if (!tx.txHash) {
        logger.warn({ txId: tx.id }, '[RECONCILE] Pending TX without txHash, cannot reconcile');
        continue;
      }

      try {
        const provider = await walletManager.getProvider();
        const receipt = await provider.getTransactionReceipt(tx.txHash);

        if (!receipt) {
          // Still pending on-chain
          logger.debug({ txId: tx.id, txHash: tx.txHash }, '[RECONCILE] Still pending on-chain');
          continue;
        }

        if (receipt.status === 0) {
          // Transaction failed on-chain
          logger.warn({
            txId: tx.id,
            txHash: tx.txHash,
            blockNumber: receipt.blockNumber
          }, '[RECONCILE] TX failed on-chain, marking failed');

          ledger.recordTransaction({
            ...tx,
            status: 'failed',
            failedAt: new Date().toISOString(),
            failReason: 'Transaction reverted on-chain'
          });

          // Release reservation
          await this._releaseReservation(tx.id, tx.amount);
          failed++;
        } else {
          // Transaction succeeded on-chain
          logger.info({
            txId: tx.id,
            txHash: tx.txHash,
            blockNumber: receipt.blockNumber
          }, '[RECONCILE] TX confirmed on-chain, updating ledger');

          ledger.recordTransaction({
            ...tx,
            status: 'success',
            confirmedAt: new Date().toISOString()
          });

          resolved++;
        }
      } catch (error) {
        logger.error({
          err: error,
          txId: tx.id,
          txHash: tx.txHash
        }, '[RECONCILE] Error checking TX status');
      }
    }

    logger.info({
      total: pending.length,
      resolved,
      failed,
      stillPending: pending.length - resolved - failed
    }, '[RECONCILE] Reconciliation complete');
  }
}

export const paymentSaga = new PaymentSaga();
