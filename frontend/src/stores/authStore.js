import { reactive, readonly } from 'vue';
import { firebaseAuth, onAuthChange, loginWithGoogle, loginWithEmail, signupWithEmail, logout, getIdToken } from '../services/firebase.js';
import { api } from '../services/api.js';

// Import cache clear function for auth-related changes
import { clearMeCache } from '../services/api.js';

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

export async function loginWithEmailPassword(email, password) {
  state.error = null;
  try {
    await loginWithEmail(email, password);
  } catch (err) {
    state.error = err.message || 'login failed';
    throw err;
  }
}

export async function signupWithEmailPassword(email, password) {
  state.error = null;
  try {
    await signupWithEmail(email, password);
  } catch (err) {
    state.error = err.message || 'signup failed';
    throw err;
  }
}

export async function doLogout() {
  clearMeCache(); // Clear cache on logout
  await logout();
  state.user = null;
  state.role = 'anonymous';
}

export async function becomeProvider() {
  clearMeCache(); // Clear cache before fetching updated data
  await api.auth.becomeProvider();
  await refreshBackendUser();
}

export async function rotateApiKey() {
  clearMeCache(); // Clear cache before fetching updated data
  state.user = await api.auth.rotateApiKey();
}

export const auth = readonly(state);
export { firebaseAuth };
