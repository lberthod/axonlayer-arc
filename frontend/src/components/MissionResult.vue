<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">Mission outcome</h2>
      <span
        v-if="result"
        class="px-2.5 py-1 rounded-full text-xs font-semibold"
        :class="statusTone"
      >
        {{ statusLabel }}
      </span>
    </div>

    <div v-if="result" class="space-y-4">
      <div>
        <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Mission ID</p>
        <p class="text-xs text-gray-700 font-mono">{{ result.taskId }}</p>
      </div>

      <div v-if="result.result">
        <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Final result</p>
        <p class="text-gray-900 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-3 rounded-lg border border-violet-100">
          {{ result.result }}
        </p>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <Stat :label="developerLabel" :value="agentsInvolved" tone="violet" />
        <Stat label="Total spent" :value="`${spent.toFixed(4)} USDC`" />
        <Stat label="Platform fee" :value="`${((result.platformFee || 0)).toFixed(4)} USDC`" tone="emerald" />
      </div>

      <div v-if="result.refunded !== undefined" class="grid grid-cols-2 gap-3">
        <Stat label="Budget" :value="`${((result.budget || 0)).toFixed(4)} USDC`" tone="gray" />
        <Stat label="Refunded" :value="`${((result.refunded || 0)).toFixed(4)} USDC`" tone="violet" />
      </div>

      <div v-if="result.selectedAgents" class="bg-violet-50 rounded-lg p-3 border border-violet-100">
        <p class="text-[10px] uppercase tracking-wider text-violet-700 font-semibold mb-2">Network Effect</p>
        <div class="space-y-1 text-xs">
          <p class="text-gray-700">Agents used: <span class="font-semibold">{{ agentsInvolved }}</span></p>
          <p class="text-gray-700">Owners: <span class="font-semibold">{{ uniqueOwners }} different developers</span></p>
          <p class="text-gray-700">Execution: <span class="font-semibold text-emerald-700">fully automated</span></p>
        </div>
      </div>

      <div v-if="result.validation" class="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
        Quality score:
        <span class="font-semibold text-gray-800">{{ score }}</span>
        · {{ result.validation.notes }}
      </div>

      <div v-if="result.settlementType" class="text-xs text-gray-500">
        Settlement: <span class="font-mono">{{ result.settlementType }}</span>
      </div>
    </div>

    <div v-else class="text-gray-500 text-center py-10">
      <div class="text-4xl mb-2">🎯</div>
      <p class="text-sm">No mission yet. Define a goal and a budget to launch one.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, h } from 'vue';

const props = defineProps({
  result: { type: Object, default: null },
  spent: { type: Number, default: 0 },
  developerCount: { type: Number, default: 0 }
});

const statusLabel = computed(() => {
  const s = props.result?.status;
  if (s === 'completed') return 'Mission completed';
  if (s === 'failed') return 'Mission failed';
  if (s === 'pending') return 'Running…';
  return s || '';
});

const statusTone = computed(() => {
  const s = props.result?.status;
  if (s === 'completed') return 'bg-emerald-100 text-emerald-800';
  if (s === 'failed') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
});

const agentsInvolved = computed(() => {
  const steps = props.result?.executionSteps || [];
  const unique = new Set(
    steps
      .map((s) => s.agentId || s.agent || s.wallet || s.message)
      .filter(Boolean)
  );
  if (unique.size) return unique.size;
  // Fallback: count distinct non-client wallets paid
  const wallets = new Set(
    (props.result?.transactions || [])
      .map((t) => t.to)
      .filter((w) => w && w !== 'client_wallet')
  );
  return wallets.size || 0;
});

const score = computed(() => {
  const v = props.result?.validation?.score;
  return typeof v === 'number' ? `${(v * 100).toFixed(0)}%` : '—';
});

const developerLabel = computed(() => {
  if (props.developerCount > 1) return `Agents involved (${props.developerCount} devs)`;
  return 'Agents involved';
});

const uniqueOwners = computed(() => {
  const selected = props.result?.selectedAgents || {};
  const owners = new Set();
  if (selected.worker) owners.add('worker');
  if (selected.validator) owners.add('validator');
  return owners.size;
});

const Stat = {
  props: ['label', 'value', 'tone'],
  setup(p) {
    const bg = {
      violet: 'bg-violet-50 text-violet-900',
      emerald: 'bg-emerald-50 text-emerald-900'
    }[p.tone] || 'bg-gray-50 text-gray-900';
    return () =>
      h('div', { class: `rounded-lg ${bg} p-3` }, [
        h('p', { class: 'text-[10px] uppercase tracking-wider opacity-70 mb-1' }, p.label),
        h('p', { class: 'text-base font-bold' }, p.value)
      ]);
  }
};
</script>
