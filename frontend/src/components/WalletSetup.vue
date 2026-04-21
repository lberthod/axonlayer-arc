<template>
  <div class="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl border-2 border-violet-200 p-8 mb-6">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🔐</div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Set up your Mission Wallet</h1>
        <p class="text-gray-600">Create your Arc USDC wallet and fund it to start launching missions</p>
      </div>

      <!-- Step 1: Create Wallet -->
      <div class="bg-white rounded-lg p-6 mb-4 border-2" :class="step >= 1 ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-bold text-white', step >= 1 ? 'bg-emerald-500' : 'bg-gray-400']">
              {{ step >= 1 ? '✓' : '1' }}
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900 mb-2">Create Arc USDC Wallet</h2>
            <p class="text-gray-600 text-sm mb-4">Generate a new Arc blockchain wallet for USDC settlement</p>

            <div v-if="!wallet">
              <button
                @click="createWallet"
                :disabled="creatingWallet"
                class="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="creatingWallet" class="flex items-center gap-2">
                  <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating wallet...
                </span>
                <span v-else>Create Wallet</span>
              </button>
            </div>

            <div v-else class="bg-white rounded-lg p-4 border border-gray-200">
              <p class="text-xs text-gray-500 uppercase mb-1 font-semibold">Wallet Address</p>
              <div class="flex items-center gap-2">
                <code class="flex-1 text-sm font-mono bg-gray-50 p-2 rounded break-all">{{ wallet }}</code>
                <button
                  @click="copyWallet"
                  class="px-3 py-2 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 text-sm font-semibold transition"
                >
                  {{ walletCopied ? '✓ Copied' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Add Budget -->
      <div class="bg-white rounded-lg p-6 border-2" :class="step >= 2 ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-bold text-white', step >= 2 ? 'bg-emerald-500' : 'bg-gray-400']">
              {{ step >= 2 ? '✓' : '2' }}
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900 mb-2">Fund Your Wallet</h2>
            <p class="text-gray-600 text-sm mb-4">Add USDC budget to your wallet for mission execution</p>

            <div v-if="step >= 1" class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Budget Amount (USDC)
                  <span class="text-xs font-normal text-gray-500">— Start with at least $0.01</span>
                </label>
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <span class="absolute left-3 top-3 text-gray-500 font-semibold">$</span>
                    <input
                      v-model.number="budgetAmount"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      placeholder="0.01"
                      class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                  </div>
                  <span class="text-gray-500 font-semibold">USDC</span>
                </div>
              </div>

              <!-- Quick presets -->
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="amount in [0.01, 0.05, 0.10, 0.25]"
                  :key="amount"
                  @click="budgetAmount = amount"
                  :class="['px-3 py-2 rounded-lg text-sm font-semibold transition', budgetAmount === amount ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                >
                  ${amount.toFixed(2)}
                </button>
              </div>

              <!-- Fund button -->
              <button
                @click="fundWallet"
                :disabled="!budgetAmount || budgetAmount <= 0 || fundingWallet"
                class="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="fundingWallet" class="flex items-center justify-center gap-2">
                  <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Adding funds to wallet...
                </span>
                <span v-else>Add ${budgetAmount?.toFixed(4) || '0.0000'}} to Wallet</span>
              </button>
            </div>

            <div v-if="userBalance" class="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
              <p class="text-sm text-gray-600 mb-2">
                <span class="font-semibold">Current Balance:</span>
                <span class="text-xl font-bold text-emerald-700 ml-2">{{ userBalance.toFixed(4) }} USDC</span>
              </p>
              <p class="text-xs text-gray-500">Ready to launch missions!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="step >= 2 && userBalance > 0" class="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200 text-center">
        <div class="text-4xl mb-3">🚀</div>
        <h3 class="text-xl font-bold text-emerald-900 mb-2">All set!</h3>
        <p class="text-emerald-700 mb-4">Your wallet is ready. You can now launch missions.</p>
        <button
          @click="$emit('setup-complete')"
          class="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
        >
          Go to Mission Control
        </button>
      </div>

      <!-- Info Box -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-blue-800">
          <span class="font-semibold">ℹ️ How it works:</span> Your budget is held in escrow. Each mission deducts the exact cost. Any unused budget is refunded.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api.js';
import { toastSuccess, toastError } from '../stores/toastStore.js';

const emit = defineEmits(['setup-complete']);

const step = ref(0);
const wallet = ref('');
const userBalance = ref(0);
const budgetAmount = ref(0.01);
const creatingWallet = ref(false);
const fundingWallet = ref(false);
const walletCopied = ref(false);

async function createWallet() {
  creatingWallet.value = true;
  try {
    const result = await api.createWallet();
    wallet.value = result.address;
    step.value = 1;
    toastSuccess('Wallet created successfully!');
  } catch (err) {
    toastError(err, 'Failed to create wallet');
  } finally {
    creatingWallet.value = false;
  }
}

async function fundWallet() {
  fundingWallet.value = true;
  try {
    const result = await api.fundWallet({ amount: budgetAmount.value });
    userBalance.value = result.balance || budgetAmount.value;
    step.value = 2;
    toastSuccess(`Added ${budgetAmount.value} USDC to your wallet!`);
  } catch (err) {
    toastError(err, 'Failed to fund wallet');
  } finally {
    fundingWallet.value = false;
  }
}

function copyWallet() {
  navigator.clipboard.writeText(wallet.value);
  walletCopied.value = true;
  setTimeout(() => { walletCopied.value = false; }, 2000);
}

async function checkBalance() {
  try {
    const me = await api.getMe();
    if (me.wallet?.address) {
      wallet.value = me.wallet.address;
      step.value = 1;
    }
    if (me.balance !== undefined) {
      userBalance.value = me.balance;
      if (userBalance.value > 0) {
        step.value = 2;
      }
    }
  } catch (err) {
    console.error('Failed to check balance:', err);
  }
}

onMounted(checkBalance);
</script>
