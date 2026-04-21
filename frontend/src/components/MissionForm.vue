<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">New mission</h2>
        <p class="text-sm text-gray-500">Define your goal and budget — the hub handles execution automatically.</p>
      </div>
      <span class="text-[11px] uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-1 rounded-md font-semibold">
        Private execution fabric
      </span>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Goal</label>
        <textarea
          v-model="goal"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="e.g. Summarize this long article in two sentences..."
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Mission type</label>
          <select
            v-model="missionType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="summarize">Summarize content</option>
            <option value="keywords">Extract keywords</option>
            <option value="rewrite">Rewrite text</option>
            <option value="translate">Translate (EN→FR)</option>
            <option value="classify">Classify topic</option>
            <option value="sentiment">Sentiment analysis</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Optimize for</label>
          <select
            v-model="optimize"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="balanced">Balanced (quality × cost)</option>
            <option value="quality">Quality first</option>
            <option value="cost">Lowest cost</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Budget (USDC)
          <span class="text-xs text-gray-400 font-normal">— max you're willing to spend on this mission</span>
          <span v-if="props.availableBalance > 0" class="block text-xs text-violet-600 mt-1">
            Available: {{ props.availableBalance.toFixed(6) }} USDC
          </span>
        </label>
        <div class="flex items-center gap-2">
          <input
            v-model.number="budget"
            type="number"
            min="0.0001"
            :max="props.availableBalance || undefined"
            step="0.0001"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            v-for="b in presets.filter(p => p <= (props.availableBalance || Infinity))"
            :key="b"
            @click="budget = b"
            class="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
          >{{ b }}</button>
        </div>
      </div>

      <div class="space-y-2">
        <button
          @click="handleSubmit"
          :disabled="isLoading || !goal.trim() || !(budget > 0) || insufficientBudget"
          class="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 relative overflow-hidden group"
        >
          <span v-if="!isLoading" class="relative z-10">Launch mission</span>
          <span v-else class="relative z-10 flex items-center justify-center gap-2">
            <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Orchestrating mission…
          </span>
          <div v-if="!isLoading" class="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0"></div>
        </button>

        <!-- Budget warning -->
        <div v-if="insufficientBudget" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-800">
            <span class="font-semibold">⚠️ Insufficient budget:</span> Estimated cost {{ estimatedCost.toFixed(5) }} USDC exceeds your budget {{ budget.toFixed(5) }} USDC.
            <router-link to="/user" class="underline font-semibold hover:no-underline">Add funds to your wallet</router-link>.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  availableBalance: {
    type: Number,
    default: 0
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
