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
    create: (data) => apiCall('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiCall('/tasks'),
    get: (id) => apiCall(`/tasks/${id}`),
    execute: (id) => apiCall(`/tasks/${id}/execute`, { method: 'POST' }),
  },

  auth: {
    login: (email, password) => apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    getMe: () => apiCallWithAuth('/auth/me'),
    walletCreate: () => apiCallWithAuth('/auth/wallet/create', { method: 'POST' }),
    walletBalance: (address) => apiCall(`/auth/wallet/balance/${address}`),
    becomeProvider: () => apiCallWithAuth('/auth/role/provider', { method: 'POST' }),
    rotateApiKey: () => apiCallWithAuth('/auth/apikey/rotate', { method: 'POST' }),
  },

  balances: {
    getBalances: () => apiCallWithAuth('/balances'),
    getBalance: (address) => apiCall(`/balances/${address}`),
  },

  transactions: {
    list: (userId) => apiCall(`/transactions?userId=${userId}`),
    get: (txId) => apiCall(`/transactions/${txId}`),
  },

  metrics: {
    getMetrics: (windowMs) => apiCallWithAuth(`/metrics${windowMs ? `?windowMs=${windowMs}` : ''}`),
  },

  config: {
    getConfig: () => apiCall('/config'),
    getHealth: () => apiCall('/health'),
  },

  agents: {
    list: () => apiCall('/agents'),
    quote: (data) => apiCall('/agents/quote', { method: 'POST', body: JSON.stringify(data) }),
  },

  blockchain: {
    getBalance: (address) => apiCall(`/auth/wallet/balance/${address}`),
  },

  tasks: {
    get: (id) => apiCall(`/tasks/${id}`),
  },
};

// Add convenience methods at top level for backward compatibility
api.getConfig = api.config.getConfig;
api.getHealth = api.config.getHealth;
api.getBlockchainBalance = api.blockchain.getBalance;
api.getAgents = api.agents.list;
api.getTask = api.tasks.get;
api.getTransactions = () => apiCall('/transactions');

export default api;
