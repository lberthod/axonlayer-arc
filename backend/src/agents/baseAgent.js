import paymentAdapter from '../core/paymentAdapter.js';

class BaseAgent {
  constructor(name, walletId) {
    this.name = name;
    this.walletId = walletId;
  }

  async getBalance() {
    return await paymentAdapter.getBalance(this.walletId);
  }

  async receivePayment(from, amount, reason, taskId) {
    return await paymentAdapter.transfer(from, this.walletId, amount, reason, taskId);
  }

  async makePayment(to, amount, reason, taskId) {
    return await paymentAdapter.transfer(this.walletId, to, amount, reason, taskId);
  }

  async execute(input) {
    throw new Error('execute method must be implemented by subclass');
  }
}

export default BaseAgent;
