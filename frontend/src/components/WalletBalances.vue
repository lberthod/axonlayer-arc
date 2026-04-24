<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <h2 class="text-xl font-bold mb-4 text-slate-100">Wallet Balances</h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="(item, idx) in orderedBalances"
        :key="item.wallet"
        class="rounded-lg p-4 transition-all duration-300 hover:shadow-md border"
        :class="getWalletColor(item.wallet)"
        :style="{ 'animation-delay': `${idx * 50}ms` }"
      >
        <p class="text-xs font-semibold uppercase mb-2 opacity-70">{{ formatWalletName(item.wallet) }}</p>
        <p class="text-2xl font-bold tracking-tight">{{ formatBalance(item.balance) }} <span class="text-xs text-slate-500">USDC</span></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  balances: {
    type: Object,
    default: () => ({})
  }
});

const preferredOrder = [
  'client_wallet',
  'orchestrator_wallet',
  'worker_wallet',
  'validator_wallet'
];

const orderedBalances = computed(() => {
  const entries = Object.entries(props.balances || {});

  return entries
    .sort(([a], [b]) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);

      const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

      return safeA - safeB;
    })
    .map(([wallet, balance]) => ({ wallet, balance }));
});

const formatWalletName = (wallet) => {
  return String(wallet || '').replace('_wallet', '').replaceAll('_', ' ');
};

const formatBalance = (balance) => {
  const num = Number(balance);
  return Number.isFinite(num) ? num.toFixed(4) : '0.0000';
};

const getWalletColor = (wallet) => {
  const colors = {
    'client_wallet': 'bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 text-violet-900',
    'orchestrator_wallet': 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900',
    'worker_wallet': 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900',
    'validator_wallet': 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-900'
  };
  return colors[wallet] || 'bg-gradient-to-br from-gray-50 to-gray-100 border-indigo-500/20 text-slate-100';
};
</script>
