<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-800">Network metrics</h2>
      <div class="flex items-center gap-2">
        <select
          v-model="windowMs"
          class="px-2 py-1 text-sm border border-gray-300 rounded-md"
        >
          <option :value="0">All time</option>
          <option :value="60000">Last 1 min</option>
          <option :value="300000">Last 5 min</option>
          <option :value="3600000">Last 1 hour</option>
        </select>
        <button
          @click="refresh"
          :disabled="loading"
          class="text-sm px-3 py-1 rounded-md bg-blue-600 text-white disabled:bg-gray-400"
        >
          {{ loading ? '...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="metrics" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Missions</p>
          <p class="text-lg font-bold text-gray-800">{{ metrics.totals.totalTasks }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Completed</p>
          <p class="text-lg font-bold text-green-700">{{ metrics.totals.completedTasks }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Failed</p>
          <p class="text-lg font-bold text-red-600">{{ metrics.totals.failedTasks }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Success Rate</p>
          <p class="text-lg font-bold text-gray-800">{{ successRate }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Gross Volume</p>
          <p class="text-lg font-bold text-gray-800">{{ formatAmount(metrics.totals.grossVolume) }} USDC</p>
        </div>
        <div class="bg-emerald-50 rounded-lg p-3">
          <p class="text-xs text-emerald-600 uppercase mb-1">Platform Fees</p>
          <p class="text-lg font-bold text-emerald-800">{{ formatAmount(metrics.totals.platformFees || 0) }} USDC</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Transactions</p>
          <p class="text-lg font-bold text-gray-800">{{ metrics.totals.transactions }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Avg Duration</p>
          <p class="text-lg font-bold text-gray-800">{{ metrics.totals.avgDurationMs }} ms</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 uppercase mb-1">Settlement</p>
          <p class="text-lg font-bold text-gray-800">{{ metrics.settlement.mode }}</p>
        </div>
      </div>

      <div v-if="taskTypeEntries.length" class="pt-2">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">Volume by mission type</h3>
        <div class="space-y-1">
          <div
            v-for="[type, vol] in taskTypeEntries"
            :key="type"
            class="flex justify-between text-sm"
          >
            <span class="text-gray-600 capitalize">{{ type }}</span>
            <span class="font-mono text-gray-800">{{ formatAmount(vol) }} USDC</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
    <div v-else class="text-gray-500 text-center py-4">Loading...</div>
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
