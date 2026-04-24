<template>
  <div class="bg-slate-800 rounded-xl shadow-md p-6 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-slate-100">Cost Comparison</h2>
      <span class="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        Axon Advantage
      </span>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-900/50 transition-all duration-300 hover:shadow-md">
        <div>
          <p class="text-sm font-semibold text-slate-100">Traditional gas</p>
          <p class="text-xs text-slate-400">Ethereum mainnet</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold text-red-400">&gt; $0.02</p>
          <p class="text-red-400 text-sm animate-pulse">❌</p>
        </div>
      </div>

      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 rounded-lg blur transition-opacity duration-300 group-hover:opacity-20"></div>
        <div class="flex items-center justify-between p-4 bg-emerald-950/20 rounded-lg border border-emerald-900/50 border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 relative">
          <div>
            <p class="text-sm font-semibold text-slate-100">Arc USDC</p>
            <p class="text-xs text-slate-400">Circle Arc (native gas)</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold text-emerald-400">$0.0005</p>
            <p class="text-emerald-400 text-sm font-semibold">✅ Viable</p>
          </div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-emerald-950/20 rounded-lg border border-emerald-900/50">
        <p class="text-sm text-slate-300 text-center">
          <span class="block font-bold text-emerald-400 text-lg">100x cheaper</span>
          <span class="text-xs text-slate-400">than ChatGPT API at $0.005/task</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed - static comparison
</script>
