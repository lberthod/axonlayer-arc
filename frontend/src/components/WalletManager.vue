<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-slate-100">Mission Wallet</h2>
        <p class="text-sm text-slate-500">Manage your Arc USDC budget</p>
      </div>
      <span class="text-2xl">💰</span>
    </div>

    <!-- Wallet Status -->
    <div v-if="wallet" class="space-y-4">
      <!-- Wallet Address -->
      <div>
        <p class="text-xs font-semibold uppercase text-slate-500 mb-2">Wallet Address</p>
        <div class="flex items-center gap-2">
          <code class="flex-1 text-sm font-mono bg-gray-50 p-3 rounded break-all border border-indigo-500/20">
            {{ wallet.address }}
          </code>
          <button
            @click="copyAddress"
            class="px-3 py-2 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 text-sm font-semibold transition"
          >
            {{ copied ? '✓' : 'Copy' }}
          </button>
        </div>
      </div>

      <!-- Balance Display -->
      <div class="rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
        <p class="text-xs font-semibold uppercase mb-1 text-emerald-700">💰 Arc Testnet Balance</p>
        <p class="text-3xl font-bold text-emerald-900">{{ balance.toFixed(4) }} <span class="text-sm text-emerald-600">USDC</span></p>
        <p class="text-xs text-emerald-600 mt-2">Real-time on-chain balance · Automatically synced</p>
      </div>

      <!-- Info Box -->
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p class="text-xs text-blue-900 font-semibold mb-1">💡 Fund Your Wallet</p>
        <p class="text-xs text-blue-700">
          Send Arc USDC directly to your wallet address from your Arc testnet wallet.
          Your balance updates automatically when funds arrive on-chain.
        </p>
        <router-link to="/profile" class="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2 inline-block">
          → Go to Profile to manage wallet
        </router-link>
      </div>

      <!-- Recent Transactions -->
      <div v-if="recentTransactions.length" class="pt-4 border-t border-indigo-500/20">
        <h3 class="text-sm font-bold text-slate-100 mb-3">Recent Transactions</h3>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div
            v-for="tx in recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
          >
            <div>
              <p class="font-semibold text-slate-100">{{ tx.type === 'deposit' ? '+ Deposit' : '- Mission' }}</p>
              <p class="text-slate-500">{{ new Date(tx.timestamp).toLocaleDateString() }}</p>
            </div>
            <span :class="tx.type === 'deposit' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'">
              {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount.toFixed(4) }} USDC
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- No Wallet -->
    <div v-else class="text-center py-8">
      <p class="text-slate-400 mb-4">No wallet created yet</p>
      <router-link
        to="/mission"
        class="inline-block px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
      >
        Create Wallet
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/api.js';
import { toastSuccess, toastError } from '../stores/toastStore.js';

const wallet = ref(null);
const balance = ref(0);
const copied = ref(false);
const recentTransactions = ref([]);

async function loadWalletData() {
  try {
    const me = await api.auth.getMe();
    if (me.wallet) {
      wallet.value = me.wallet;
      balance.value = me.balance || 0;
    }
    // Load transactions (if available)
    try {
      const txs = await api.getTransactions?.();
      recentTransactions.value = (txs || []).slice(0, 5);
    } catch {
      // Silently fail if transactions endpoint not available
    }
  } catch (err) {
    toastError(err, 'Failed to load wallet data');
  }
}

function copyAddress() {
  if (wallet.value?.address) {
    navigator.clipboard.writeText(wallet.value.address);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

onMounted(loadWalletData);
</script>
