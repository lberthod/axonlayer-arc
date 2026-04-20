<template>
  <div class="bg-white rounded-xl shadow-md p-4 border border-gray-100">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold text-gray-900">Mission Budget</h3>
      <span class="text-[10px] uppercase tracking-wider text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">
        Live Economic HUD
      </span>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-3">
      <div class="bg-gray-50 rounded-lg p-2">
        <p class="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Budget</p>
        <p class="text-base font-bold text-gray-900">{{ budget.toFixed(3) }} USDC</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-2">
        <p class="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Spent</p>
        <p class="text-base font-bold text-violet-700">{{ spent.toFixed(3) }} USDC</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-2">
        <p class="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Remaining</p>
        <p class="text-base font-bold text-emerald-700">{{ remaining.toFixed(3) }} USDC</p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="relative">
      <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300 ease-out"
          :class="progressColor"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <p class="text-[10px] text-gray-500 mt-1 text-right">
        {{ progressPercentage.toFixed(0) }}% spent
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
  if (pct < 30) return 'bg-emerald-500';
  if (pct < 60) return 'bg-violet-500';
  if (pct < 85) return 'bg-amber-500';
  return 'bg-red-500';
});
</script>
