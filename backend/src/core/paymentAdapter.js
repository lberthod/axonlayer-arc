import walletProvider from './walletProvider.js';
import { config } from '../config.js';

class PaymentAdapter {
  constructor() {
    this.asset = config.asset;
    this.provider = walletProvider;
  }

  get mode() {
    return this.provider.mode;
  }

  async transfer(from, to, amount, reason, taskId, type = 'payment') {
    return this.provider.transfer(from, to, amount, this.asset, reason, taskId, type);
  }

  async getBalance(walletId) {
    return this.provider.getBalance(walletId);
  }

  async getAllBalances() {
    return this.provider.getAllBalances();
  }

  async getTransactions(filters = {}) {
    return this.provider.getTransactions(filters);
  }

  async initializeWallets() {
    const hasExisting = await this.provider.hasExistingBalances();

    if (!hasExisting) {
      await this.provider.setInitialBalances(config.initialBalances);
    }
  }
}

export default new PaymentAdapter();
