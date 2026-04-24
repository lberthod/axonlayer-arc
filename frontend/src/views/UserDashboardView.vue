<template>
  <div class="container mx-auto px-6 py-8 space-y-6">
    <div class="bg-slate-800 rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold text-slate-100 mb-1">My account</h1>
      <p class="text-slate-500 text-sm mb-4">Your missions, spend and API credentials.</p>

      <div v-if="me" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Role" :value="roleLabel(me.role)" />
        <Stat label="Missions executed" :value="me.usage.tasks" />
        <Stat label="Total spent" :value="`${me.usage.totalSpent} USDC`" />
        <Stat label="Today" :value="`${me.usage.today.tasks} missions · ${me.usage.today.spent} USDC`" />
      </div>
    </div>

    <!-- Wallet Manager -->
    <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
      <WalletManager />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-slate-100 mb-3">API access</h2>
        <p class="text-sm text-slate-500 mb-3">
          Use this API key from server-to-server calls (<code>x-api-key</code> header).
        </p>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-slate-900 border border-slate-600 text-slate-300 rounded px-2 py-1 text-xs break-all font-mono">{{ me?.apiKey || '...' }}</code>
          <button @click="rotate" class="text-sm px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition">Rotate</button>
        </div>

        <h3 class="text-sm font-semibold text-slate-300 mt-5 mb-2">Payout wallet (EVM)</h3>
        <div class="flex items-center gap-2">
          <input
            v-model="walletAddress"
            placeholder="0x..."
            class="flex-1 border border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 rounded px-2 py-1 text-sm"
          />
          <button @click="saveWallet" class="text-sm px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition">Save</button>
        </div>

        <div class="mt-6">
          <button
            v-if="me?.role === 'user'"
            @click="upgradeToProvider"
            class="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >Become an agent operator</button>
        </div>
      </div>

      <div class="bg-slate-800 rounded-lg shadow p-6">
        <div class="space-y-3 mb-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-100">My missions</h2>
            <select
              v-model="statusFilter"
              class="text-sm px-3 py-2 border border-slate-600 rounded bg-slate-900 text-slate-100 font-medium"
            >
              <option value="">All ({{ missions.length }})</option>
              <option value="completed">✅ Completed ({{ completedCount }})</option>
              <option value="failed">❌ Failed ({{ failedCount }})</option>
              <option value="pending">⏳ Pending ({{ pendingCount }})</option>
            </select>
          </div>
          <p class="text-xs text-slate-500">Click any mission to view details, pricing, validation score, and execution timeline</p>
        </div>

        <div v-if="filteredMissions.length" class="space-y-3 max-h-96 overflow-auto">
          <div
            v-for="t in filteredMissions"
            :key="t.id"
            class="border border-indigo-500/20 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition bg-slate-800/50"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-mono text-xs text-slate-500 truncate">{{ t.id.slice(0, 18) }}...</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                    :class="t.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : t.status === 'failed' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'"
                  >{{ t.status.toUpperCase() }}</span>
                </div>
                <p class="text-sm font-medium text-slate-100">{{ t.taskType }}</p>
                <p class="text-sm text-slate-400 mt-1">
                  💰 {{ t.pricing?.clientPayment?.toFixed(6) || '-' }} USDC
                </p>
                <p class="text-xs text-slate-500 mt-1">{{ new Date(t.createdAt).toLocaleString() }}</p>
              </div>

              <button
                @click="openTaskDetails(t.id)"
                :disabled="loadingTask"
                class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
              >
                {{ loadingTask ? '...' : 'View Details' }}
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-500 py-4">
          {{ statusFilter ? `No ${statusFilter} missions.` : 'No missions yet.' }}
          <router-link to="/mission" class="text-blue-600 hover:text-blue-700 font-semibold">Head to Mission Control →</router-link>
        </p>
      </div>
    </div>

    <!-- Task Details Modal -->
    <div
      v-if="selectedTask"
      @click="selectedTask = null"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        @click.stop
        class="bg-slate-800 rounded-xl shadow-lg max-w-2xl max-h-96 overflow-y-auto"
      >
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-slate-100">Mission Details</h2>
            <button
              @click="selectedTask = null"
              class="text-slate-500 hover:text-slate-300 text-2xl"
            >×</button>
          </div>

          <div v-if="selectedTask" class="space-y-4">
            <!-- Task ID and Status -->
            <div class="bg-slate-900 border border-slate-700 rounded p-4">
              <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Task ID</p>
              <p class="font-mono text-sm text-slate-300 break-all">{{ selectedTask.id }}</p>
              <span
                class="inline-block text-xs px-3 py-1 rounded mt-3"
                :class="selectedTask.status === 'completed'
                  ? 'bg-emerald-950 text-emerald-400'
                  : selectedTask.status === 'failed'
                  ? 'bg-red-950 text-red-400'
                  : 'bg-amber-950 text-amber-400'"
              >{{ selectedTask.status }}</span>
            </div>

            <!-- Input and Result -->
            <div class="grid grid-cols-1 gap-4">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Input</p>
                <p class="text-sm text-slate-300 bg-slate-900 border border-slate-700 p-3 rounded break-words">{{ selectedTask.input }}</p>
              </div>
              <div v-if="selectedTask.result">
                <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Result</p>
                <p class="text-sm text-slate-300 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded break-words">{{ selectedTask.result }}</p>
              </div>
            </div>

            <!-- Validation Score -->
            <div v-if="selectedTask.validation" class="bg-blue-950/20 border border-blue-900/30 rounded p-4">
              <p class="text-xs text-slate-500 uppercase tracking-wide mb-2">Validation</p>
              <div class="flex items-center gap-4">
                <div>
                  <p class="text-sm font-semibold text-slate-300">
                    {{ selectedTask.validation.valid ? '✅ Valid' : '❌ Invalid' }}
                  </p>
                  <p class="text-xs text-slate-400 mt-1">
                    Score: {{ (selectedTask.validation.score * 100).toFixed(0) }}%
                  </p>
                </div>
                <p class="text-xs text-slate-400 flex-1">{{ selectedTask.validation.notes }}</p>
              </div>
            </div>

            <!-- Pricing and Payment -->
            <div v-if="selectedTask.pricing" class="grid grid-cols-2 gap-3">
              <div class="bg-slate-900 border border-slate-700 p-3 rounded">
                <p class="text-xs text-slate-500">Client Payment</p>
                <p class="font-semibold text-slate-100">{{ selectedTask.pricing.clientPayment.toFixed(6) }} USDC</p>
              </div>
              <div class="bg-slate-900 border border-slate-700 p-3 rounded">
                <p class="text-xs text-slate-500">Worker Payment</p>
                <p class="font-semibold text-slate-100">{{ selectedTask.pricing.workerPayment?.toFixed(6) || '-' }} USDC</p>
              </div>
              <div class="bg-slate-900 border border-slate-700 p-3 rounded">
                <p class="text-xs text-slate-500">Validator Payment</p>
                <p class="font-semibold text-slate-100">{{ selectedTask.pricing.validatorPayment?.toFixed(6) || '-' }} USDC</p>
              </div>
              <div class="bg-slate-900 border border-slate-700 p-3 rounded">
                <p class="text-xs text-slate-500">Orchestrator Margin</p>
                <p class="font-semibold text-slate-100">{{ selectedTask.pricing.orchestratorMargin?.toFixed(6) || '-' }} USDC</p>
              </div>
            </div>

            <!-- Execution Steps -->
            <div v-if="selectedTask.executionSteps?.length" class="bg-slate-900 border border-slate-700 rounded p-4">
              <p class="text-xs text-slate-500 uppercase tracking-wide mb-3">Execution Steps</p>
              <div class="space-y-2">
                <div v-for="(step, idx) in selectedTask.executionSteps" :key="idx" class="text-xs text-slate-300">
                  <span class="font-semibold">Step {{ step.step }}:</span> {{ step.message }}
                  <span class="text-slate-500 ml-2">{{ new Date(step.timestamp).toLocaleTimeString() }}</span>
                </div>
              </div>
            </div>

            <!-- Timestamps -->
            <div class="text-xs text-slate-500 space-y-1">
              <p><span class="font-semibold">Created:</span> {{ new Date(selectedTask.createdAt).toLocaleString() }}</p>
              <p><span class="font-semibold">Updated:</span> {{ new Date(selectedTask.updatedAt).toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../services/api.js';
import { h } from 'vue';
import WalletManager from '../components/WalletManager.vue';

const me = ref(null);
const missions = ref([]);
const walletAddress = ref('');
const selectedTask = ref(null);
const loadingTask = ref(false);
const statusFilter = ref('');

async function refresh() {
  me.value = await api.getMe();
  walletAddress.value = me.value.walletAddress || '';
  missions.value = (await api.getMyTasks().catch(() => [])) || [];
}

const completedCount = computed(() => missions.value.filter(m => m.status === 'completed').length);
const failedCount = computed(() => missions.value.filter(m => m.status === 'failed').length);
const pendingCount = computed(() => missions.value.filter(m => m.status === 'pending').length);

const filteredMissions = computed(() => {
  if (!statusFilter.value) return missions.value;
  return missions.value.filter(m => m.status === statusFilter.value);
});

async function rotate() {
  me.value = await api.rotateApiKey();
}

async function saveWallet() {
  if (!walletAddress.value) return;
  me.value = await api.setWalletAddress(walletAddress.value);
}

async function upgradeToProvider() {
  await api.becomeProvider();
  await refresh();
}

async function openTaskDetails(taskId) {
  loadingTask.value = true;
  try {
    selectedTask.value = await api.getTask(taskId);
  } catch (error) {
    console.error('Failed to load task details:', error);
    selectedTask.value = null;
  } finally {
    loadingTask.value = false;
  }
}

function roleLabel(role) {
  if (role === 'provider') return 'operator';
  return role;
}

onMounted(refresh);

const Stat = {
  props: ['label', 'value'],
  setup(props) {
    return () =>
      h('div', { class: 'bg-slate-800 rounded p-3 border border-slate-700' }, [
        h('p', { class: 'text-xs text-slate-500 uppercase mb-1' }, props.label),
        h('p', { class: 'text-lg font-bold text-slate-100' }, props.value)
      ]);
  }
};
</script>
