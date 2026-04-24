<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-slate-100">Network metrics</h2>
      <div class="flex items-center gap-2">
        <select
          v-model="windowMs"
          class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        >
          <option :value="0">All time</option>
          <option :value="60000">Last 1 min</option>
          <option :value="300000">Last 5 min</option>
          <option :value="3600000">Last 1 hour</option>
        </select>
        <button
          @click="refresh"
          :disabled="loading"
          class="text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
        >
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="metrics" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="rounded-lg p-4 border bg-gradient-to-br from-gray-50 to-gray-100 border-indigo-500/20 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Missions</p>
          <p class="text-lg font-bold">{{ metrics.totals.totalTasks }}</p>
        </div>
        <div class="rounded-lg p-4 border bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Completed</p>
          <p class="text-lg font-bold text-emerald-800">{{ metrics.totals.completedTasks }}</p>
        </div>
        <div class="rounded-lg p-4 border bg-gradient-to-br from-red-50 to-red-100 border-red-200 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Failed</p>
          <p class="text-lg font-bold text-red-800">{{ metrics.totals.failedTasks }}</p>
        </div>
        <div class="rounded-lg p-4 border bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Success Rate</p>
          <p class="text-lg font-bold text-blue-800">{{ successRate }}</p>
        </div>
        <div class="rounded-lg p-4 border bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Gross Volume</p>
          <p class="text-lg font-bold text-violet-800">{{ formatAmount(metrics.totals.grossVolume) }} <span class="text-xs text-indigo-400">USDC</span></p>
        </div>
        <div class="rounded-lg p-4 border bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Platform Fees</p>
          <p class="text-lg font-bold text-emerald-800">{{ formatAmount(metrics.totals.platformFees || 0) }} <span class="text-xs text-emerald-600">USDC</span></p>
        </div>
        <div class="rounded-lg p-4 border bg-gradient-to-br from-gray-50 to-gray-100 border-indigo-500/20 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Transactions</p>
          <p class="text-lg font-bold">{{ metrics.totals.transactions }}</p>
        </div>
        <div class="rounded-lg p-4 border bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 transition-all duration-300 hover:shadow-md">
          <p class="text-[10px] font-semibold uppercase mb-1 opacity-70 tracking-wider">Avg Duration</p>
          <p class="text-lg font-bold text-amber-800">{{ metrics.totals.avgDurationMs }} <span class="text-xs text-amber-600">ms</span></p>
        </div>
      </div>

      <div v-if="taskTypeEntries.length" class="pt-2">
        <h3 class="text-sm font-semibold text-slate-300 mb-2">Volume by mission type</h3>
        <div class="space-y-1">
          <div
            v-for="[type, vol] in taskTypeEntries"
            :key="type"
            class="flex justify-between text-sm"
          >
            <span class="text-slate-400 capitalize">{{ type }}</span>
            <span class="font-mono text-gray-800">{{ formatAmount(vol) }} USDC</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
    <div v-else class="text-slate-500 text-center py-4">Loading...</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { api } from '../services/api.js';

const windowMs = ref(0);
const metrics = ref(null);
const loading = ref(false);
const error = ref('');

const successRate = computed(() => {
  const rate = metrics.value?.totals?.successRate;
  return rate === null || rate === undefined ? 'N/A' : `${(rate * 100).toFixed(1)}%`;
});

const taskTypeEntries = computed(() =>
  Object.entries(metrics.value?.volumeByTaskType || {})
);

const formatAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(6).replace(/\.?0+$/, '') : '0';
};

const refresh = async () => {
  loading.value = true;
  error.value = '';
  try {
    metrics.value = await api.getMetrics(windowMs.value || undefined);
  } catch (err) {
    error.value = err.message || 'Failed to load metrics';
  } finally {
    loading.value = false;
  }
};

defineExpose({ refresh });

watch(windowMs, refresh);
onMounted(refresh);
</script>
