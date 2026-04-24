<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-slate-100">Mission Wallet</h2>
      <span class="text-[10px] uppercase tracking-wider text-violet-700 bg-indigo-950 px-2 py-1 rounded-full font-semibold">
        Pre-funded
      </span>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      <Stat label="Balance" :value="fmt(balance)" tone="gray" />
      <Stat label="Reserved" :value="fmt(reserved)" tone="violet" />
      <Stat label="Remaining" :value="fmt(remaining)" tone="emerald" />
    </div>

    <div class="h-2 rounded-full bg-slate-700 overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
        :style="{ width: `${pct}%` }"
      ></div>
    </div>
    <p class="text-xs text-slate-500 mt-2">
      {{ pct.toFixed(1) }}% of balance reserved for active missions.
    </p>
  </div>
</template>

<script setup>
import { computed, h } from 'vue';

const props = defineProps({
  balance: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 }
});

const pct = computed(() => {
  if (!props.balance) return 0;
  return Math.min(100, (props.reserved / props.balance) * 100);
});

function fmt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toFixed(4)} USDC` : '0.0000 USDC';
}

const Stat = {
  props: ['label', 'value', 'tone'],
  setup(p) {
    const toneClass = {
      gray: 'bg-gray-50 text-gray-800',
      violet: 'bg-indigo-950 text-violet-800',
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
