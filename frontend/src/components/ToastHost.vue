<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="t in toastState.toasts"
        :key="t.id"
        :class="['pointer-events-auto rounded-lg shadow-lg border px-4 py-3 text-sm flex items-start gap-3', toneFor(t.type)]"
      >
        <span class="font-bold leading-5">{{ iconFor(t.type) }}</span>
        <div class="flex-1 min-w-0">
          <p class="leading-5 break-words">{{ t.message }}</p>
          <p v-if="t.requestId" class="mt-0.5 text-[10px] opacity-60 font-mono truncate">
            req {{ t.requestId }}
          </p>
        </div>
        <button
          class="opacity-50 hover:opacity-100"
          @click="dismissToast(t.id)"
          aria-label="Dismiss"
        >×</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { toastState, dismissToast } from '../stores/toastStore.js';

function toneFor(type) {
  switch (type) {
    case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    case 'error':   return 'bg-red-50 border-red-200 text-red-900';
    case 'info':
    default:        return 'bg-slate-50 border-slate-200 text-slate-900';
  }
}

function iconFor(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error':   return '⚠';
    default:        return 'ℹ';
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.toast-enter-from {
  transform: translateX(40px);
  opacity: 0;
}
.toast-leave-to {
  transform: translateX(40px);
  opacity: 0;
}
</style>
