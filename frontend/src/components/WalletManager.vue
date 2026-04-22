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
          <p class="text-xs font-semibold uppercase mb-1 text-emerald-700">On-Chain Balance</p>
          <p class="text-2xl font-bold text-emerald-900">{{ balance.toFixed(4) }} <span class="text-sm text-emerald-600">USDC</span></p>
        </div>

        <div class="rounded-lg p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <p class="text-xs font-semibold uppercase mb-1 text-blue-700">Mission Wallet</p>
          <p class="text-2xl font-bold text-blue-900">{{ missionBalance.toFixed(4) }} <span class="text-sm text-blue-600">USDC</span></p>
        </div>
      </div>

      <!-- Sync Button -->
      <button
        @click="syncMissionWallet"
        :disabled="syncing"
        class="w-full mt-4 px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {{ syncing ? 'Syncing...' : '🔄 Fund Mission Wallet from On-Chain' }}
      </button>
      <p v-if="lastSync" class="text-xs text-gray-500 mt-2">Last synced: {{ new Date(lastSync).toLocaleTimeString() }}</p>

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
const missionBalance = ref(0);
const totalUsed = ref(0);
const copied = ref(false);
const recentTransactions = ref([]);
const syncing = ref(false);
const lastSync = ref(null);

async function loadWalletData() {
  try {
    const me = await api.getMe();
    if (me.wallet) {
      wallet.value = me.wallet;
      balance.value = me.balance || me.onChainBalance || 0;
      missionBalance.value = me.missionWallet?.balance || 0;
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

async function syncMissionWallet() {
  syncing.value = true;
  try {
    const result = await api.syncMissionWallet();
    missionBalance.value = result.missionWallet.balance;
    lastSync.value = new Date();
    toastSuccess(result.message || 'Mission wallet synced successfully!');
  } catch (err) {
    toastError(err, 'Failed to sync mission wallet');
  } finally {
    syncing.value = false;
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
