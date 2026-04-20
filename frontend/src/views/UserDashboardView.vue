<template>
  <div class="container mx-auto px-6 py-8 space-y-6">
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-1">My account</h1>
      <p class="text-gray-500 text-sm mb-4">Your missions, spend and API credentials.</p>

      <div v-if="me" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Role" :value="roleLabel(me.role)" />
        <Stat label="Missions executed" :value="me.usage.tasks" />
        <Stat label="Total spent" :value="`${me.usage.totalSpent} USDC`" />
        <Stat label="Today" :value="`${me.usage.today.tasks} missions · ${me.usage.today.spent} USDC`" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-3">API access</h2>
        <p class="text-sm text-gray-500 mb-3">
          Use this API key from server-to-server calls (<code>x-api-key</code> header).
        </p>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-gray-50 rounded px-2 py-1 text-xs break-all">{{ me?.apiKey || '...' }}</code>
          <button @click="rotate" class="text-sm px-3 py-1 rounded bg-gray-800 text-white">Rotate</button>
        </div>

        <h3 class="text-sm font-semibold text-gray-700 mt-5 mb-2">Payout wallet (EVM)</h3>
        <div class="flex items-center gap-2">
          <input
            v-model="walletAddress"
            placeholder="0x..."
            class="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <button @click="saveWallet" class="text-sm px-3 py-1 rounded bg-blue-600 text-white">Save</button>
        </div>

        <div class="mt-6">
          <button
            v-if="me?.role === 'user'"
            @click="upgradeToProvider"
            class="text-sm px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700"
          >Become an agent operator</button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-3">My missions</h2>
        <div v-if="missions.length" class="space-y-2 max-h-96 overflow-auto">
          <div
            v-for="t in missions"
            :key="t.id"
            class="border border-gray-100 rounded p-3 text-sm"
          >
            <div class="flex items-center justify-between">
              <span class="font-mono text-xs text-gray-500">{{ t.id.slice(0, 18) }}...</span>
              <span
                class="text-xs px-2 py-0.5 rounded"
                :class="t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >{{ t.status }}</span>
            </div>
            <div class="text-gray-700 mt-1">{{ t.taskType }} · {{ t.pricing?.clientPayment || '-' }} USDC</div>
            <div class="text-gray-400 text-xs mt-0.5">{{ new Date(t.createdAt).toLocaleString() }}</div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">No missions yet. Head to Mission Control.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/api.js';
import { h } from 'vue';

const me = ref(null);
const missions = ref([]);
const walletAddress = ref('');

async function refresh() {
  me.value = await api.getMe();
  walletAddress.value = me.value.walletAddress || '';
  missions.value = (await api.getMyTasks().catch(() => [])) || [];
}

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

function roleLabel(role) {
  if (role === 'provider') return 'operator';
  return role;
}

onMounted(refresh);

const Stat = {
  props: ['label', 'value'],
  setup(props) {
    return () =>
      h('div', { class: 'bg-gray-50 rounded p-3' }, [
        h('p', { class: 'text-xs text-gray-500 uppercase mb-1' }, props.label),
        h('p', { class: 'text-lg font-bold text-gray-800' }, props.value)
      ]);
  }
};
</script>
