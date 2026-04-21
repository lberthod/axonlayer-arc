<template>
  <div class="bg-white rounded-xl shadow-md p-4 border border-gray-100">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold text-gray-900">Mission Budget</h3>
      <span class="text-[10px] uppercase tracking-wider text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">
        Live Economic HUD
      </span>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="rounded-lg p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 transition-all duration-300">
        <p class="text-[9px] uppercase tracking-wider text-gray-600 font-semibold mb-1">Budget</p>
        <p class="text-lg font-bold text-gray-900 tracking-tight">{{ budget.toFixed(3) }} <span class="text-xs text-gray-500">USDC</span></p>
      </div>
      <div class="rounded-lg p-3 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 transition-all duration-300">
        <p class="text-[9px] uppercase tracking-wider text-violet-700 font-semibold mb-1">Spent</p>
        <p class="text-lg font-bold text-violet-800 tracking-tight">{{ spent.toFixed(3) }} <span class="text-xs text-violet-600">USDC</span></p>
      </div>
      <div class="rounded-lg p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 transition-all duration-300">
        <p class="text-[9px] uppercase tracking-wider text-emerald-700 font-semibold mb-1">Remaining</p>
        <p class="text-lg font-bold text-emerald-800 tracking-tight">{{ remaining.toFixed(3) }} <span class="text-xs text-emerald-600">USDC</span></p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative">
      <div class="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full overflow-hidden shadow-sm border border-gray-200">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out shadow-lg"
          :class="progressColor"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <p class="text-[10px] text-gray-500 mt-2 text-right font-semibold">
        {{ progressPercentage.toFixed(0) }}% utilized
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  budget: { type: Number, default: 0 },
  spent: { type: Number, default: 0 }
});

const remaining = computed(() => Math.max(0, props.budget - props.spent));

const progressPercentage = computed(() => {
  if (props.budget <= 0) return 0;
  return Math.min(100, (props.spent / props.budget) * 100);
});

const progressColor = computed(() => {
  const pct = progressPercentage.value;
  if (pct < 30) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
  if (pct < 60) return 'bg-gradient-to-r from-violet-500 to-fuchsia-500';
  if (pct < 85) return 'bg-gradient-to-r from-amber-500 to-orange-500';
  return 'bg-gradient-to-r from-red-500 to-rose-500';
});
</script>
