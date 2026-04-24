<template>
  <div class="min-h-screen bg-slate-950 flex flex-col text-slate-100">
    <SettlementBanner v-if="!isMarketing" />
    <PublicHeader v-if="!auth.firebaseUser" />
    <AppHeader v-else />
    <main class="flex-1">
      <router-view />
    </main>
    <PublicFooter />
    <ToastHost />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import PublicHeader from './components/PublicHeader.vue';
import PublicFooter from './components/PublicFooter.vue';
import SettlementBanner from './components/SettlementBanner.vue';
import ToastHost from './components/ToastHost.vue';
import { auth } from './stores/authStore.js';

const route = useRoute();
const isMarketing = computed(() => route.meta?.layout === 'marketing');
</script>
