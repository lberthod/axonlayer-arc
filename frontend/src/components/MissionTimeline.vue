<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-slate-100">Execution timeline</h2>
      <div class="flex items-center gap-2">
        <span
          v-if="phases.length"
          class="text-[10px] uppercase tracking-wider font-semibold text-violet-700 bg-indigo-950 px-2 py-0.5 rounded-full"
        >
          Machine-to-machine economy
        </span>
        <span
          v-if="isOnchain"
          class="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
        >
          ⚡ Settled on Arc
        </span>
      </div>
    </div>

    <!-- WOW MOMENT: Economic Coordination Visualization -->
    <div v-if="phases.length && completed" class="mb-6 p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-lg border border-violet-100">
      <p class="text-sm font-bold text-slate-100 mb-3 text-center">
        Agents are not just executed.
        <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">They are economically coordinated.</span>
      </p>
      <div class="flex items-center justify-center gap-2 text-sm flex-wrap">
        <div class="flex items-center gap-1">
          <span class="px-2 py-1 bg-violet-600 text-white rounded text-xs font-bold">Agent A</span>
          <span class="text-emerald-600 font-semibold">paid</span>
        </div>
        <span class="text-gray-400">→</span>
        <div class="flex items-center gap-1">
          <span class="px-2 py-1 bg-fuchsia-600 text-white rounded text-xs font-bold">calls Agent B</span>
          <span class="text-emerald-600 font-semibold">paid</span>
        </div>
        <span class="text-gray-400">→</span>
        <div class="flex items-center gap-1">
          <span class="px-2 py-1 bg-violet-600 text-white rounded text-xs font-bold">calls Agent C</span>
          <span class="text-emerald-600 font-semibold">paid</span>
        </div>
      </div>
    </div>

    <div v-if="phases.length" class="space-y-0">
      <div
        v-for="(phase, i) in phases"
        :key="i"
        class="relative flex items-start gap-3 pb-4"
      >
        <div
          v-if="i < phases.length - 1"
          class="absolute left-4 top-8 bottom-0 w-px"
          :class="phase.done ? 'bg-gradient-to-b from-violet-500 to-fuchsia-500' : 'bg-slate-600'"
        ></div>
        <div
          class="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10"
          :class="phase.done
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md'
            : 'bg-slate-600 text-slate-500'"
        >
          <span v-if="phase.done">{{ phase.icon || '✓' }}</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="flex-1 pt-0.5">
          <p class="text-sm font-semibold text-slate-100">{{ phase.title }}</p>
          <p class="text-xs text-slate-400">{{ phase.detail }}</p>
          <div v-if="phase.payment" class="mt-1.5 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">
            <span class="text-[11px] font-semibold text-emerald-800">
              {{ phase.payment.amount }} USDC
            </span>
            <span class="text-[10px] text-emerald-600">
              {{ phase.payment.from }} → {{ phase.payment.to }}
            </span>
            <a
              v-if="phase.payment.explorerUrl"
              :href="phase.payment.explorerUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] font-mono text-emerald-700 hover:underline"
              :title="phase.payment.hash"
            >
              {{ phase.payment.shortHash }} ↗
            </a>
            <span
              v-else-if="phase.payment.hash"
              class="text-[10px] font-mono text-slate-500"
            >{{ phase.payment.shortHash }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-slate-500 text-center py-8 text-sm">
      No execution yet. Launch a mission to see the orchestrator in action.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { explorerTxUrl } from '../stores/appConfigStore.js';

const props = defineProps({
  steps: { type: Array, default: () => [] },
  result: { type: Object, default: null },
  transactions: { type: Array, default: () => [] }
});

const completed = computed(() => props.result?.status === 'completed');

const isOnchain = computed(() => {
  const anyTx = props.transactions?.find(t => (t.settlementType || 'simulated') === 'onchain');
  return !!anyTx;
});

const payments = computed(() =>
  (props.transactions || []).filter((t) => Number(t.amount || 0) > 0)
);

const workerPay = computed(() =>
  payments.value.find((t) => /worker/i.test(t.reason || '') || t.to?.includes('worker'))
);
const validatorPay = computed(() =>
  payments.value.find((t) => /validator|validation/i.test(t.reason || '') || t.to?.includes('validator'))
);
const clientPay = computed(() =>
  payments.value.find((t) => t.from === 'client_wallet')
);

const phases = computed(() => {
  if (!props.steps?.length && !props.result) return [];

  const steps = props.steps || [];
  const selected = props.result?.selectedAgents || {};
  const hasSteps = steps.length > 0;

  // Check for funding transaction
  const fundTx = payments.value.find(t => t.type === 'fund');
  // Check for refund transaction
  const refundTx = payments.value.find(t => t.type === 'refund');

  return [
    {
      title: '→ Funding mission',
      detail: fundTx
        ? `Budget ${formatAmount(fundTx.amount)} USDC transferred to treasury.`
        : 'Transferring budget to treasury...',
      done: !!fundTx || steps.length > 0,
      icon: '💰',
      payment: paymentCard(fundTx)
    },
    {
      title: '→ Selecting agent',
      detail: selected.worker
        ? `Private agent "${selected.worker}" selected by orchestrator.`
        : 'Orchestrator selecting optimal private agent...',
      done: !!selected.worker || steps.length > 0,
      icon: '🔍'
    },
    {
      title: '→ Paying worker from treasury',
      detail: 'Worker payment routed through treasury with platform fee.',
      done: !!workerPay.value || steps.length > 1,
      icon: '💸',
      payment: paymentCard(workerPay.value)
    },
    {
      title: '→ Transaction confirmed',
      detail: workerPay.value?.chainTxHash ? `Tx ${workerPay.value.chainTxHash.slice(0, 8)}… confirmed on-chain.` : 'Awaiting blockchain confirmation...',
      done: !!workerPay.value?.chainTxHash || steps.length > 2,
      icon: '✓',
      payment: paymentCard(workerPay.value)
    },
    {
      title: '→ Executing API',
      detail: 'Agent executing the requested capability.',
      done: steps.length > 2 || completed.value,
      icon: '⚙️'
    },
    {
      title: '→ Paying validator from treasury',
      detail: 'Validator payment routed through treasury with platform fee.',
      done: !!validatorPay.value || steps.length > 3,
      icon: '💸',
      payment: paymentCard(validatorPay.value)
    },
    {
      title: '→ Result received',
      detail: completed.value
        ? 'Agent output received and validated.'
        : 'Waiting for agent response...',
      done: completed.value,
      icon: '📦'
    },
    {
      title: '→ Refunding unused budget',
      detail: refundTx
        ? `Refunded ${formatAmount(refundTx.amount)} USDC to mission wallet.`
        : 'No refund needed (budget fully utilized).',
      done: refundTx !== undefined || completed.value,
      icon: '↩️',
      payment: paymentCard(refundTx)
    }
  ];
});

function paymentCard(tx) {
  if (!tx) return null;
  const hash = tx.chainTxHash || null;
  const isOnchain = (tx.settlementType || 'simulated') === 'onchain';
  return {
    amount: formatAmount(tx.amount),
    from: prettyWallet(tx.from),
    to: prettyWallet(tx.to),
    hash,
    shortHash: hash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : '',
    explorerUrl: hash && isOnchain ? explorerTxUrl(hash) : null
  };
}

function prettyWallet(w) {
  if (!w) return '—';
  return String(w).replace('_wallet', '').replaceAll('_', ' ');
}

function formatAmount(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6).replace(/\.?0+$/, '') : '0';
}
</script>
