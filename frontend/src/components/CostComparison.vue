<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-900">Cost Comparison</h2>
      <span class="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
        Arc Advantage
      </span>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
        <div>
          <p class="text-sm font-semibold text-gray-900">Traditional gas</p>
          <p class="text-xs text-gray-600">Ethereum mainnet</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold text-red-700">&gt; $0.02</p>
          <p class="text-red-500 text-sm">❌</p>
        </div>
      </div>

      <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
        <div>
          <p class="text-sm font-semibold text-gray-900">Arc</p>
          <p class="text-xs text-gray-600">Circle Arc Testnet</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold text-emerald-700">$0.001</p>
          <p class="text-emerald-500 text-sm">✅</p>
        </div>
      </div>

      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          <span class="font-bold text-emerald-600">20x cheaper</span> than traditional gas
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed - static comparison
</script>
