<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Arc settlement proof</h2>
        <p class="text-xs text-gray-500">Every payment is an on-chain USDC transfer on Circle Arc.</p>
      </div>
      <span
        class="text-[10px] uppercase tracking-[0.15em] font-bold px-2.5 py-1 rounded-full"
        :class="anyOnchain ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
      >
        {{ anyOnchain ? '✓ Verified on Arc' : 'Simulated settlement' }}
      </span>
    </div>

    <!-- UNMISSABLE ARC PROOF INDICATORS -->
    <div v-if="anyOnchain" class="mb-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">🔗</span>
        <span class="font-bold text-gray-900">Settlement verified on-chain</span>
      </div>
      <div class="grid grid-cols-1 gap-2 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-emerald-600 font-bold text-lg">✔</span>
          <span class="text-gray-700">Settled on Arc</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-600 font-bold text-lg">✔</span>
          <span class="text-gray-700">USDC transaction</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-emerald-600 font-bold text-lg">✔</span>
          <span class="text-gray-700">Verified on-chain</span>
        </div>
      </div>
      <a
        v-if="firstOnchainTx"
        :href="explorerLink(firstOnchainTx)"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition shadow-md"
      >
        <span>View on Arc Explorer</span>
        <span>↗</span>
      </a>
    </div>

    <div v-if="payments.length" class="space-y-2">
      <div
        v-for="(tx, i) in payments"
        :key="tx.id || i"
        class="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:border-emerald-200 transition"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            :class="isOnchain(tx)
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'"
          >{{ i + 1 }}</div>
          <div class="min-w-0">
            <p class="text-xs text-gray-500">
              <span class="font-semibold text-gray-700">{{ prettyWallet(tx.from) }}</span>
              <span class="mx-1">→</span>
              <span class="font-semibold text-gray-700">{{ prettyWallet(tx.to) }}</span>
            </p>
            <p class="text-sm font-bold text-gray-900">{{ formatAmount(tx.amount) }} USDC</p>
            <p class="text-[11px] text-gray-500 truncate">{{ tx.reason || '—' }}</p>
          </div>
        </div>
        <div class="text-right flex-shrink-0 ml-3">
          <span
            class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
            :class="settlementClass(tx)"
          >{{ settlementLabel(tx) }}</span>
          <a
            v-if="explorerLink(tx)"
            :href="explorerLink(tx)"
            target="_blank"
            rel="noopener noreferrer"
            class="block mt-1 text-xs font-mono text-emerald-700 hover:underline"
            :title="tx.chainTxHash"
          >{{ shortHash(tx.chainTxHash) }} ↗</a>
          <span
            v-else-if="tx.chainTxHash"
            class="block mt-1 text-xs font-mono text-gray-400"
            :title="tx.chainTxHash"
          >{{ shortHash(tx.chainTxHash) }}</span>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-gray-500 text-center py-6">
      No payments yet. Launch a mission to settle USDC on Arc.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { explorerTxUrl } from '../stores/appConfigStore.js';

const props = defineProps({
  transactions: { type: Array, default: () => [] }
});

const payments = computed(() =>
  (props.transactions || []).filter((t) => Number(t.amount || 0) > 0)
);

const anyOnchain = computed(() =>
  payments.value.some((t) => isOnchain(t))
);

const firstOnchainTx = computed(() =>
  payments.value.find((t) => isOnchain(t))
);

function isOnchain(tx) {
  const t = tx?.settlementType || 'simulated';
  return t === 'onchain';
}

function settlementLabel(tx) {
  const t = tx?.settlementType || 'simulated';
  if (t === 'onchain') return 'on-chain';
  if (t === 'onchain-dryrun') return 'dry-run';
  if (t === 'onchain-error') return 'error';
  return 'simulated';
}

function settlementClass(tx) {
  const t = tx?.settlementType || 'simulated';
  if (t === 'onchain') return 'bg-emerald-100 text-emerald-700';
  if (t === 'onchain-dryrun') return 'bg-amber-100 text-amber-700';
  if (t === 'onchain-error') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

function prettyWallet(w) {
  if (!w) return '—';
  return String(w).replace('_wallet', '').replaceAll('_', ' ');
}

function formatAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6).replace(/\.?0+$/, '') : '0';
}

function explorerLink(tx) {
  if (!isOnchain(tx)) return null;
  return explorerTxUrl(tx.chainTxHash);
}

function shortHash(hash) {
  if (!hash) return '';
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
</script>
