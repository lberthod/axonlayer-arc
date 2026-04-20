<template>
  <div class="container mx-auto px-6 py-8 space-y-6">
    <header class="bg-gradient-to-br from-gray-900 to-violet-900 text-white rounded-xl shadow-lg p-6">
      <div class="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p class="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-1">Agent Operator Console</p>
          <h1 class="text-2xl font-extrabold">Deploy private agents. Earn USDC per action.</h1>
          <p class="text-sm opacity-80 max-w-2xl mt-1">
            Register an autonomous agent, stake USDC to signal commitment, and get paid each time the
            orchestrator routes a mission step to your endpoint.
          </p>
        </div>
        <div class="grid grid-cols-3 gap-3 text-center">
          <OpStat :value="totals.agents" label="My agents" />
          <OpStat :value="`${totals.earned} USDC`" label="Earned" />
          <OpStat :value="`${totals.stake} USDC`" label="Total stake" />
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Register -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 class="text-lg font-bold text-gray-900 mb-1">Register a new agent</h2>
        <p class="text-xs text-gray-500 mb-4">
          Your agent stays private — it's not visible to end-users as a catalog entry.
        </p>
        <form class="space-y-3" @submit.prevent="submit">
          <div class="grid grid-cols-2 gap-3">
            <label class="text-sm">
              <span class="text-gray-600">Agent name</span>
              <input v-model="form.name" required class="mt-1 w-full border rounded-md px-2 py-1.5" />
            </label>
            <label class="text-sm">
              <span class="text-gray-600">Capability role</span>
              <select v-model="form.role" class="mt-1 w-full border rounded-md px-2 py-1.5">
                <option value="worker">Execution agent</option>
                <option value="validator">Quality agent</option>
              </select>
            </label>
          </div>
          <label class="text-sm block">
            <span class="text-gray-600">Description</span>
            <textarea v-model="form.description" rows="2" class="mt-1 w-full border rounded-md px-2 py-1.5" placeholder="What does your agent do?"></textarea>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="text-sm">
              <span class="text-gray-600">Price per action (USDC)</span>
              <input v-model.number="form.basePrice" type="number" step="0.0001" min="0" class="mt-1 w-full border rounded-md px-2 py-1.5" />
            </label>
            <label class="text-sm">
              <span class="text-gray-600">Capabilities</span>
              <input v-model="form.taskTypesRaw" class="mt-1 w-full border rounded-md px-2 py-1.5" placeholder="summarize,keywords" />
            </label>
          </div>
          <label class="text-sm block">
            <span class="text-gray-600">API endpoint (private)</span>
            <input v-model="form.apiEndpoint" class="mt-1 w-full border rounded-md px-2 py-1.5" placeholder="https://my-agent.example.com/run" />
          </label>
          <label class="text-sm block">
            <span class="text-gray-600">Payout wallet (EVM)</span>
            <input v-model="form.walletAddress" class="mt-1 w-full border rounded-md px-2 py-1.5 font-mono" placeholder="0x..." />
          </label>
          <button class="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-2 rounded-md font-semibold hover:shadow-lg transition">
            Submit for network approval
          </button>
          <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
          <p v-if="success" class="text-emerald-600 text-sm">{{ success }}</p>
        </form>
      </div>

      <!-- My agents -->
      <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-gray-900">My agents</h2>
          <button @click="refresh" class="text-xs text-violet-600 hover:text-violet-800">Refresh</button>
        </div>
        <div v-if="providers.length" class="space-y-3">
          <div
            v-for="p in providers"
            :key="p.id"
            class="border border-gray-100 rounded-lg p-4 hover:border-violet-200 transition"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-gray-900">{{ p.name }}</div>
                <div class="text-xs text-gray-500 font-mono">{{ p.id }} · {{ roleLabel(p.role) }}</div>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold" :class="statusTone(p.status)">
                {{ p.status }}
              </span>
            </div>
            <div class="grid grid-cols-4 gap-2 text-xs text-gray-600 mt-3">
              <div><span class="text-gray-400 block">Price</span>{{ p.basePrice }} USDC</div>
              <div><span class="text-gray-400 block">Stake</span>{{ p.stake }} USDC</div>
              <div><span class="text-gray-400 block">Score</span>{{ p.score.toFixed(2) }}</div>
              <div><span class="text-gray-400 block">Earned</span>{{ p.stats.earned }} USDC</div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-2">
              <div>Missions served: <span class="text-gray-800 font-semibold">{{ p.stats.completed || 0 }}</span></div>
              <div>Failed: <span class="text-gray-800 font-semibold">{{ p.stats.failed || 0 }}</span></div>
              <div>Slash: <span class="text-gray-800 font-semibold">{{ p.stats.slashCount || 0 }}</span></div>
            </div>
            <div class="flex items-center gap-2 mt-3">
              <input
                v-model.number="stakeAmounts[p.id]"
                type="number"
                step="0.01"
                min="0"
                placeholder="+stake USDC"
                class="flex-1 border rounded-md px-2 py-1 text-sm"
              />
              <button @click="addStake(p.id)" class="text-sm px-3 py-1 rounded-md bg-gray-900 text-white hover:bg-gray-800">
                Stake
              </button>
            </div>
            <p v-if="p.lastSlashReason" class="text-xs text-red-500 mt-2">
              Last slash: {{ p.lastSlashReason }}
            </p>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">
          No agents yet. Register one to join the private execution fabric.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue';
import { api } from '../services/api.js';

const providers = ref([]);
const stakeAmounts = reactive({});
const error = ref('');
const success = ref('');

const form = reactive({
  name: '',
  description: '',
  role: 'worker',
  basePrice: 0.0002,
  taskTypesRaw: 'summarize,keywords',
  apiEndpoint: '',
  walletAddress: ''
});

const totals = computed(() => {
  const earned = providers.value.reduce((s, p) => s + Number(p.stats?.earned || 0), 0);
  const stake = providers.value.reduce((s, p) => s + Number(p.stake || 0), 0);
  return {
    agents: providers.value.length,
    earned: earned.toFixed(4),
    stake: stake.toFixed(4)
  };
});

async function refresh() {
  providers.value = await api.listMyProviders().catch(() => []);
}

async function submit() {
  error.value = '';
  success.value = '';
  try {
    await api.registerProvider({
      name: form.name,
      description: form.description,
      role: form.role,
      basePrice: form.basePrice,
      taskTypes: form.taskTypesRaw.split(',').map((s) => s.trim()).filter(Boolean),
      apiEndpoint: form.apiEndpoint || null,
      walletAddress: form.walletAddress || null
    });
    success.value = 'Agent submitted — waiting for network approval.';
    form.name = '';
    form.description = '';
    await refresh();
  } catch (err) {
    error.value = err.message;
  }
}

async function addStake(id) {
  const amount = Number(stakeAmounts[id]);
  if (!(amount > 0)) return;
  await api.stakeProvider(id, amount);
  stakeAmounts[id] = 0;
  await refresh();
}

function roleLabel(role) {
  return role === 'validator' ? 'Quality agent' : 'Execution agent';
}

function statusTone(status) {
  return {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-gray-200 text-gray-600',
    slashed: 'bg-red-100 text-red-700'
  }[status] || 'bg-gray-100 text-gray-600';
}

const OpStat = {
  props: ['value', 'label'],
  setup(p) {
    return () =>
      h('div', { class: 'bg-white/10 backdrop-blur rounded-lg px-4 py-2 min-w-[90px]' }, [
        h('p', { class: 'text-lg font-bold' }, p.value),
        h('p', { class: 'text-[10px] uppercase tracking-wider opacity-80' }, p.label)
      ]);
  }
};

onMounted(refresh);
</script>
