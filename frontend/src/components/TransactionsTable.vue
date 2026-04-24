<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <h2 class="text-xl font-bold mb-4 text-slate-100">Execution Transactions</h2>

    <div v-if="reversedTransactions.length > 0" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-indigo-500/20 bg-gray-50/50">
            <th class="text-left py-2 px-3 text-sm font-medium text-slate-400">Type</th>
            <th class="text-left py-2 px-3 text-sm font-medium text-slate-400">From</th>
            <th class="text-left py-2 px-3 text-sm font-medium text-slate-400">To</th>
            <th class="text-left py-2 px-3 text-sm font-medium text-slate-400">Amount</th>
            <th class="text-left py-2 px-3 text-sm font-medium text-slate-400">Reason</th>
            <th class="text-left py-2 px-3 text-sm font-medium text-slate-400">Settlement</th>
            <th class="text-left py-2 px-3 text-sm font-medium text-slate-400">Time</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="tx in reversedTransactions"
            :key="tx.id"
            class="border-b border-slate-700 hover:bg-indigo-950/30 transition-colors duration-200"
          >
            <td class="py-2 px-3 text-sm">
              <span
                :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold', typeClass(tx.type)]"
              >
                {{ typeLabel(tx.type) }}
              </span>
            </td>
            <td class="py-2 px-3 text-sm text-gray-800">{{ formatWalletName(tx.from) }}</td>
            <td class="py-2 px-3 text-sm text-gray-800">{{ formatWalletName(tx.to) }}</td>
            <td class="py-2 px-3 text-sm font-medium text-green-600">
              {{ formatAmount(tx.amount) }} USDC
            </td>
            <td class="py-2 px-3 text-sm text-slate-400">{{ tx.reason }}</td>
            <td class="py-2 px-3 text-sm">
              <span
                :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold', settlementClass(tx)]"
              >
                {{ settlementLabel(tx) }}
              </span>
              <a
                v-if="explorerLink(tx)"
                :href="explorerLink(tx)"
                target="_blank"
                rel="noopener noreferrer"
                class="ml-2 text-xs text-blue-600 hover:underline font-mono"
                :title="tx.chainTxHash"
              >
                {{ shortHash(tx.chainTxHash) }} ↗
              </a>
            </td>
            <td class="py-2 px-3 text-sm text-slate-500">{{ formatTime(tx.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-slate-500 text-center py-8">
      No transactions yet.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { explorerTxUrl } from '../stores/appConfigStore.js';

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  }
});

const reversedTransactions = computed(() => props.transactions.slice().reverse());

const formatWalletName = (wallet) =>
  String(wallet || '').replace('_wallet', '').replaceAll('_', ' ');

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleTimeString();
};

const formatAmount = (amount) => {
  const num = Number(amount);
  return Number.isFinite(num) ? num.toFixed(6).replace(/\.?0+$/, '') : '0';
};

function settlementType(tx) {
  return tx.settlementType || 'simulated';
}

function settlementLabel(tx) {
  const t = settlementType(tx);
  if (t === 'onchain') return 'on-chain';
  if (t === 'onchain-dryrun') return 'dry-run';
  if (t === 'onchain-error') return 'chain-error';
  return 'simulated';
}

function settlementClass(tx) {
  const t = settlementType(tx);
  if (t === 'onchain')        return 'bg-emerald-100 text-emerald-800';
  if (t === 'onchain-dryrun') return 'bg-amber-100 text-amber-800';
  if (t === 'onchain-error')  return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

function explorerLink(tx) {
  if (settlementType(tx) !== 'onchain') return null;
  return explorerTxUrl(tx.chainTxHash);
}

function shortHash(hash) {
  if (!hash) return '';
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function typeLabel(type) {
  if (type === 'fund') return 'Fund';
  if (type === 'agent_payment') return 'Agent Pay';
  if (type === 'refund') return 'Refund';
  return 'Payment';
}

function typeClass(type) {
  if (type === 'fund') return 'bg-blue-100 text-blue-800';
  if (type === 'agent_payment') return 'bg-violet-100 text-violet-800';
  if (type === 'refund') return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-700 text-gray-800';
}
</script>
