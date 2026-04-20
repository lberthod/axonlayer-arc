<template>
  <div class="container mx-auto px-6 py-8 space-y-6">
    <header class="bg-gradient-to-br from-gray-900 to-red-900 text-white rounded-xl shadow-lg p-6">
      <p class="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-1">Network Admin</p>
      <h1 class="text-2xl font-extrabold">Oversee the execution network</h1>
      <p class="text-sm opacity-80 max-w-2xl mt-1">
        Approve agents, monitor missions, watch settlements, enforce quality via slashing.
      </p>
    </header>

    <div v-if="overview" class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="Users" :value="overview.counts.users" />
      <Stat label="Agents approved" :value="`${overview.counts.approvedProviders} / ${overview.counts.providers}`" />
      <Stat label="Gross volume" :value="`${overview.economics.grossVolume} USDC`" />
      <Stat label="Client spend" :value="`${overview.economics.totalClientSpend} USDC`" />
      <Stat label="Orchestrator rev" :value="`${overview.economics.orchestratorRevenue} USDC`" />
      <Stat label="Avg LTV / user" :value="`${overview.economics.avgLtv} USDC`" />
      <Stat label="Total stake" :value="`${overview.economics.totalStake} USDC`" />
      <Stat label="Total slashed" :value="`${overview.economics.totalSlashed} USDC`" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 class="text-lg font-bold text-gray-900 mb-3">Agent approval queue</h2>
        <div v-if="pending.length" class="space-y-3">
          <div v-for="p in pending" :key="p.id" class="border rounded-lg p-3 text-sm">
            <div class="flex justify-between">
              <div class="font-semibold">{{ p.name }}</div>
              <span class="text-xs text-gray-500">{{ roleLabel(p.role) }}</span>
            </div>
            <div class="text-xs text-gray-500 mb-2">{{ p.description || '—' }}</div>
            <div class="text-xs text-gray-600 mb-2">
              Price: {{ p.basePrice }} USDC · Stake: {{ p.stake }} USDC · Types: {{ p.taskTypes.join(', ') }}
            </div>
            <div class="flex gap-2">
              <button @click="approve(p.id)" class="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold">Approve</button>
              <button @click="reject(p.id)" class="px-3 py-1 rounded-md bg-gray-500 text-white text-xs">Reject</button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">No agents waiting for approval.</p>
      </div>

      <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 class="text-lg font-bold text-gray-900 mb-3">Active agents</h2>
        <div v-if="approved.length" class="space-y-2 max-h-96 overflow-auto">
          <div v-for="p in approved" :key="p.id" class="border rounded-md p-2 text-sm flex items-center justify-between">
            <div>
              <div class="font-semibold">{{ p.name }}</div>
              <div class="text-xs text-gray-500">
                stake {{ p.stake }} · score {{ p.score.toFixed(2) }} · slashes {{ p.stats.slashCount }}
              </div>
            </div>
            <button @click="slash(p.id)" class="text-xs px-2 py-1 rounded-md bg-red-600 text-white font-semibold">Slash</button>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">No active agents.</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h2 class="text-lg font-bold text-gray-900 mb-3">Users</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 uppercase">
            <th class="py-1 pr-3">Email</th>
            <th class="py-1 pr-3">Role</th>
            <th class="py-1 pr-3">Missions</th>
            <th class="py-1 pr-3">Spent</th>
            <th class="py-1">Last login</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.uid" class="border-t border-gray-100">
            <td class="py-1 pr-3">{{ u.email }}</td>
            <td class="py-1 pr-3">
              <select
                :value="u.role"
                @change="(e) => changeRole(u.uid, e.target.value)"
                class="border rounded px-1 py-0.5 text-xs"
              >
                <option value="user">user</option>
                <option value="provider">operator</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td class="py-1 pr-3">{{ u.usage.tasks }}</td>
            <td class="py-1 pr-3">{{ u.usage.totalSpent }} USDC</td>
            <td class="py-1 text-xs text-gray-500">{{ u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { api } from '../services/api.js';

const overview = ref(null);
const users = ref([]);
const providers = ref([]);

const pending = computed(() => providers.value.filter((p) => p.status === 'pending'));
const approved = computed(() => providers.value.filter((p) => p.status === 'approved'));

async function refresh() {
  overview.value = await api.adminOverview();
  users.value = await api.adminUsers();
  providers.value = await api.adminProviders();
}

async function approve(id) { await api.approveProvider(id); await refresh(); }
async function reject(id) { await api.rejectProvider(id); await refresh(); }

async function slash(id) {
  const reason = prompt('Reason for slash?') || 'admin action';
  const amount = prompt('Amount (USDC)? Leave empty for default penalty.');
  await api.slashProvider(id, amount ? Number(amount) : undefined, reason);
  await refresh();
}

async function changeRole(uid, role) {
  await api.adminSetRole(uid, role);
  await refresh();
}

function roleLabel(role) {
  return role === 'validator' ? 'Quality agent' : 'Execution agent';
}

onMounted(refresh);

const Stat = {
  props: ['label', 'value'],
  setup(props) {
    return () =>
      h('div', { class: 'bg-white rounded-lg shadow p-4' }, [
        h('p', { class: 'text-[10px] uppercase tracking-wider text-gray-500 mb-1' }, props.label),
        h('p', { class: 'text-lg font-bold text-gray-800' }, props.value)
      ]);
  }
};
</script>
