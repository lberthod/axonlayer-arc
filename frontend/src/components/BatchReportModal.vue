<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div class="bg-slate-900 rounded-2xl border-2 border-violet-500 w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl">
      <!-- Header -->
      <div class="sticky top-0 bg-gradient-to-r from-violet-900 to-fuchsia-900 border-b border-violet-500 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-slate-100 mb-1">📊 Batch Report</h2>
            <p class="text-sm text-slate-300">{{ results.executed }} missions executed · {{ results.transactionsCreated }} total transactions</p>
          </div>
          <button
            @click="$emit('close')"
            class="text-slate-300 hover:text-slate-100 text-2xl transition"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Summary Stats -->
        <div class="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 border border-indigo-500">
          <h3 class="text-lg font-bold text-slate-100 mb-4">Summary</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-slate-400 mb-1">Executed</p>
              <p class="text-2xl font-bold text-emerald-400">{{ results.executed }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 mb-1">Failed</p>
              <p class="text-2xl font-bold text-red-400">{{ results.failed }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 mb-1">Total Volume</p>
              <p class="text-2xl font-bold text-yellow-400">${{ results.summary.grossVolume.toFixed(4) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 mb-1">Transactions</p>
              <p class="text-2xl font-bold text-blue-400">{{ results.transactionsCreated }}</p>
            </div>
          </div>
        </div>

        <!-- Payment Breakdown -->
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-bold text-slate-100 mb-4">Payment Breakdown</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-slate-900 rounded-lg p-4 border border-slate-600">
              <p class="text-xs text-slate-500 mb-2">Gross Volume (Client)</p>
              <p class="text-xl font-bold text-slate-100">${{ results.summary.grossVolume.toFixed(4) }}</p>
            </div>
            <div class="bg-slate-900 rounded-lg p-4 border border-slate-600">
              <p class="text-xs text-slate-500 mb-2">Worker Revenue</p>
              <p class="text-xl font-bold text-emerald-400">${{ results.summary.workerRevenue.toFixed(4) }}</p>
            </div>
            <div class="bg-slate-900 rounded-lg p-4 border border-slate-600">
              <p class="text-xs text-slate-500 mb-2">Validator Revenue</p>
              <p class="text-xl font-bold text-blue-400">${{ results.summary.validatorRevenue.toFixed(4) }}</p>
            </div>
            <div class="bg-slate-900 rounded-lg p-4 border border-slate-600">
              <p class="text-xs text-slate-500 mb-2">Orchestrator Margin</p>
              <p class="text-xl font-bold text-purple-400">${{ results.summary.orchestratorMargin.toFixed(4) }}</p>
            </div>
          </div>
        </div>

        <!-- Per-Mission Table -->
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-bold text-slate-100 mb-4">Per-Mission Details</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700">
                  <th class="text-left px-3 py-2 font-semibold text-slate-300">#</th>
                  <th class="text-left px-3 py-2 font-semibold text-slate-300">Type</th>
                  <th class="text-left px-3 py-2 font-semibold text-slate-300">Status</th>
                  <th class="text-left px-3 py-2 font-semibold text-slate-300">Agents</th>
                  <th class="text-right px-3 py-2 font-semibold text-slate-300">Time</th>
                  <th class="text-right px-3 py-2 font-semibold text-slate-300">Client</th>
                  <th class="text-right px-3 py-2 font-semibold text-slate-300">Worker</th>
                  <th class="text-right px-3 py-2 font-semibold text-slate-300">Validator</th>
                  <th class="text-right px-3 py-2 font-semibold text-slate-300">Txs</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="mission in results.missions"
                  :key="mission.id"
                  class="border-b border-slate-700 hover:bg-slate-700/30 transition"
                >
                  <td class="px-3 py-2 text-slate-300">{{ mission.index }}</td>
                  <td class="px-3 py-2">
                    <span class="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded">
                      {{ mission.taskType }}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <span
                      :class="{
                        'text-emerald-400': mission.status === 'completed',
                        'text-red-400': mission.status === 'failed'
                      }"
                    >
                      {{ mission.status === 'completed' ? '✅' : '❌' }} {{ mission.status }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs text-slate-400">
                    {{ mission.agents?.worker ? mission.agents.worker.split('_')[1] : 'none' }} /
                    {{ mission.agents?.validator ? mission.agents.validator.split('_')[1] : 'none' }}
                  </td>
                  <td class="px-3 py-2 text-right text-slate-400">{{ mission.executionTime }}ms</td>
                  <td class="px-3 py-2 text-right font-semibold text-slate-100">
                    ${{ mission.pricing?.clientPayment.toFixed(4) || '0.0000' }}
                  </td>
                  <td class="px-3 py-2 text-right text-emerald-400">
                    ${{ mission.pricing?.workerPayment.toFixed(4) || '0.0000' }}
                  </td>
                  <td class="px-3 py-2 text-right text-blue-400">
                    ${{ mission.pricing?.validatorPayment.toFixed(4) || '0.0000' }}
                  </td>
                  <td class="px-3 py-2 text-right text-slate-400">
                    {{ mission.transactions?.length || 0 }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- All Transactions -->
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-bold text-slate-100 mb-4">All Transactions ({{ allTransactions.length }})</h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="(tx, idx) in allTransactions.slice(0, 50)"
              :key="`${tx.taskId}-${idx}`"
              class="bg-slate-900 rounded-lg p-3 border border-slate-700 text-sm flex items-center justify-between"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    :class="{
                      'text-purple-400': tx.type === 'payment',
                      'text-emerald-400': tx.type === 'fund',
                      'text-orange-400': tx.type === 'refund',
                      'text-blue-400': tx.type === 'agent_payment'
                    }"
                  >
                    {{ tx.type === 'payment' ? '💳' : tx.type === 'fund' ? '📥' : tx.type === 'refund' ? '↩️' : '👤' }}
                  </span>
                  <span class="font-mono text-xs text-slate-400">{{ tx.from }} → {{ tx.to }}</span>
                </div>
                <p class="text-xs text-slate-500">{{ tx.reason }}</p>
              </div>
              <div class="text-right ml-4 flex-shrink-0">
                <p class="font-semibold text-slate-100">${{ tx.amount.toFixed(6) }}</p>
                <p class="text-xs text-slate-500">{{ tx.settlementType }}</p>
              </div>
            </div>

            <div v-if="allTransactions.length > 50" class="text-center py-4">
              <p class="text-sm text-slate-400">
                ... and {{ allTransactions.length - 50 }} more transactions
              </p>
            </div>
          </div>
        </div>

        <!-- Export Options -->
        <div class="flex gap-3">
          <button
            @click="exportJSON"
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            ⬇️ Export JSON
          </button>
          <button
            @click="exportCSV"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            📊 Export CSV
          </button>
          <button
            @click="$emit('close')"
            class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  results: {
    type: Object,
    default: () => ({
      executed: 0,
      failed: 0,
      transactionsCreated: 0,
      summary: { grossVolume: 0, workerRevenue: 0, validatorRevenue: 0, orchestratorMargin: 0 },
      missions: [],
      perTaskType: {}
    })
  }
});

const emit = defineEmits(['close']);

const allTransactions = computed(() => {
  const txs = [];
  if (Array.isArray(props.results.missions)) {
    props.results.missions.forEach(mission => {
      if (Array.isArray(mission.transactions)) {
        mission.transactions.forEach(tx => {
          txs.push({ ...tx, missionId: mission.id, missionIndex: mission.index });
        });
      }
    });
  }
  return txs;
});

function exportJSON() {
  const data = JSON.stringify(props.results, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadFile(blob, `batch-report-${Date.now()}.json`);
}

function exportCSV() {
  let csv = 'Mission #,Type,Status,Worker,Validator,Execution Time (ms),Client Pay,Worker Pay,Validator Pay,Transactions Count\n';

  if (Array.isArray(props.results.missions)) {
    props.results.missions.forEach(m => {
      const worker = m.agents?.worker || 'unknown';
      const validator = m.agents?.validator || 'unknown';
      csv += `"${m.index}","${m.taskType}","${m.status}","${worker}","${validator}","${m.executionTime}","${m.pricing?.clientPayment || 0}","${m.pricing?.workerPayment || 0}","${m.pricing?.validatorPayment || 0}","${m.transactions?.length || 0}"\n`;
    });
  }

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadFile(blob, `batch-report-${Date.now()}.csv`);
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
