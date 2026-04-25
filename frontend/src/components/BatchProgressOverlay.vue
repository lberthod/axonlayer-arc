<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-slate-900 rounded-2xl border-2 border-violet-500 p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-100 mb-2">
          🚀 Running Batch of {{ totalCount }} Missions
        </h2>
        <p class="text-sm text-slate-400">Executing tasks in parallel with agents...</p>
      </div>

      <!-- Progress Bar -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-slate-300">
            {{ completedCount }} / {{ totalCount }} completed
          </span>
          <span class="text-xs text-slate-500">{{ progressPercent }}%</span>
        </div>
        <div class="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p class="text-xs text-slate-500 mb-1">Completed</p>
          <p class="text-lg font-bold text-emerald-400">{{ completedCount }}</p>
        </div>
        <div class="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p class="text-xs text-slate-500 mb-1">Failed</p>
          <p class="text-lg font-bold text-red-400">{{ failedCount }}</p>
        </div>
        <div class="bg-slate-800 rounded-lg p-3 border border-slate-700">
          <p class="text-xs text-slate-500 mb-1">Elapsed</p>
          <p class="text-lg font-bold text-blue-400">{{ elapsedTime }}s</p>
        </div>
      </div>

      <!-- Mission List -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <p class="text-xs font-semibold text-slate-400 uppercase mb-3">Mission Details</p>

        <div
          v-for="mission in missions"
          :key="mission.index"
          class="bg-slate-800 rounded-lg p-3 border border-slate-700 text-sm"
        >
          <div class="flex items-start gap-3">
            <div class="text-lg flex-shrink-0">
              {{ mission.status === 'completed' ? '✅' : mission.status === 'failed' ? '❌' : '⏳' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-slate-100">Mission {{ mission.index }}</span>
                <span class="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded">
                  {{ mission.taskType }}
                </span>
              </div>
              <p class="text-xs text-slate-400 truncate">{{ mission.input.slice(0, 60) }}...</p>
              <div class="flex gap-4 mt-2 text-xs text-slate-500">
                <span v-if="mission.status === 'completed'">
                  ⏱️ {{ mission.executionTime }}ms
                </span>
                <span v-if="mission.transactions?.length">
                  💳 {{ mission.transactions.length }} txs
                </span>
                <span v-if="mission.pricing?.clientPayment">
                  💰 ${{ mission.pricing.clientPayment.toFixed(4) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-6 pt-4 border-t border-slate-700">
        <p class="text-xs text-slate-500 text-center">
          Batch will auto-complete and show detailed report when finished...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  totalCount: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  missions: { type: Array, default: () => [] },
  elapsedSeconds: { type: Number, default: 0 }
});

const progressPercent = computed(() => {
  if (props.totalCount === 0) return 0;
  return Math.round((props.completedCount / props.totalCount) * 100);
});

const elapsedTime = computed(() => {
  return Math.round(props.elapsedSeconds * 10) / 10;
});
</script>
