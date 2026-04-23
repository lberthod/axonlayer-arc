import { reactive } from 'vue';

const WALLET_STORAGE_KEY = 'arc_wallet_setup';
const BALANCE_STORAGE_KEY = 'arc_wallet_balance';

const state = reactive({
  // User data from API
  user: null,
  wallet: null,
  balance: 0,

  // Sync status
  lastUpdated: null,
  isLoading: false,

  // Setup status
  setupComplete: false
});

// Listeners for reactive updates
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

// Load from localStorage on init
function initializeFromStorage() {
  const stored = localStorage.getItem(WALLET_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      state.wallet = data.wallet || null;
      state.balance = data.balance || 0;
      state.setupComplete = state.wallet && state.balance >= 0;
    } catch (e) {
      console.error('Failed to load wallet from storage:', e);
    }
  }
}

export const walletStore = {
  state,

  /**
   * Update entire user + wallet from API
   * Call this when user logs in or after any wallet change
   */
  updateFromUser(user) {
    state.user = user;
    state.wallet = user?.wallet || null;
    state.balance = user?.balance || 0;
    state.lastUpdated = new Date().toLocaleTimeString();
    state.setupComplete = state.wallet && state.balance >= 0;

    // Persist to localStorage
    if (state.wallet) {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({
        wallet: state.wallet,
        balance: state.balance,
        updatedAt: state.lastUpdated
      }));
    }

    notifyListeners();
  },

  /**
   * Update only the balance (from blockchain sync)
   */
  updateBalance(balance) {
    state.balance = balance;
    state.lastUpdated = new Date().toLocaleTimeString();
    state.setupComplete = state.wallet && state.balance >= 0;

    localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify({
      balance,
      lastUpdated: state.lastUpdated
    }));

    notifyListeners();
  },

  /**
   * Subscribe to wallet changes
   * Returns unsubscribe function
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /**
   * Notify components wallet was regenerated
   */
  onWalletRegenerated(user) {
    state.isLoading = false;
    this.updateFromUser(user);
  },

  clearWallet() {
    state.wallet = null;
    state.balance = 0;
    state.user = null;
    state.setupComplete = false;
    state.lastUpdated = null;
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(BALANCE_STORAGE_KEY);
    notifyListeners();
  },

  isSetupComplete() {
    return state.setupComplete;
  },

  getWallet() {
    return state.wallet;
  },

  getBalance() {
    return state.balance;
  },

  getUser() {
    return state.user;
  }
};

initializeFromStorage();
