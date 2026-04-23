import { reactive } from 'vue';

const WALLET_STORAGE_KEY = 'arc_wallet_setup';
const BALANCE_STORAGE_KEY = 'arc_wallet_balance';

const state = reactive({
  walletData: null,
  currentBalance: null,
  setupComplete: false,
  lastBalanceCheck: 'Never'
});

// Load from localStorage on init
function initializeFromStorage() {
  const stored = localStorage.getItem(WALLET_STORAGE_KEY);
  if (stored) {
    try {
      state.walletData = JSON.parse(stored);
      const balanceStored = localStorage.getItem(BALANCE_STORAGE_KEY);
      if (balanceStored) {
        const balanceData = JSON.parse(balanceStored);
        state.currentBalance = balanceData.balance;
        state.lastBalanceCheck = balanceData.lastCheck;
      }
      state.setupComplete = state.walletData && state.currentBalance > 0;
    } catch (e) {
      console.error('Failed to load wallet from storage:', e);
    }
  }
}

export const walletStore = {
  state,

  setWalletData(wallet) {
    state.walletData = wallet;
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  },

  setBalance(balance, lastCheck) {
    state.currentBalance = balance;
    state.lastBalanceCheck = lastCheck || new Date().toLocaleTimeString();
    localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify({
      balance,
      lastCheck: state.lastBalanceCheck
    }));
    state.setupComplete = balance > 0;
  },

  clearWallet() {
    state.walletData = null;
    state.currentBalance = null;
    state.setupComplete = false;
    state.lastBalanceCheck = 'Never';
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(BALANCE_STORAGE_KEY);
  },

  isSetupComplete() {
    return state.setupComplete;
  },

  getWalletData() {
    return state.walletData;
  },

  getBalance() {
    return state.currentBalance;
  }
};

initializeFromStorage();
