<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-bold mb-4 text-gray-800">Wallet Balances (USDC)</h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="item in orderedBalances"
        :key="item.wallet"
        class="bg-gray-50 rounded-lg p-4"
      >
        <p class="text-xs text-gray-500 uppercase mb-1">{{ formatWalletName(item.wallet) }}</p>
        <p class="text-2xl font-bold text-gray-800">{{ formatBalance(item.balance) }}</p>
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
</script>
