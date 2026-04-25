<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-slate-100">New mission</h2>
        <p class="text-sm text-slate-500">Define your goal and budget — Axonlayer handles execution automatically.</p>
      </div>
      <span
        class="text-[11px] uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2 py-1 rounded-md font-semibold">
        Private execution fabric
      </span>
    </div>

    <div class="space-y-4">
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-slate-300">Goal</label>
          <span :class="[
            'text-xs font-semibold',
            goal.trim().length >= 50 ? 'text-emerald-400' : 'text-amber-400'
          ]">
            {{ goal.trim().length }}/50 characters
          </span>
        </div>
        <textarea v-model="goal" rows="4"
          class="w-full px-3 py-2 bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
          :class="goal.trim().length >= 50 ? 'border-slate-600' : 'border-amber-600'"
          placeholder="Enter at least 50 characters... e.g. Summarize this long article in two sentences and explain the key insights"></textarea>
        <p v-if="goal.trim().length < 50" class="text-xs text-amber-400 mt-2">
          ⚠️ Too short: {{ 50 - goal.trim().length }} characters needed
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Mission type</label>
          <select v-model="missionType"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="summarize">Summarize content</option>
            <option value="keywords">Extract keywords</option>
            <option value="rewrite">Rewrite text</option>
            <option value="translate">Translate (EN→FR)</option>
            <option value="classify">Classify topic</option>
            <option value="sentiment">Sentiment analysis</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Optimize for</label>
          <select v-model="optimize"
            class="w-full px-3 py-2 bg-slate-900 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="balanced">Balanced (quality × cost)</option>
            <option value="quality">Quality first</option>
            <option value="cost">Lowest cost</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">
          Budget (USDC)
          <span class="text-xs text-slate-500 font-normal">— max you're willing to spend on this mission</span>
          <span v-if="props.availableBalance > 0" class="block text-xs text-indigo-400 mt-1">
            Available: {{ props.availableBalance.toFixed(6) }} USDC
          </span>
        </label>
        <div class="flex items-center gap-2">
          <input v-model.number="budget" type="number" min="0.0001" :max="props.availableBalance || undefined"
            step="0.0001"
            class="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button v-for="b in presets.filter(p => p <= (props.availableBalance || Infinity))" :key="b"
            @click="budget = b" class="text-xs px-2 py-1 rounded-md bg-slate-700 text-slate-400 hover:bg-slate-600">{{ b
            }}</button>
        </div>
      </div>

      <div class="space-y-2">
        <button @click="openConfirmModal"
          :disabled="isLoading || !goal.trim() || goal.trim().length < 50 || !(budget > 0) || insufficientBudget"
          class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 relative overflow-hidden group"
          :title="goal.trim().length < 50 ? `Add ${50 - goal.trim().length} more characters` : ''">
          <span v-if="!isLoading" class="relative z-10">Launch mission</span>
          <span v-else class="relative z-10 flex items-center justify-center gap-2">
            <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Orchestrating mission…
          </span>
          <div v-if="!isLoading"
            class="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0">
          </div>
        </button>

        <!-- Budget warning -->
        <div v-if="insufficientBudget" class="p-3 bg-red-950/20 border border-red-900/50 rounded-lg">
          <p class="text-sm text-red-400">
            <span class="font-semibold">⚠️ Insufficient budget:</span> Estimated cost {{ estimatedCost.toFixed(5) }}
            USDC exceeds your budget {{ budget.toFixed(5) }} USDC.
            <router-link to="/user" class="underline font-semibold hover:no-underline">Add funds to your
              wallet</router-link>.
          </p>
        </div>
      </div>

      <!-- Authorization Confirmation Modal -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showConfirmModal"
            class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div
              class="bg-slate-800 rounded-xl p-6 max-w-md border-2 border-red-900/50 shadow-2xl animate-in fade-in-50 zoom-in-95">
              <!-- Header -->
              <div class="flex items-start gap-3 mb-4">
                <span class="text-2xl">⚠️</span>
                <div>
                  <h2 class="text-xl font-bold text-red-400">Authorization Required</h2>
                  <p class="text-xs text-slate-400 mt-1">Confirm before making irreversible payment</p>
                </div>
              </div>

              <!-- Payment Details -->
              <div class="bg-red-950/30 rounded-lg p-4 mb-4 border border-red-900/40">
                <p class="text-xs text-red-300 uppercase tracking-wider font-semibold mb-3">Payment Details</p>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Amount:</span>
                    <span class="font-mono font-semibold text-red-300">{{ budget.toFixed(6) }} USDC</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Network:</span>
                    <span class="font-mono font-semibold text-cyan-400">Arc Testnet</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Settlement:</span>
                    <span class="font-mono font-semibold text-emerald-400">&lt; 2 seconds</span>
                  </div>
                  <div class="flex justify-between pt-2 border-t border-red-900/30">
                    <span class="text-slate-400">Status:</span>
                    <span class="font-mono font-bold text-red-400">🔴 FINAL & IRREVERSIBLE</span>
                  </div>
                </div>
              </div>

              <!-- Wallet Details -->
              <div class="bg-indigo-950/30 rounded-lg p-4 mb-4 border border-indigo-900/40">
                <p class="text-xs text-indigo-300 uppercase tracking-wider font-semibold mb-3">Wallet Details</p>
                <div class="space-y-2 text-xs">
                  <div>
                    <p class="text-slate-400 mb-1">From (Your Treasury Wallet):</p>
                    <p class="font-mono text-indigo-400 break-all bg-slate-900/50 p-2 rounded">{{ treasuryWalletAddress }}</p>
                  </div>
                  <div>
                    <p class="text-slate-400 mb-1">To (Orchestrator Wallet):</p>
                    <p class="font-mono text-amber-400 break-all bg-slate-900/50 p-2 rounded">{{ orchestratorWalletAddress }}</p>
                  </div>
                </div>
              </div>

              <!-- Warning Message -->
              <div class="bg-yellow-950/30 rounded-lg p-3 mb-4 border border-yellow-900/40">
                <p class="text-xs text-yellow-300">
                  <span class="font-bold block mb-1">⚡ Important:</span>
                  This payment will be broadcast to the Arc blockchain. Once confirmed, it <strong>cannot be reversed or
                    cancelled</strong>. Understand that this is a real on-chain transaction with real financial
                  consequences.
                </p>
              </div>

              <!-- Consent Checkbox -->
              <label class="flex items-start gap-3 mb-6 cursor-pointer group">
                <input v-model="consentAgreed" type="checkbox"
                  class="w-5 h-5 rounded bg-slate-700 border-2 border-slate-600 cursor-pointer mt-0.5 accent-emerald-500 group-hover:border-emerald-500/50 transition" />
                <span class="text-sm text-slate-300 group-hover:text-slate-100 transition">
                  I understand this payment is <strong>final and cannot be reversed</strong>. I authorize this {{
                    budget.toFixed(6) }} USDC transaction on Arc blockchain.
                </span>
              </label>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button @click="closeConfirmModal"
                  class="flex-1 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold transition-colors">
                  Cancel
                </button>
                <button @click="confirmAndSubmit" :disabled="!consentAgreed || isLoading"
                  class="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors">
                  <span v-if="!isLoading">Authorize Payment</span>
                  <span v-else class="flex items-center justify-center gap-2">
                    <span
                      class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing…
                  </span>
                </button>
              </div>

              <!-- Disclosure -->
              <p class="text-xs text-slate-500 mt-4 text-center">
                Axonlayer will never ask for your private key. Do not share it with anyone.
              </p>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  availableBalance: {
    type: Number,
    default: 0
  },
  treasuryWalletAddress: {
    type: String,
    default: 'Not available'
  },
  orchestratorWalletAddress: {
    type: String,
    default: 'Not available'
  }
});

const emit = defineEmits(['submit', 'budget-change']);

const goal = ref('');
const missionType = ref('summarize');
const optimize = ref('balanced');
const budget = ref(0.01);
const isLoading = ref(false);
const estimatedCost = ref(0.0005); // Base estimated cost

watch(budget, (v) => emit('budget-change', Number(v) || 0), { immediate: true });

const presets = [0.005, 0.01, 0.05];
const showConfirmModal = ref(false);
const consentAgreed = ref(false);

const strategyFor = {
  balanced: 'score_price',
  quality: 'score',
  cost: 'price'
};

// Estimated cost calculation (based on task type)
const calculateEstimatedCost = () => {
  let cost = 0.0005; // Base cost
  if (goal.value.length > 1000) cost += 0.0001; // Additional for large input
  if (missionType.value === 'translate' || missionType.value === 'rewrite') cost += 0.0002;
  return cost;
};

watch([goal, missionType], () => {
  estimatedCost.value = calculateEstimatedCost();
});

const insufficientBudget = computed(() => {
  return budget.value > 0 && estimatedCost.value > budget.value;
});

function openConfirmModal() {
  consentAgreed.value = false; // Reset checkbox each time
  showConfirmModal.value = true;
}

function closeConfirmModal() {
  showConfirmModal.value = false;
  consentAgreed.value = false;
}

function confirmAndSubmit() {
  if (!consentAgreed.value) return;
  handleSubmit();
  closeConfirmModal();
}

function handleSubmit() {
  if (!goal.value.trim() || !(budget.value > 0) || insufficientBudget.value) return;
  isLoading.value = true;
  emit('submit', {
    input: goal.value,
    taskType: missionType.value,
    selectionStrategy: strategyFor[optimize.value],
    budget: budget.value
  });
}

function setLoading(v) { isLoading.value = v; }
function clearForm() { goal.value = ''; }

defineExpose({ setLoading, clearForm });
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Tailwind transition classes */
.animate-in {
  animation: animateIn 0.2s ease-out;
}

@keyframes animateIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.fade-in-50 {
  animation: fadeIn50 0.2s ease-out;
}

@keyframes fadeIn50 {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.zoom-in-95 {
  animation: zoomIn95 0.2s ease-out;
}

@keyframes zoomIn95 {
  from {
    transform: scale(0.95);
  }

  to {
    transform: scale(1);
  }
}
</style>
