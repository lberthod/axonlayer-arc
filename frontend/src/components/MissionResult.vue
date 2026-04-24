<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-slate-100">Mission outcome</h2>
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
        <p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Mission ID</p>
        <p class="text-xs text-slate-300 font-mono">{{ result.taskId }}</p>
      </div>

      <!-- Error details for failed missions -->
      <div v-if="result.status === 'failed' && result.error" class="bg-red-950/20 border border-red-900/50 rounded-lg p-3">
        <p class="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-2">Error Details</p>
        <div class="space-y-1 text-xs">
          <p class="text-red-300">
            <span class="font-semibold">Error:</span> {{ result.error }}
          </p>
          <p v-if="result.errorLocation" class="text-red-400 font-mono">
            <span class="font-semibold">Location:</span> {{ result.errorLocation }}
          </p>
          <details v-if="result.errorStack" class="mt-2">
            <summary class="cursor-pointer text-red-400 font-semibold hover:text-red-300">Stack trace</summary>
            <pre class="mt-2 text-[10px] bg-slate-900 border border-slate-700 p-2 rounded overflow-auto max-h-40 text-red-300">{{ result.errorStack }}</pre>
          </details>
        </div>
      </div>

      <div v-if="result.result">
        <p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Final result</p>
        <p class="text-slate-100 bg-slate-900 border border-slate-700 p-3 rounded-lg">
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

      <div v-if="result.selectedAgents" class="bg-indigo-950/50 rounded-lg p-3 border border-indigo-500/20">
        <p class="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold mb-2">Network Effect</p>
        <div class="space-y-1 text-xs">
          <p class="text-slate-300">Agents used: <span class="font-semibold">{{ agentsInvolved }}</span></p>
          <p class="text-slate-300">Owners: <span class="font-semibold">{{ uniqueOwners }} different developers</span></p>
          <p class="text-slate-300">Execution: <span class="font-semibold text-emerald-400">fully automated</span></p>
        </div>
      </div>

      <div v-if="result.validation" class="text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-lg p-3">
        Quality score:
        <span class="font-semibold text-slate-100">{{ score }}</span>
        · {{ result.validation.notes }}
      </div>

      <div v-if="result.settlementType" class="text-xs text-slate-500">
        Settlement: <span class="font-mono">{{ result.settlementType }}</span>
      </div>
    </div>

    <div v-else class="text-slate-500 text-center py-12">
      <div class="text-6xl mb-3 animate-bounce">🎯</div>
      <p class="text-sm text-slate-400">No mission yet. Define a goal and a budget to launch one.</p>
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
  if (s === 'completed') return 'bg-emerald-950 text-emerald-400';
  if (s === 'failed') return 'bg-red-950 text-red-400';
  return 'bg-amber-950 text-amber-400';
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
      violet: 'bg-indigo-950/50 border border-indigo-500/20 text-slate-100',
      emerald: 'bg-emerald-950/50 border border-emerald-500/20 text-slate-100'
    }[p.tone] || 'bg-slate-800 border border-slate-700 text-slate-100';
    return () =>
      h('div', { class: `rounded-lg ${bg} p-3` }, [
        h('p', { class: 'text-[10px] uppercase tracking-wider opacity-70 mb-1' }, p.label),
        h('p', { class: 'text-base font-bold' }, p.value)
      ]);
  }
};
</script>
