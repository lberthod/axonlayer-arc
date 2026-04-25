<template>
  <div class="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl border-2 border-violet-200 p-8 mb-6">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">👤</div>
        <h1 class="text-3xl font-bold text-slate-100 mb-2">Your Profile</h1>
        <p class="text-slate-400">Manage your wallet and account settings</p>
      </div>

      <!-- User Info -->
      <div class="bg-slate-800 rounded-lg p-6 mb-6 border-2 border-violet-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-slate-100">Account Information</h2>
          <span class="text-sm text-violet-700 bg-indigo-950 px-3 py-1 rounded-full font-semibold">{{ user?.role ||
            'user' }}</span>
        </div>
        <div class="space-y-3">
          <div>
            <p class="text-xs text-slate-500 uppercase font-semibold mb-1">Email</p>
            <p class="text-lg text-slate-100">{{ user?.email || 'Not set' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-semibold mb-1">Display Name</p>
            <p class="text-lg text-slate-100">{{ user?.displayName || 'Anonymous' }}</p>
          </div>
        </div>
      </div>

      <!-- Mission Wallet Info (The real wallet for missions) -->
      <div v-if="user?.wallet" class="bg-slate-800 rounded-lg p-6 mb-6 border-2 border-violet-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-slate-100">Mission Wallet</h2>
            <p class="text-xs text-slate-400">Your Arc USDC wallet - send funds here to execute missions</p>
          </div>
          <span class="text-2xl">💰</span>
        </div>

        <!-- Mission Wallet Address (Arc Testnet) -->
        <div class="mb-4 p-4 bg-indigo-950 rounded-lg border border-violet-200">
          <p class="text-xs text-violet-700 uppercase mb-2 font-semibold">🔗 Wallet Address (Arc Testnet)</p>
          <p class="text-xs text-indigo-400 mb-2">Send USDC to this address to fund missions</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-sm font-mono bg-slate-800 p-2 rounded break-all">{{ user.wallet.address }}</code>
            <button @click="copyWalletAddress"
              class="px-3 py-2 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 text-sm font-semibold transition">
              {{ addressCopied ? '✓ Copied' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Mission Wallet Balance -->
        <div class="mb-4 p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-xs text-emerald-700 uppercase mb-1 font-bold">💰 Available Balance</p>
              <p class="text-xs text-emerald-600">Real-time balance from Arc blockchain</p>
            </div>
            <span class="text-sm text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-semibold">On-Chain</span>
          </div>
          <p class="text-3xl font-bold text-emerald-700 mb-2">{{ (user.balance || 0).toFixed(4) }} USDC</p>
          <button @click="refreshBalance" :disabled="checkingBalance"
            class="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition disabled:opacity-50 flex items-center gap-1">
            {{ checkingBalance ? '⏳ Checking blockchain...' : '🔄 Refresh Balance' }}
          </button>
        </div>

        <!-- View Private Key / Mnemonic -->
        <div class="mb-4">
          <button @click="showWalletDetails = !showWalletDetails"
            class="w-full px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition flex items-center justify-between">
            <span>{{ showWalletDetails ? '🔒 Hide' : '🔓 View' }} Private Key & Mnemonic</span>
            <span>{{ showWalletDetails ? '▲' : '▼' }}</span>
          </button>
        </div>

        <!-- Private Key & Mnemonic (Collapsible) -->
        <div v-if="showWalletDetails" class="space-y-4 mb-6 p-4 bg-red-50 rounded-lg border-2 border-red-200">
          <!-- Private Key -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">🔑</span>
              <div>
                <p class="text-xs text-red-700 uppercase font-bold">⚠️ Private Key (KEEP SECRET)</p>
                <p class="text-xs text-red-600">Anyone with this key can drain your wallet</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-xs font-mono bg-slate-800 p-2 rounded break-all"
                :class="showPrivateKey ? '' : 'blur-sm'">
                {{ user.wallet.privateKey }}
              </code>
              <button @click="togglePrivateKey"
                class="px-3 py-2 rounded bg-slate-600 text-slate-300 hover:bg-gray-300 text-xs font-semibold transition whitespace-nowrap">
                {{ showPrivateKey ? '👁 Hide' : '👁️ Show' }}
              </button>
              <button @click="copyPrivateKey"
                class="px-3 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold transition">
                {{ privKeyCopied ? '✓' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Mnemonic -->
          <div>
            <p class="text-xs text-amber-700 uppercase mb-2 font-bold">🌱 Recovery Phrase (Mnemonic)</p>
            <p class="text-xs text-amber-600 mb-2">Save this phrase to recover your wallet if needed</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-xs font-mono bg-slate-800 p-2 rounded break-all">
                {{ user.wallet.mnemonic }}
              </code>
              <button @click="copyMnemonic"
                class="px-3 py-2 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold transition">
                {{ mnemonicCopied ? '✓' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Regenerate Wallet -->
        <div class="flex gap-2">
          <button @click="exportWallet"
            class="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
            ⬇️ Export Wallet (JSON)
          </button>
          <button @click="regenerateWallet" :disabled="creatingWallet"
            class="flex-1 px-4 py-2 rounded-lg border-2 border-red-600 text-red-600 hover:bg-red-50 text-sm font-semibold transition disabled:opacity-50"
            title="Regenerates both Mission & Treasury wallets and clears old data">
            {{ creatingWallet ? 'Resetting...' : '🔄 Reset All Wallets' }}
          </button>
        </div>
      </div>

      <!-- Treasury Wallet Info (Handles agent payments) -->
      <div v-if="user?.treasuryWallet" class="bg-slate-800 rounded-lg p-6 mb-6 border-2 border-blue-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-slate-100">Treasury Wallet</h2>
            <p class="text-xs text-slate-400">Manages payments to agents on Arc - auto-funded from missions</p>
          </div>
          <span class="text-2xl">🏦</span>
        </div>

        <!-- Treasury Address -->
        <div class="mb-4 p-4 bg-blue-950 rounded-lg border border-blue-200">
          <p class="text-xs text-blue-400 uppercase mb-2 font-semibold">🔗 Treasury Address (Arc Testnet)</p>
          <p class="text-xs text-blue-400 mb-2">Receives mission funds and pays agents automatically</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-sm font-mono bg-slate-800 p-2 rounded break-all">{{ user?.treasuryWallet?.address }}</code>
            <button @click="copyTreasuryAddress"
              class="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold transition">
              {{ treasuryAddressCopied ? '✓ Copied' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Treasury Balance -->
        <div class="p-4 bg-sky-50 rounded-lg border-2 border-sky-200 mb-4">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-xs text-sky-700 uppercase mb-1 font-bold">💵 Treasury Balance</p>
              <p class="text-xs text-sky-600">Available for agent payments</p>
            </div>
            <span class="text-sm text-sky-600 bg-sky-100 px-2 py-1 rounded-full font-semibold">On-Chain</span>
          </div>
          <p class="text-3xl font-bold text-sky-700 mb-2">{{ treasuryInfo ? (treasuryInfo.balance || 0).toFixed(6) : '⏳ Loading...' }} USDC</p>
          <button @click="refreshTreasuryBalance" :disabled="checkingTreasuryBalance"
            class="text-sm text-sky-600 hover:text-sky-700 font-semibold transition disabled:opacity-50 flex items-center gap-1">
            {{ checkingTreasuryBalance ? '⏳ Checking blockchain...' : '🔄 Refresh Balance' }}
          </button>
        </div>
      </div>

      <!-- Security Warning -->
      <div class="p-4 bg-red-50 rounded-lg border border-red-200">
        <p class="text-sm text-red-800">
          <span class="font-bold">⚠️ Security Warning:</span> Never share your private key or mnemonic with anyone.
          Store them in a secure location (password manager, hardware wallet, etc.). Axonlayerwill never ask for your
          private key.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '../services/api.js';
import { toastSuccess, toastError } from '../stores/toastStore.js';
import { walletStore } from '../stores/walletStore.js';

const user = ref(null);
const treasuryInfo = ref(null);
const showWalletDetails = ref(false);
const showPrivateKey = ref(false);
const addressCopied = ref(false);
const treasuryAddressCopied = ref(false);
const privKeyCopied = ref(false);
const mnemonicCopied = ref(false);
const checkingBalance = ref(false);
const creatingWallet = ref(false);
const checkingTreasuryBalance = ref(false);

async function loadUser() {
  try {
    user.value = await api.auth.getMe();
    await loadTreasuryInfo();
  } catch (err) {
    toastError(err, 'Failed to load profile');
  }
}

async function loadTreasuryInfo() {
  try {
    // Get user's personal treasury wallet address
    const treasuryAddress = user.value?.treasuryWallet?.address;

    if (!treasuryAddress) {
      console.warn('No treasury wallet address found for user');
      treasuryInfo.value = { address: null, balance: 0 };
      return;
    }

    // Try to fetch REAL balance from Arc testnet blockchain
    let treasuryBalance = 0;
    try {
      const result = await api.getBlockchainBalance(treasuryAddress);
      treasuryBalance = result.balance || 0;
    } catch (balanceErr) {
      console.warn('Failed to load treasury balance from blockchain:', balanceErr.message);
      treasuryBalance = 0;
    }

    treasuryInfo.value = {
      address: treasuryAddress,
      balance: treasuryBalance
    };
  } catch (err) {
    console.warn('Failed to load treasury info:', err.message);
    treasuryInfo.value = { address: user.value?.treasuryWallet?.address || null, balance: 0 };
  }
}

async function refreshBalance() {
  checkingBalance.value = true;
  try {
    if (!user.value?.wallet?.address) {
      toastError(new Error('No wallet address'), 'Cannot refresh balance');
      return;
    }

    // Get real on-chain balance from Arc testnet
    const result = await api.getBlockchainBalance(user.value.wallet.address);
    user.value.balance = result.balance || 0;
    toastSuccess(`✅ Updated: ${(user.value.balance || 0).toFixed(4)} USDC on Arc testnet`);
  } catch (err) {
    toastError(err, 'Failed to refresh balance from blockchain');
  } finally {
    checkingBalance.value = false;
  }
}

async function refreshTreasuryBalance() {
  checkingTreasuryBalance.value = true;
  try {
    const treasuryAddress = user.value?.treasuryWallet?.address;
    if (!treasuryAddress) {
      toastError(new Error('No treasury address'), 'Cannot refresh treasury balance');
      return;
    }

    // Get real on-chain balance from Arc testnet
    const result = await api.getBlockchainBalance(treasuryAddress);
    if (treasuryInfo.value) {
      treasuryInfo.value.balance = result.balance || 0;
    }
    toastSuccess(`✅ Updated: ${(result.balance || 0).toFixed(6)} USDC in treasury`);
  } catch (err) {
    toastError(err, 'Failed to refresh treasury balance from blockchain');
  } finally {
    checkingTreasuryBalance.value = false;
  }
}

function copyWalletAddress() {
  if (user.value?.wallet?.address) {
    navigator.clipboard.writeText(user.value.wallet.address);
    addressCopied.value = true;
    setTimeout(() => { addressCopied.value = false; }, 2000);
  }
}

function copyTreasuryAddress() {
  const address = user.value?.treasuryWallet?.address;
  if (address) {
    navigator.clipboard.writeText(address);
    treasuryAddressCopied.value = true;
    setTimeout(() => { treasuryAddressCopied.value = false; }, 2000);
  }
}

function togglePrivateKey() {
  showPrivateKey.value = !showPrivateKey.value;
}

function copyPrivateKey() {
  if (user.value?.wallet?.privateKey) {
    navigator.clipboard.writeText(user.value.wallet.privateKey);
    privKeyCopied.value = true;
    setTimeout(() => { privKeyCopied.value = false; }, 2000);
  }
}

function copyMnemonic() {
  if (user.value?.wallet?.mnemonic) {
    navigator.clipboard.writeText(user.value.wallet.mnemonic);
    mnemonicCopied.value = true;
    setTimeout(() => { mnemonicCopied.value = false; }, 2000);
  }
}

function exportWallet() {
  if (!user.value?.wallet) return;
  const exportData = {
    address: user.value.wallet.address,
    privateKey: user.value.wallet.privateKey,
    mnemonic: user.value.wallet.mnemonic,
    chain: 'arc',
    token: 'USDC',
    createdAt: user.value.wallet.createdAt,
    warning: 'KEEP THIS PRIVATE KEY SECRET. Anyone with access can drain your wallet.'
  };
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arc-wallet-${user.value.wallet.address.slice(-6)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toastSuccess('Wallet exported! Keep this file secure.');
}

async function regenerateWallet() {
  if (!confirm('⚠️ RESET ALL WALLETS\n\nThis will:\n✓ Generate new Mission Wallet\n✓ Generate new Treasury Wallet\n✓ Clear treasury history\n\nOld wallets cannot be used anymore.\n\nAre you sure?')) {
    return;
  }
  creatingWallet.value = true;
  try {
    const result = await api.auth.walletRegenerateAll();
    user.value = result.user;
    // Sync globally so all components update
    walletStore.updateFromUser(result.user);
    toastSuccess('✅ All wallets regenerated! New addresses active. Save your private keys in a secure location.');
  } catch (err) {
    toastError(err, 'Failed to regenerate wallets');
  } finally {
    creatingWallet.value = false;
  }
}

let unsubscribeWallet = null;

onMounted(() => {
  loadUser();

  // Subscribe to wallet changes from other components
  unsubscribeWallet = walletStore.subscribe(() => {
    loadUser();
  });
});

onUnmounted(() => {
  if (unsubscribeWallet) {
    unsubscribeWallet();
  }
});
</script>
