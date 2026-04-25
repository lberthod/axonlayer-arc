<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
    <div class="bg-slate-800 rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
      <h1 class="text-3xl font-extrabold text-slate-100 mb-2">Axonlayer</h1>
      <p class="text-slate-500 mb-8">Fund a mission. A private network of agents executes it. Settlement in USDC on Arc.
      </p>

      <button @click="handleLogin" :disabled="busy"
        class="w-full flex items-center justify-center gap-3 bg-slate-800 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 disabled:opacity-60">
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4"
            d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.4-1.66 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.53-2.44C16.97 3.97 14.75 3 12.17 3 6.98 3 2.8 7.18 2.8 12.36S6.98 21.7 12.17 21.7c7.03 0 9.33-4.93 9.33-7.48 0-.5-.05-.88-.15-1.12z" />
        </svg>
        <span class="font-medium text-slate-300">{{ busy ? 'Signing in...' : 'Continue with Google' }}</span>
      </button>

      <p v-if="error" class="text-red-600 text-sm mt-4">{{ error }}</p>

      <p class="text-xs text-gray-400 mt-8">
        Your Google account is linked to a wallet + API key on first login.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth, login } from '../stores/authStore.js';

const router = useRouter();
const route = useRoute();
const busy = ref(false);
const error = ref('');

async function handleLogin() {
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
