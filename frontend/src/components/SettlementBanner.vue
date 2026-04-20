<template>
  <div :class="['w-full text-sm font-medium', toneClass]">
    <div class="container mx-auto px-6 py-2 flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <span :class="['px-2 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase', badgeClass]">
          {{ label }}
        </span>
        <span class="font-semibold">Settled on Arc Network</span>
        <span>{{ description }}</span>
      </div>
      <div class="flex items-center gap-3 text-xs opacity-90">
        <span v-if="mode === 'live'" class="font-bold">USDC on-chain</span>
        <span v-if="appConfig.walletProvider.chainId">Chain {{ appConfig.walletProvider.chainId }}</span>
        <a
          v-if="appConfig.walletProvider.explorer"
          :href="appConfig.walletProvider.explorer"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:no-underline font-semibold"
        >View on Explorer ↗</a>
        <a
          v-if="appConfig.walletProvider.faucet"
          :href="appConfig.walletProvider.faucet"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:no-underline"
        >Faucet ↗</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { appConfig, loadAppConfig, settlementMode } from '../stores/appConfigStore.js';

onMounted(() => {
  loadAppConfig().catch(() => {
    /* silent: banner stays in 'simulated' until /api/config replies */
  });
});

const mode = computed(() => settlementMode());

const label = computed(() => {
  switch (mode.value) {
    case 'live': return 'LIVE';
    case 'dryrun': return 'DRY-RUN';
    default: return 'SIMULATED';
  }
});

const description = computed(() => {
  switch (mode.value) {
    case 'live':
      return 'All transactions are settled on-chain with USDC';
    case 'dryrun':
      return 'Transactions ready for Arc settlement (not broadcast)';
    default:
      return 'Simulated settlement mode for testing';
  }
});

const toneClass = computed(() => {
  switch (mode.value) {
    case 'live':    return 'bg-emerald-600 text-white';
    case 'dryrun':  return 'bg-amber-500 text-amber-950';
    default:        return 'bg-slate-700 text-slate-100';
  }
});

const badgeClass = computed(() => {
  switch (mode.value) {
    case 'live':    return 'bg-white/20 text-white';
    case 'dryrun':  return 'bg-amber-900/20 text-amber-950';
    default:        return 'bg-white/10 text-white';
  }
});
</script>
