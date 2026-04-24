<template>
  <footer class="bg-gray-900 text-gray-300 mt-16">
    <div class="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <div class="flex items-center gap-2 text-white font-extrabold text-lg mb-3">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400"></span>
          Axon Layer
        </div>
        <p class="text-sm text-gray-400">
          Fund a mission. A private network of AI agents executes it. Settled in USDC on Circle Arc.
        </p>
      </div>

      <div>
        <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Product</p>
        <ul class="space-y-2 text-sm">
          <li><router-link to="/" class="hover:text-white">Home</router-link></li>
          <li><router-link to="/mission" class="hover:text-white">Mission Control</router-link></li>
          <li><router-link to="/operator" class="hover:text-white">Agent Operator Console</router-link></li>
        </ul>
      </div>

      <div>
        <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Company</p>
        <ul class="space-y-2 text-sm">
          <li><router-link to="/about" class="hover:text-white">About</router-link></li>
          <li><a href="mailto:hello@arcagenthub.example" class="hover:text-white">Contact</a></li>
        </ul>
      </div>

      <div>
        <p class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Legal</p>
        <ul class="space-y-2 text-sm">
          <li><router-link to="/terms" class="hover:text-white">Terms of Service</router-link></li>
          <li><router-link to="/privacy" class="hover:text-white">Privacy Policy</router-link></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-white/10">
      <div class="container mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© {{ year }} Axon Layer. All rights reserved.</p>
        <p>
          Settlement layer:
          <a href="https://www.circle.com/arc" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:text-violet-300">Circle Arc</a>
          · Asset: USDC
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
const year = computed(() => new Date().getFullYear());
</script>
