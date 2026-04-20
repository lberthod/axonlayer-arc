<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">Execution budget</h2>
      <span
        v-if="settlementType"
        class="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-semibold"
        :class="settlementBadge"
      >
        {{ settlementLabel }}
      </span>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      <Stat label="Budget" :value="fmt(budget)" tone="gray" />
      <Stat label="Spent" :value="fmt(spent)" tone="violet" />
      <Stat label="Remaining" :value="fmt(remaining)" tone="emerald" />
    </div>

    <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
        :style="{ width: `${pct}%` }"
      ></div>
    </div>
    <p class="text-xs text-gray-500 mt-2">
      {{ pct.toFixed(1) }}% of budget consumed across {{ stepCount }} paid agent step(s).
    </p>
  </div>
</template>

<script setup>
import { computed, h } from 'vue';

const props = defineProps({
  budget: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  stepCount: { type: Number, default: 0 },
  settlementType: { type: String, default: '' }
});

const remaining = computed(() => Math.max(0, (props.budget || 0) - (props.spent || 0)));
const pct = computed(() => {
  if (!props.budget) return 0;
  return Math.min(100, (props.spent / props.budget) * 100);
});

const settlementLabel = computed(() => {
  if (!props.settlementType) return '';
  if (props.settlementType.includes('onchain')) return 'Arc · USDC settled on-chain';
  return 'Simulated USDC settlement';
});

const settlementBadge = computed(() =>
  props.settlementType.includes('onchain')
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-gray-100 text-gray-600'
);

function fmt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toFixed(4)} USDC` : '0.0000 USDC';
}

const Stat = {
  props: ['label', 'value', 'tone'],
  setup(p) {
    const toneClass = {
      gray: 'bg-gray-50 text-gray-800',
      violet: 'bg-violet-50 text-violet-800',
      emerald: 'bg-emerald-50 text-emerald-800'
    }[p.tone] || 'bg-gray-50 text-gray-800';
    return () =>
      h('div', { class: `rounded-lg p-3 ${toneClass}` }, [
        h('p', { class: 'text-[10px] uppercase tracking-wider opacity-70 mb-1' }, p.label),
        h('p', { class: 'text-base font-bold' }, p.value)
      ]);
  }
};
</script>
