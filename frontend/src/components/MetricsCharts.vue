<template>
  <div class="bg-slate-800 rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-800">Charts</h2>
      <button
        @click="refresh"
        class="text-xs px-2 py-1 rounded border border-indigo-500/20 text-slate-400 hover:bg-gray-50"
      >Refresh</button>
    </div>

    <div v-if="loading" class="text-gray-400 text-sm py-8 text-center">Loading…</div>

    <div v-else-if="!hasData" class="text-gray-400 text-sm py-8 text-center">
      Run a few missions (or a simulation) to see charts.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-2">Revenue by wallet</h3>
        <Bar :data="barData" :options="barOptions" />
      </div>
      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-2">Volume by mission type</h3>
        <Doughnut :data="doughnutData" :options="doughnutOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { api } from '../services/api.js';
import { toastError } from '../stores/toastStore.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const metrics = ref(null);
const loading = ref(false);

async function refresh() {
  loading.value = true;
  try {
    metrics.value = await api.metrics.getMetrics();
  } catch (err) {
    toastError(err, 'Failed to load metrics');
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
defineExpose({ refresh });

const hasData = computed(
  () => metrics.value && (metrics.value.totals?.completedTasks || 0) > 0
);

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#84cc16', '#ec4899', '#6366f1', '#14b8a6'
];

const barData = computed(() => {
  const r = metrics.value?.revenueByWallet || {};
  const labels = Object.keys(r).map((k) => k.replace('_wallet', ''));
  return {
    labels,
    datasets: [
      {
        label: 'USDC received',
        data: Object.values(r),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length])
      }
    ]
  };
});

const barOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 6 } } }
};

const doughnutData = computed(() => {
  const v = metrics.value?.volumeByTaskType || {};
  const labels = Object.keys(v);
  return {
    labels,
    datasets: [
      {
        data: Object.values(v),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length])
      }
    ]
  };
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { position: 'bottom' } }
};
</script>
