import { getIdToken } from './firebase.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Custom error type carrying the backend's structured error envelope:
 *   { error: { code, message, requestId, details? } }
 */
export class ApiError extends Error {
  constructor({ status, code, message, requestId, details }) {
    super(message || `HTTP ${status}`);
    this.status = status;
    this.code = code || 'unknown';
    this.requestId = requestId || null;
    this.details = details || null;
  }
}

async function authHeaders(extra = {}) {
  const token = await getIdToken().catch(() => null);
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // New shape: { error: { code, message, requestId } }
    const env = data?.error;
    if (env && typeof env === 'object') {
      throw new ApiError({
        status: response.status,
        code: env.code,
        message: env.message,
        requestId: env.requestId || response.headers.get('x-request-id'),
        details: env.details
      });
    }
    // Legacy shape: { error: "string" } or empty
    throw new ApiError({
      status: response.status,
      code: 'unknown',
      message: typeof data?.error === 'string' ? data.error : `HTTP ${response.status}`,
      requestId: response.headers.get('x-request-id')
    });
  }

  return data;
}

async function request(path, { method = 'GET', body, headers, idempotencyKey } = {}) {
  const finalHeaders = await authHeaders({
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...headers
  });
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined
  });
  return parseResponse(response);
}

export const api = {
  createTask: (input, taskType = 'summarize', options = {}) => {
    const { idempotencyKey, ...rest } = options;
    return request('/tasks', {
      method: 'POST',
      body: { input, taskType, ...rest },
      idempotencyKey
    });
  },

  getMyTasks: () => request('/tasks/mine'),

  getAgents: () => request('/agents'),

  quoteTask: (input, taskType, strategy) =>
    request('/agents/quote', { method: 'POST', body: { input, taskType, strategy } }),

  getMetrics: (windowMs) => request(windowMs ? `/metrics?windowMs=${windowMs}` : '/metrics'),

  getBalances: () => request('/balances'),

  getTransactions: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/transactions?${params.toString()}`);
  },

  runSimulation: (count = 50, options = {}) =>
    request('/simulate', { method: 'POST', body: { count, ...options } }),

  getHealth: () => request('/health'),
  getReady: () => request('/ready'),
  getConfig: () => request('/config'),

  // auth
  getMe: () => request('/auth/me'),
  rotateApiKey: () => request('/auth/apikey/rotate', { method: 'POST' }),
  setWalletAddress: (address) => request('/auth/wallet', { method: 'POST', body: { address } }),
  becomeProvider: () => request('/auth/role/provider', { method: 'POST' }),

  // agent operators (private execution fabric)
  listProviders: (status) => request(status ? `/providers?status=${status}` : '/providers'),
  listMyProviders: () => request('/providers/mine'),
  registerProvider: (payload) => request('/providers', { method: 'POST', body: payload }),
  updateProvider: (id, patch) => request(`/providers/${id}`, { method: 'PATCH', body: patch }),
  stakeProvider: (id, amount) =>
    request(`/providers/${id}/stake`, { method: 'POST', body: { amount } }),
  approveProvider: (id) => request(`/providers/${id}/approve`, { method: 'POST' }),
  rejectProvider: (id) => request(`/providers/${id}/reject`, { method: 'POST' }),
  slashProvider: (id, amount, reason) =>
    request(`/providers/${id}/slash`, { method: 'POST', body: { amount, reason } }),

  // admin
  adminOverview: () => request('/admin/overview'),
  adminUsers: () => request('/admin/users'),
  adminProviders: (status) =>
    request(status ? `/admin/providers?status=${status}` : '/admin/providers'),
  adminSetRole: (uid, role) =>
    request(`/admin/users/${uid}/role`, { method: 'POST', body: { role } })
};
