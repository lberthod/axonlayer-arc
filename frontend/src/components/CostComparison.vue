<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">Cost Comparison</h2>
      <span class="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
        Arc Advantage
      </span>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 transition-all duration-300 hover:shadow-md">
        <div>
          <p class="text-sm font-semibold text-gray-900">Traditional gas</p>
          <p class="text-xs text-gray-600">Ethereum mainnet</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold text-red-700">&gt; $0.02</p>
          <p class="text-red-500 text-sm animate-pulse">❌</p>
        </div>
      </div>

      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 rounded-lg blur transition-opacity duration-300 group-hover:opacity-20"></div>
        <div class="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200 border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 relative">
          <div>
            <p class="text-sm font-semibold text-gray-900">Arc USDC</p>
            <p class="text-xs text-gray-600">Circle Arc (native gas)</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold text-emerald-700">$0.0005</p>
            <p class="text-emerald-600 text-sm font-semibold">✅ Viable</p>
          </div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
        <p class="text-sm text-gray-700 text-center">
          <span class="block font-bold text-emerald-700 text-lg">100x cheaper</span>
          <span class="text-xs text-gray-600">than ChatGPT API at $0.005/task</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed - static comparison
</script>
