import { getIdToken } from './firebase.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiCall = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

export const apiCallWithAuth = async (endpoint, options = {}) => {
  const token = await getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

const buildUrl = (endpoint) => {
  // If API_BASE already contains /api, don't double it
  if (API_BASE.endsWith('/api') && endpoint.startsWith('/api')) {
    return `${API_BASE}${endpoint.slice(4)}`;
  }
  return `${API_BASE}${endpoint}`;
};

export const api = {
  tasks: {
    create: (data) => apiCallWithAuth('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiCallWithAuth('/api/tasks'),
    get: (id) => apiCallWithAuth(`/api/tasks/${id}`),
    execute: (id) => apiCallWithAuth(`/api/tasks/${id}/execute`, { method: 'POST' }),
  },

  auth: {
    login: (email, password) => apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    getMe: () => apiCallWithAuth('/api/auth/me'),
    walletCreate: () => apiCallWithAuth('/api/auth/wallet/create', { method: 'POST' }),
    walletBalance: (address) => apiCall(`/api/auth/wallet/balance/${address}`),
    becomeProvider: () => apiCallWithAuth('/api/auth/role/provider', { method: 'POST' }),
    rotateApiKey: () => apiCallWithAuth('/api/auth/apikey/rotate', { method: 'POST' }),
  },

  balances: {
    getBalances: () => apiCallWithAuth('/api/balances'),
    getBalance: (address) => apiCall(`/api/balances/${address}`),
  },

  transactions: {
    list: (userId) => apiCall(`/api/transactions?userId=${userId}`),
    get: (txId) => apiCall(`/api/transactions/${txId}`),
  },

  metrics: {
    getMetrics: (windowMs) => apiCallWithAuth(`/api/metrics${windowMs ? `?windowMs=${windowMs}` : ''}`),
  },

  config: {
    getConfig: () => apiCall('/api/config'),
    getHealth: () => apiCall('/api/health'),
  },

  agents: {
    list: () => apiCall('/api/agents'),
    quote: (data) => apiCall('/api/agents/quote', { method: 'POST', body: JSON.stringify(data) }),
  },

  blockchain: {
    getBalance: (address) => apiCall(`/api/auth/wallet/balance/${address}`),
  },
};

// Add convenience methods at top level for backward compatibility
api.getConfig = api.config.getConfig;
api.getHealth = api.config.getHealth;
api.getBlockchainBalance = api.blockchain.getBalance;
api.getAgents = api.agents.list;
api.getTask = api.tasks.get;
api.getTransactions = () => apiCall('/api/transactions');

// Add missing methods for MissionControlView
api.createTask = (input, taskType, options = {}) =>
  api.tasks.create({ input, taskType, ...options });

api.quoteTask = (input, taskType, selectionStrategy) =>
  api.agents.quote({ input, taskType, selectionStrategy });

api.runSimulation = (count, taskType = 'summarize', selectionStrategy = 'score_price') =>
  apiCallWithAuth('/api/simulate', {
    method: 'POST',
    body: JSON.stringify({ count, taskType, selectionStrategy })
  });

// Add wallet methods
api.createWallet = () => api.auth.walletCreate();
api.getWalletBalance = (address) => api.auth.walletBalance(address);

export default api;
