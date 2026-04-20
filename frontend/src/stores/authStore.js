import { reactive, readonly } from 'vue';
import { firebaseAuth, onAuthChange, loginWithGoogle, logout, getIdToken } from '../services/firebase.js';

const state = reactive({
  initialized: false,
  loading: true,
  firebaseUser: null,
  user: null,         // backend /api/auth/me payload
  role: 'anonymous',
  error: null
});

async function refreshBackendUser() {
  const token = await getIdToken();
  if (!token) {
    state.user = null;
    state.role = 'anonymous';
    return;
  }
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.user = await response.json();
    state.role = state.user.role || 'user';
  } catch (err) {
    console.error('[authStore] /auth/me failed:', err);
    state.user = null;
    state.role = 'anonymous';
    state.error = err.message;
  }
}

export function initAuthStore() {
  if (state.initialized) return;
  state.initialized = true;

  onAuthChange(async (firebaseUser) => {
    state.firebaseUser = firebaseUser;
    state.loading = true;
    state.error = null;
    await refreshBackendUser();
    state.loading = false;
  });
}

export async function login() {
  state.error = null;
  try {
    await loginWithGoogle();
  } catch (err) {
    state.error = err.message || 'login failed';
    throw err;
  }
}

export async function doLogout() {
  await logout();
  state.user = null;
  state.role = 'anonymous';
}

export async function becomeProvider() {
  const token = await getIdToken();
  if (!token) return;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  await fetch(`${base}/auth/role/provider`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  await refreshBackendUser();
}

export async function rotateApiKey() {
  const token = await getIdToken();
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const response = await fetch(`${base}/auth/apikey/rotate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.ok) {
    state.user = await response.json();
  }
}

export const auth = readonly(state);
export { firebaseAuth };
