<template>
  <div class="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl border-2 border-violet-200 p-8 mb-6">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">🔐</div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Your Arc USDC Wallet</h1>
        <p class="text-gray-600">Generate your wallet and fund it with Arc USDC to launch missions</p>
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
            <h2 class="text-xl font-bold text-gray-900 mb-2">Generate Arc USDC Wallet</h2>
            <p class="text-gray-600 text-sm mb-4">Create your wallet for Arc blockchain transactions</p>

            <div v-if="!walletData">
              <button
                @click="createWallet"
                :disabled="creatingWallet"
                class="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="creatingWallet" class="flex items-center gap-2">
                  <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating wallet...
                </span>
                <span v-else>Generate Wallet</span>
              </button>
            </div>

            <div v-else class="space-y-4">
              <!-- Wallet Address -->
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <p class="text-xs text-gray-500 uppercase mb-1 font-semibold">Wallet Address</p>
                <div class="flex items-center gap-2 mb-3">
                  <code class="flex-1 text-sm font-mono bg-gray-50 p-2 rounded break-all">{{ walletData.address }}</code>
                  <button
                    @click="copyAddress"
                    class="px-3 py-2 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 text-sm font-semibold transition"
                  >
                    {{ addressCopied ? '✓ Copied' : 'Copy' }}
                  </button>
                </div>
                <p class="text-xs text-gray-500">Share this address to receive USDC funds</p>
              </div>

              <!-- Private Key (SECURE) -->
              <div class="bg-red-50 rounded-lg p-4 border border-red-200">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">🔑</span>
                  <div>
                    <p class="text-xs text-red-700 uppercase font-bold">⚠️ Private Key (KEEP SECRET)</p>
                    <p class="text-xs text-red-600">Anyone with this key can drain your wallet</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <code class="flex-1 text-xs font-mono bg-white p-2 rounded break-all" :class="showPrivateKey ? '' : 'blur-sm'">
                    {{ walletData.privateKey }}
                  </code>
                  <button
                    @click="togglePrivateKey"
                    class="px-3 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs font-semibold transition whitespace-nowrap"
                  >
                    {{ showPrivateKey ? '👁 Hide' : '👁️ Show' }}
                  </button>
                  <button
                    @click="copyPrivateKey"
                    class="px-3 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold transition"
                  >
                    {{ privKeyChopied ? '✓' : 'Copy' }}
                  </button>
                </div>
              </div>

              <!-- Mnemonic -->
              <div class="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p class="text-xs text-amber-700 uppercase mb-2 font-bold">🌱 Recovery Phrase (Mnemonic)</p>
                <p class="text-xs text-amber-600 mb-2">Save this phrase to recover your wallet if needed</p>
                <div class="flex items-center gap-2">
                  <code class="flex-1 text-xs font-mono bg-white p-2 rounded break-all">
                    {{ walletData.mnemonic }}
                  </code>
                  <button
                    @click="copyMnemonic"
                    class="px-3 py-2 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold transition"
                  >
                    {{ mnemonicCopied ? '✓' : 'Copy' }}
                  </button>
                </div>
              </div>

              <!-- Export Wallet -->
              <div class="flex gap-2">
                <button
                  @click="exportWallet"
                  class="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                >
                  ⬇️ Export Wallet (JSON)
                </button>
                <button
                  @click="regenerateWallet"
                  :disabled="creatingWallet"
                  class="flex-1 px-4 py-2 rounded-lg border-2 border-violet-600 text-violet-600 hover:bg-violet-50 text-sm font-semibold transition disabled:opacity-50"
                >
                  🔄 Generate New
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Fund Wallet -->
      <div class="bg-white rounded-lg p-6 border-2" :class="step >= 2 ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-bold text-white', step >= 2 ? 'bg-emerald-500' : 'bg-gray-400']">
              {{ step >= 2 ? '✓' : '2' }}
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900 mb-2">Fund Your Wallet</h2>
            <p class="text-gray-600 text-sm mb-4">Send USDC Arc to the wallet address above</p>

            <div v-if="walletData" class="space-y-4">
              <!-- Instructions -->
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p class="text-sm text-blue-900 font-semibold mb-2">📋 Instructions:</p>
                <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy your wallet address above</li>
                  <li>Go to your Arc blockchain wallet (e.g., MetaMask, Argent)</li>
                  <li>Send USDC tokens to the address</li>
                  <li>Wait for confirmation (usually < 1 minute)</li>
                  <li>Balance will update automatically</li>
                </ol>
              </div>

              <!-- Check Balance Button -->
              <button
                @click="checkBalance"
                :disabled="checkingBalance"
                class="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition disabled:opacity-50"
              >
                <span v-if="checkingBalance" class="flex items-center justify-center gap-2">
                  <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Checking balance...
                </span>
                <span v-else>✅ Check Balance</span>
              </button>

              <!-- Balance Display -->
              <div v-if="currentBalance !== null" class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                <p class="text-sm text-gray-600 mb-2">
                  <span class="font-semibold">Current Balance:</span>
                  <span class="text-2xl font-bold text-emerald-700 ml-2">{{ currentBalance.toFixed(4) }} USDC</span>
                </p>
                <p v-if="currentBalance > 0" class="text-xs text-emerald-600 font-semibold">✓ Ready to launch missions!</p>
                <p v-else class="text-xs text-amber-600 font-semibold">⏳ Waiting for funds...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="step >= 2 && currentBalance > 0" class="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200 text-center">
        <div class="text-4xl mb-3">🚀</div>
        <h3 class="text-xl font-bold text-emerald-900 mb-2">All Set!</h3>
        <p class="text-emerald-700 mb-4">Your wallet is funded and ready to go.</p>
        <button
          @click="$emit('setup-complete')"
          class="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
        >
          Go to Mission Control
        </button>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <p class="text-sm text-red-800">
          <span class="font-bold">⚠️ Security Warning:</span> Never share your private key or mnemonic with anyone. Store them in a secure location (password manager, hardware wallet, etc.). Arc Agent Hub will never ask for your private key.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/api.js';
import { toastSuccess, toastError } from '../stores/toastStore.js';

const emit = defineEmits(['setup-complete']);

const step = ref(0);
const walletData = ref(null);
const currentBalance = ref(null);
const creatingWallet = ref(false);
const checkingBalance = ref(false);
const showPrivateKey = ref(false);
const addressCopied = ref(false);
const privKeyChopied = ref(false);
const mnemonicCopied = ref(false);

async function createWallet() {
  creatingWallet.value = true;
  try {
    const result = await api.createWallet();
    walletData.value = result.wallet;
    step.value = 1;
    toastSuccess('Wallet created! Save your private key in a secure location.');
  } catch (err) {
    toastError(err, 'Failed to create wallet');
  } finally {
    creatingWallet.value = false;
  }
}

async function regenerateWallet() {
  if (!confirm('Are you sure? This will create a new wallet and invalidate the current one.')) {
    return;
  }
  await createWallet();
}

async function checkBalance() {
  checkingBalance.value = true;
  try {
    const me = await api.getMe();
    currentBalance.value = me.balance || 0;
    if (currentBalance.value > 0) {
      step.value = 2;
      toastSuccess('Wallet funded! You can now launch missions.');
    } else {
      toastSuccess('Waiting for funds... Balance is still 0 USDC.');
    }
  } catch (err) {
    toastError(err, 'Failed to check balance');
  } finally {
    checkingBalance.value = false;
  }
}


function togglePrivateKey() {
  showPrivateKey.value = !showPrivateKey.value;
}

function copyAddress() {
  if (walletData.value?.address) {
    navigator.clipboard.writeText(walletData.value.address);
    addressCopied.value = true;
    setTimeout(() => { addressCopied.value = false; }, 2000);
  }
}

function copyPrivateKey() {
  if (walletData.value?.privateKey) {
    navigator.clipboard.writeText(walletData.value.privateKey);
    privKeyChopied.value = true;
    setTimeout(() => { privKeyChopied.value = false; }, 2000);
  }
}

function copyMnemonic() {
  if (walletData.value?.mnemonic) {
    navigator.clipboard.writeText(walletData.value.mnemonic);
    mnemonicCopied.value = true;
    setTimeout(() => { mnemonicCopied.value = false; }, 2000);
  }
}

function exportWallet() {
  const exportData = {
    address: walletData.value.address,
    privateKey: walletData.value.privateKey,
    mnemonic: walletData.value.mnemonic,
    chain: 'arc',
    token: 'USDC',
    createdAt: walletData.value.createdAt,
    warning: 'KEEP THIS PRIVATE KEY SECRET. Anyone with access can drain your wallet.'
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arc-wallet-${walletData.value.address.slice(-6)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toastSuccess('Wallet exported! Keep this file secure.');
}

async function checkExistingWallet() {
  try {
    const me = await api.getMe();
    if (me.wallet?.address) {
      walletData.value = me.wallet;
      step.value = 1;
      currentBalance.value = me.balance || 0;
      if (currentBalance.value > 0) {
        step.value = 2;
      }
    }
  } catch (err) {
    // Silently fail - wallet doesn't exist yet
  }
}

onMounted(checkExistingWallet);
</script>
