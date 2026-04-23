<template>
  <div class="p-6 bg-gradient-to-br from-gray-50 via-white to-violet-50 min-h-full">
    <div class="max-w-7xl mx-auto">

      <!-- Wallet Setup Required -->
      <WalletSetup
        v-if="!hasWallet || !hasBalance"
        @setup-complete="refreshWallet"
        class="mb-6"
      />

      <!-- Mission Control (Only after wallet setup) -->
      <template v-if="hasWallet && hasBalance">
        <HeroBanner />

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <!-- LEFT: Authoring + Budget + Timeline + Result -->
        <div class="lg:col-span-3 space-y-6">
          <MissionForm
            ref="missionFormRef"
            :available-balance="availableBalance"
            @submit="handleMissionSubmit"
            @budget-change="(v) => liveBudget = v"
          />

          <div class="flex items-center justify-between mb-2">
            <div>
              <h3 class="text-sm font-semibold text-gray-700">Mission Wallet (Arc USDC)</h3>
              <p class="text-xs text-gray-500">Your account on Arc blockchain - executes & pays agents</p>
            </div>
            <button
              @click="refreshWallet(false)"
              :disabled="isRefreshingWallet"
              class="px-2 py-1 text-xs bg-violet-100 text-violet-700 hover:bg-violet-200 rounded transition disabled:opacity-50"
            >
              {{ isRefreshingWallet ? '⟳ Syncing...' : '⟳ Refresh' }}
            </button>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4 mb-3">
            <p class="text-xs text-gray-500 uppercase tracking-wider mb-2">Wallet Address</p>
            <p class="text-xs font-mono text-gray-700 break-all">{{ missionWalletAddress }}</p>
          </div>

          <MissionWallet
            :balance="missionWalletBalance"
            :reserved="reservedBalance"
            :remaining="availableBalance"
          />

          <p v-if="lastWalletRefresh" class="text-xs text-gray-400 mt-2">
            Last synced: {{ lastWalletRefresh }}
          </p>

          <MissionBudgetBar
            :budget="displayBudget"
            :spent="currentSpent"
          />

          <MissionBudget
            :budget="displayBudget"
            :spent="currentSpent"
            :step-count="paidStepCount"
            :settlement-type="currentResult?.settlementType"
          />

          <MissionTimeline
            :steps="executionSteps"
            :result="currentResult"
            :transactions="currentResult?.transactions || []"
          />

          <MissionResult
            :result="currentResult"
            :spent="currentSpent"
            :developer-count="developerCount"
          />

          <ArcProof :transactions="currentResult?.transactions || []" />
        </div>

        <!-- RIGHT: Network proof / scale / fabric -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Network activity hero -->
          <div class="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-lg p-6">
            <p class="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-2">Network activity</p>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-3xl font-extrabold">{{ networkStats.missions }}</p>
                <p class="text-xs opacity-80">Missions executed</p>
              </div>
              <div>
                <p class="text-3xl font-extrabold">{{ networkStats.txCount }}</p>
                <p class="text-xs opacity-80">USDC transactions</p>
              </div>
              <div>
                <p class="text-xl font-bold">{{ networkStats.volume }}</p>
                <p class="text-xs opacity-80">USDC moved</p>
              </div>
              <div>
                <p class="text-xl font-bold">{{ networkStats.avgCost }}</p>
                <p class="text-xs opacity-80">Avg cost / action</p>
              </div>
              <div class="col-span-2 bg-white/10 rounded-lg px-3 py-2 mt-1">
                <p class="text-[10px] opacity-80 uppercase tracking-wider">Orchestrator margin</p>
                <p class="text-lg font-extrabold">{{ networkStats.margin }} USDC</p>
              </div>
            </div>
          </div>

          <!-- Batch simulator -->
          <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="text-lg font-bold text-gray-900">Scale proof</h2>
                <p class="text-xs text-gray-500">Batch 50+ missions to show microeconomic viability.</p>
              </div>
              <span class="text-[10px] uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-1 rounded-full font-semibold">
                Scalability
              </span>
            </div>
            <div class="flex items-center gap-2 mb-3">
              <button
                v-for="n in [25, 50, 100]"
                :key="n"
                @click="runBatch(n)"
                :disabled="batchRunning"
                class="flex-1 px-3 py-2 rounded-md text-sm font-semibold transition"
                :class="[batchSize === n && batchRunning ? 'bg-gray-900 text-white opacity-60' : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50']"
              >
                {{ batchRunning && batchSize === n ? 'Running…' : `Batch ${n}` }}
              </button>
            </div>
            <div
              v-if="batchResult"
              class="grid grid-cols-2 gap-2 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-lg p-3"
            >
              <BatchStat label="Missions executed" :value="batchResult.executed" />
              <BatchStat label="Total transactions" :value="batchResult.transactionsCreated" />
              <BatchStat label="Volume" :value="`${batchResult.summary?.grossVolume || 0} USDC`" />
              <BatchStat label="Avg cost / action" :value="`${avgBatchCost} USDC`" />
              <BatchStat
                label="Orchestrator margin"
                :value="`${batchResult.summary?.orchestratorMargin || 0} USDC`"
                tone="emerald"
              />
            </div>
          </div>

          <MetricsPanel ref="metricsPanelRef" />
          <CostComparison />
          <MetricsCharts ref="chartsRef" />
          <TransactionsTable :transactions="transactions" />

          <!-- Private fabric drawer -->
          <details class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <summary class="cursor-pointer text-sm font-semibold text-gray-700">
              Inspect private execution fabric
            </summary>
            <div class="mt-4">
              <AgentsPanel ref="agentsPanelRef" />
              <div class="mt-4 border-t border-gray-100 pt-4">
                <WalletBalances :balances="balances" />
              </div>
            </div>
          </details>
        </div>
      </div>
      </template>

      <!-- Empty State when wallet not ready -->
      <div v-if="!hasWallet || !hasBalance" class="text-center py-20">
        <div class="text-6xl mb-4">⏳</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Setting up your wallet...</h2>
        <p class="text-gray-600">Complete the setup above to launch missions</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue';
import HeroBanner from '../components/HeroBanner.vue';
import CostComparison from '../components/CostComparison.vue';
import MissionBudgetBar from '../components/MissionBudgetBar.vue';
import MissionForm from '../components/MissionForm.vue';
import MissionWallet from '../components/MissionWallet.vue';
import MissionResult from '../components/MissionResult.vue';
import MissionBudget from '../components/MissionBudget.vue';
import MissionTimeline from '../components/MissionTimeline.vue';
import ArcProof from '../components/ArcProof.vue';
import WalletBalances from '../components/WalletBalances.vue';
import TransactionsTable from '../components/TransactionsTable.vue';
import MetricsPanel from '../components/MetricsPanel.vue';
import MetricsCharts from '../components/MetricsCharts.vue';
import AgentsPanel from '../components/AgentsPanel.vue';
import WalletSetup from '../components/WalletSetup.vue';
import { api } from '../services/api.js';
import { toastError, toastSuccess, toastInfo } from '../stores/toastStore.js';
import { walletStore } from '../stores/walletStore.js';

const missionFormRef = ref(null);
const metricsPanelRef = ref(null);
const agentsPanelRef = ref(null);
const chartsRef = ref(null);

const user = ref(null);  // Current user (from auth store)
const balances = ref({});
const transactions = ref([]);
const currentResult = ref(null);
const executionSteps = ref([]);
const liveBudget = ref(0.01);
const currentBudget = ref(0);
const metrics = ref(null);
const providers = ref([]);
const batchResult = ref(null);
const batchRunning = ref(false);
const batchSize = ref(0);

const displayBudget = computed(() => currentBudget.value || liveBudget.value || 0);

const currentSpent = computed(() => {
  if (!currentResult.value) return 0;
  const txs = currentResult.value.transactions || [];
  const outgoing = txs
    .filter((t) => t.from === 'client_wallet')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  if (outgoing > 0) return outgoing;
  const meta = currentResult.value.pricing || {};
  return Number(meta.clientPayment || 0);
});

const paidStepCount = computed(() => {
  const txs = currentResult.value?.transactions || [];
  return txs.filter((t) => Number(t.amount || 0) > 0).length;
});

// Map agent wallet → provider ownerUid to compute "N devs involved"
const ownerByWallet = computed(() => {
  const map = {};
  for (const p of providers.value) {
    if (p.walletAddress) map[p.walletAddress] = p.ownerUid || p.id;
    if (p.id) map[p.id] = p.ownerUid || p.id;
  }
  return map;
});

const developerCount = computed(() => {
  const txs = currentResult.value?.transactions || [];
  const wallets = new Set(
    txs.map((t) => t.to).filter((w) => w && w !== 'client_wallet' && w !== 'orchestrator_wallet')
  );
  if (!wallets.size) return 0;
  const owners = new Set();
  for (const w of wallets) {
    owners.add(ownerByWallet.value[w] || w); // fallback: wallet itself = distinct
  }
  return owners.size;
});

// Mission Wallet computed properties
// Single wallet: Arc blockchain wallet = Mission Wallet
const missionWalletBalance = computed(() => {
  // Get the ONE mission wallet balance from Arc blockchain
  return user.value?.balance || 0;
});

const missionWalletAddress = computed(() => {
  // The Arc blockchain wallet address
  return user.value?.wallet?.address || 'Not created';
});

const reservedBalance = computed(() => {
  // Current mission budget
  return currentResult.value?.budget || 0;
});

const availableBalance = computed(() => {
  return Math.max(0, missionWalletBalance.value - reservedBalance.value);
});

// Wallet setup checks
const hasWallet = computed(() => {
  return user.value?.wallet?.address || user.value?.missionWallet?.address;
});

const hasBalance = computed(() => {
  const balance = user.value?.balance || missionWalletBalance.value;
  return balance > 0;
});

const isRefreshingWallet = ref(false);
const lastWalletRefresh = ref(null);

async function refreshWallet(silent = false) {
  try {
    isRefreshingWallet.value = true;
    user.value = await api.getMe();
    lastWalletRefresh.value = new Date().toLocaleTimeString();
    if (user.value?.wallet && !silent) {
      toastSuccess('Wallet setup complete!');
    }
  } catch (err) {
    if (!silent) {
      toastError(err, 'Failed to refresh wallet');
    }
  } finally {
    isRefreshingWallet.value = false;
  }
}

const networkStats = computed(() => {
  const m = metrics.value?.totals || {};
  const completions = m.completedTasks ?? m.completions ?? 0;
  const tasks = m.totalTasks ?? m.tasks ?? 0;
  const vol = Number(m.grossVolume || 0);
  const txCount = m.transactions || 0;
  return {
    missions: completions || tasks || 0,
    volume: vol.toFixed(3),
    txCount,
    avgCost: tasks ? `${(vol / Math.max(1, tasks)).toFixed(5)}` : '0.00000',
    margin: Number(metrics.value?.revenueByWallet?.orchestrator_wallet || 0).toFixed(4)
  };
});

const avgBatchCost = computed(() => {
  if (!batchResult.value) return '0';
  const vol = Number(batchResult.value.summary?.grossVolume || 0);
  const n = Number(batchResult.value.executed || 0);
  if (!n) return '0';
  return (vol / n).toFixed(5);
});

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `mission-${crypto.randomUUID()}`;
  }
  return `mission-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function loadData() {
  const [bal, tx, m, p] = await Promise.all([
    api.getBalances(),
    api.getTransactions({ latest: 20 }),
    api.getMetrics().catch(() => null),
    api.listProviders('approved').catch(() => [])
  ]);
  balances.value = bal;
  transactions.value = tx;
  metrics.value = m;
  providers.value = p || [];
}

function refreshPanels() {
  metricsPanelRef.value?.refresh();
  agentsPanelRef.value?.refresh();
  chartsRef.value?.refresh();
}

async function handleMissionSubmit({ input, taskType, selectionStrategy, budget }) {
  const submittedBudget = Number(budget) || 0;
  currentBudget.value = submittedBudget;

  try {
    // Check budget doesn't exceed available balance
    if (submittedBudget > missionWalletBalance.value) {
      toastError(
        new Error(`Budget ${submittedBudget.toFixed(5)} USDC exceeds available balance ${missionWalletBalance.value.toFixed(5)} USDC`),
        'Insufficient wallet balance'
      );
      missionFormRef.value?.setLoading(false);
      return;
    }

    try {
      const quote = await api.quoteTask(input, taskType, selectionStrategy);
      const est = Number(quote?.pricing?.clientPayment || quote?.clientPayment || 0);
      if (est > 0 && est > submittedBudget) {
        toastError(
          new Error(`Estimated cost ${est.toFixed(5)} USDC exceeds your budget ${submittedBudget.toFixed(5)} USDC`),
          'Budget too low'
        );
        missionFormRef.value?.setLoading(false);
        return;
      }
      if (est > 0) toastInfo(`Estimated cost: ${est.toFixed(5)} USDC`);
    } catch (_) {
      // Quote is optional
    }

    const result = await api.createTask(input, taskType, {
      selectionStrategy,
      idempotencyKey: makeIdempotencyKey()
    });
    currentResult.value = result;
    executionSteps.value = result.executionSteps || [];
    missionFormRef.value?.clearForm();

    if (result.status === 'completed') {
      toastSuccess(`Mission ${result.taskId.slice(-6)} completed`);
    } else {
      toastError(new Error(`Mission ${result.status}`), 'Mission did not complete');
    }
    await loadData();
    refreshPanels();
  } catch (err) {
    toastError(err, 'Failed to launch mission');
  } finally {
    missionFormRef.value?.setLoading(false);
  }
}

async function runBatch(n) {
  batchRunning.value = true;
  batchSize.value = n;
  try {
    const result = await api.runSimulation(n);
    batchResult.value = result;
    toastSuccess(`Batch of ${result.executed} missions · ${result.summary?.grossVolume} USDC moved`);
    await loadData();
    refreshPanels();
  } catch (err) {
    toastError(err, 'Batch failed');
  } finally {
    batchRunning.value = false;
  }
}

let walletRefreshInterval = null;
let unsubscribeWallet = null;

onMounted(async () => {
  try {
    await refreshWallet();
    await loadData();

    // Subscribe to wallet store changes
    // When wallet is regenerated anywhere, auto-sync here
    unsubscribeWallet = walletStore.subscribe(() => {
      user.value = {
        ...user.value,
        wallet: walletStore.getWallet(),
        balance: walletStore.getBalance()
      };
    });

    // Refresh wallet balance from blockchain every 30 seconds
    walletRefreshInterval = setInterval(() => {
      refreshWallet(true); // silent refresh
    }, 30000);
  } catch (err) {
    toastError(err, 'Failed to load Mission Control');
  }
});

onUnmounted(() => {
  if (walletRefreshInterval) {
    clearInterval(walletRefreshInterval);
  }
  if (unsubscribeWallet) {
    unsubscribeWallet();
  }
});

const BatchStat = {
  props: ['label', 'value', 'tone'],
  setup(p) {
    const cls = p.tone === 'emerald' ? 'text-emerald-700' : 'text-gray-900';
    return () =>
      h('div', {}, [
        h('p', { class: 'text-[10px] uppercase tracking-wider text-gray-500' }, p.label),
        h('p', { class: `text-base font-bold ${cls}` }, p.value)
      ]);
  }
};
</script>
