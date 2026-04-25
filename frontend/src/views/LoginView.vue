<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
    <div class="bg-slate-800 rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
      <h1 class="text-3xl font-extrabold text-slate-100 mb-2">Axonlayer</h1>
      <p class="text-slate-500 mb-8">Fund a mission. A private network of agents executes it. Settlement in USDC on Arc.
      </p>

      <!-- Tabs: Google vs Email -->
      <div class="flex gap-2 mb-6">
        <button
          @click="loginMode = 'google'"
          :class="[
            'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition',
            loginMode === 'google'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          ]"
        >
          🔵 Google
        </button>
        <button
          @click="loginMode = 'email'"
          :class="[
            'flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition',
            loginMode === 'email'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          ]"
        >
          ✉️ Email
        </button>
      </div>

      <!-- Google Login -->
      <button v-if="loginMode === 'google'" @click="handleGoogleLogin" :disabled="busy"
        class="w-full flex items-center justify-center gap-3 bg-slate-800 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 disabled:opacity-60">
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4"
            d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.4-1.66 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.53-2.44C16.97 3.97 14.75 3 12.17 3 6.98 3 2.8 7.18 2.8 12.36S6.98 21.7 12.17 21.7c7.03 0 9.33-4.93 9.33-7.48 0-.5-.05-.88-.15-1.12z" />
        </svg>
        <span class="font-medium text-slate-300">{{ busy ? 'Signing in...' : 'Continue with Google' }}</span>
      </button>

      <!-- Email Login/Signup -->
      <div v-if="loginMode === 'email'" class="space-y-3">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          class="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />

        <button @click="handleEmailLogin" :disabled="busy || !email || !password"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60">
          {{ busy ? 'Signing in...' : 'Sign In' }}
        </button>

        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-600"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="px-2 bg-slate-800 text-slate-400">or</span>
          </div>
        </div>

        <button @click="handleEmailSignup" :disabled="busy || !email || !password"
          class="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-2 rounded-lg transition disabled:opacity-60">
          {{ busy ? 'Creating account...' : 'Create Account' }}
        </button>
      </div>

      <p v-if="error" class="text-red-600 text-sm mt-4">{{ error }}</p>

      <p class="text-xs text-gray-400 mt-8">
        Your account is linked to a wallet + API key on first login.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth, login, loginWithEmailPassword, signupWithEmailPassword } from '../stores/authStore.js';

const router = useRouter();
const route = useRoute();
const busy = ref(false);
const error = ref('');
const loginMode = ref('google');
const email = ref('');
const password = ref('');

async function handleGoogleLogin() {
  busy.value = true;
  error.value = '';
  try {
    await login();
  } catch (err) {
    error.value = err.message || 'login failed';
  } finally {
    busy.value = false;
  }
}

async function handleEmailLogin() {
  busy.value = true;
  error.value = '';
  try {
    await loginWithEmailPassword(email.value, password.value);
  } catch (err) {
    error.value = err.message || 'login failed';
  } finally {
    busy.value = false;
  }
}

async function handleEmailSignup() {
  busy.value = true;
  error.value = '';
  try {
    await signupWithEmailPassword(email.value, password.value);
  } catch (err) {
    error.value = err.message || 'signup failed';
  } finally {
    busy.value = false;
  }
}

watch(
  () => [auth.firebaseUser, auth.loading],
  ([user, loading]) => {
    if (user && !loading) {
      const next = route.query.next || '/mission';
      router.push(next);
    }
  },
  { immediate: true }
);
</script>
