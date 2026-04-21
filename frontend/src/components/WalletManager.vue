<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Mission Wallet</h2>
        <p class="text-sm text-gray-500">Manage your Arc USDC budget</p>
      </div>
      <span class="text-2xl">💰</span>
    </div>

    <!-- Wallet Status -->
    <div v-if="wallet" class="space-y-4">
      <!-- Wallet Address -->
      <div>
        <p class="text-xs font-semibold uppercase text-gray-500 mb-2">Wallet Address</p>
        <div class="flex items-center gap-2">
          <code class="flex-1 text-sm font-mono bg-gray-50 p-3 rounded break-all border border-gray-200">
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
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
          <p class="text-xs font-semibold uppercase mb-1 text-emerald-700">Available Balance</p>
          <p class="text-2xl font-bold text-emerald-900">{{ balance.toFixed(4) }} <span class="text-sm text-emerald-600">USDC</span></p>
        </div>

        <div class="rounded-lg p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200">
          <p class="text-xs font-semibold uppercase mb-1 text-violet-700">Total Used</p>
          <p class="text-2xl font-bold text-violet-900">{{ totalUsed.toFixed(4) }} <span class="text-sm text-violet-600">USDC</span></p>
        </div>
      </div>

      <!-- Add Funds Section -->
      <div class="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-lg p-4 border border-violet-200">
        <h3 class="text-sm font-bold text-gray-900 mb-3">Add Funds</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2">Amount (USDC)</label>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <span class="absolute left-3 top-2.5 text-gray-500 font-semibold">$</span>
                <input
                  v-model.number="addAmount"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  placeholder="0.05"
                  class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              </div>
              <span class="text-gray-500 font-semibold">USDC</span>
            </div>
          </div>

          <!-- Quick add buttons -->
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="amount in [0.01, 0.05, 0.10, 0.25, 0.50, 1.00]"
              :key="amount"
              @click="addAmount = amount"
              :class="['px-3 py-1.5 rounded-lg text-xs font-semibold transition', addAmount === amount ? 'bg-violet-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:border-violet-300']"
            >
              +${{ amount.toFixed(2) }}
            </button>
          </div>

          <!-- Add funds button -->
          <button
            @click="addFunds"
            :disabled="!addAmount || addAmount <= 0 || addingFunds"
            class="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="addingFunds" class="flex items-center justify-center gap-2">
              <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Adding funds...
            </span>
            <span v-else>Add ${{ addAmount?.toFixed(4) || '0.0000' }} to Wallet</span>
          </button>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div v-if="recentTransactions.length" class="pt-4 border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-900 mb-3">Recent Transactions</h3>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div
            v-for="tx in recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
          >
            <div>
              <p class="font-semibold text-gray-900">{{ tx.type === 'deposit' ? '+ Deposit' : '- Mission' }}</p>
              <p class="text-gray-500">{{ new Date(tx.timestamp).toLocaleDateString() }}</p>
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
      <p class="text-gray-600 mb-4">No wallet created yet</p>
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
const totalUsed = ref(0);
const addAmount = ref(0.05);
const addingFunds = ref(false);
const copied = ref(false);
const recentTransactions = ref([]);

async function loadWalletData() {
  try {
    const me = await api.getMe();
    if (me.wallet) {
      wallet.value = me.wallet;
      balance.value = me.balance || 0;
      totalUsed.value = me.usage?.totalSpent || 0;
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

async function addFunds() {
  addingFunds.value = true;
  try {
    const result = await api.fundWallet({ amount: addAmount.value });
    balance.value = result.balance || (balance.value + addAmount.value);
    toastSuccess(`Added $${addAmount.value.toFixed(4)} to your wallet!`);
    addAmount.value = 0.05;
    await loadWalletData();
  } catch (err) {
    toastError(err, 'Failed to add funds');
  } finally {
    addingFunds.value = false;
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
