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

export const api = {
  tasks: {
    create: (data) => apiCall('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    list: () => apiCall('/api/tasks'),
    get: (id) => apiCall(`/api/tasks/${id}`),
    execute: (id) => apiCall(`/api/tasks/${id}/execute`, { method: 'POST' }),
  },

  auth: {
    login: (email, password) => apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    getMe: () => apiCall('/api/auth/me'),
    walletCreate: () => apiCall('/api/auth/wallet/create', { method: 'POST' }),
    walletBalance: (address) => apiCall(`/api/balances/${address}`),
  },

  transactions: {
    list: (userId) => apiCall(`/api/transactions?userId=${userId}`),
    get: (txId) => apiCall(`/api/transactions/${txId}`),
  },

  config: {
    getConfig: () => apiCall('/api/config'),
    getHealth: () => apiCall('/api/health'),
  },
};

export default api;
