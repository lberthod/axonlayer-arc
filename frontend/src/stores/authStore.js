import { reactive, readonly } from 'vue';
import { firebaseAuth, onAuthChange, loginWithGoogle, logout, getIdToken } from '../services/firebase.js';
import { api } from '../services/api.js';

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
    state.user = await api.auth.getMe();
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
  await api.auth.becomeProvider();
  await refreshBackendUser();
}

export async function rotateApiKey() {
  state.user = await api.auth.rotateApiKey();
}

export const auth = readonly(state);
export { firebaseAuth };
