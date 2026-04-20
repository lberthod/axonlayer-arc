<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-bold mb-4 text-gray-800">Simulation</h2>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Number of Missions</label>
        <input
          v-model.number="missionCount"
          type="number"
          min="1"
          max="500"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        @click="handleRunSimulation"
        :disabled="isRunning"
        class="w-full bg-violet-600 text-white py-2 px-4 rounded-md hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        {{ isRunning ? 'Running batch simulation...' : 'Run batch simulation' }}
      </button>
      <div v-if="simulationResult" class="mt-4 p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-md border border-violet-100">
        <h3 class="font-semibold text-gray-800 mb-3">Batch Simulation Results</h3>
        
        <!-- Transaction Counter Badge - Prominent Display -->
        <div class="mb-4 p-4 rounded-lg text-center" :class="txBadgeClass">
          <p class="text-xs uppercase tracking-wider mb-1">Total On-Chain Transactions</p>
          <p class="text-4xl font-bold">{{ simulationResult.transactionsCreated }}</p>
          <p v-if="simulationResult.transactionsCreated >= 50" class="text-sm mt-1 font-semibold">
            ✅ 50+ transactions demonstrated
          </p>
          <p v-else class="text-sm mt-1 text-gray-600">
            Run 50+ missions to demonstrate scale
          </p>
        </div>

        <div class="grid grid-cols-1 gap-2 text-sm">
          <div class="flex justify-between items-center p-2 bg-white rounded-lg">
            <span class="text-gray-600">Missions simulated</span>
            <span class="font-bold text-gray-900">{{ simulationResult.executed }}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-white rounded-lg">
            <span class="text-gray-600">Avg cost per action</span>
            <span class="font-bold text-emerald-600">{{ avgCostPerAction }} USDC</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['simulate']);

const missionCount = ref(50);
const isRunning = ref(false);
const simulationResult = ref(null);

const handleRunSimulation = async () => {
  isRunning.value = true;
  simulationResult.value = null;
  emit('simulate', missionCount.value);
};

const setRunning = (running) => {
  isRunning.value = running;
};

const setResult = (result) => {
  simulationResult.value = result;
};

const avgCostPerAction = computed(() => {
  if (!simulationResult.value) return '0.000';
  const volume = Number(simulationResult.value.summary?.grossVolume || 0);
  const txCount = Number(simulationResult.value.transactionsCreated || 0);
  if (!txCount) return '0.000';
  return (volume / txCount).toFixed(3);
});

const txBadgeClass = computed(() => {
  const txCount = simulationResult.value?.transactionsCreated || 0;
  if (txCount >= 50) {
    return 'bg-emerald-100 border-2 border-emerald-300 text-emerald-800';
  }
  return 'bg-gray-100 border border-gray-300 text-gray-700';
});

defineExpose({ setRunning, setResult });
</script>
