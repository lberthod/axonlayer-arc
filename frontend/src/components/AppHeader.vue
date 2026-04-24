<template>
  <header class="bg-slate-800/80 backdrop-blur border-b border-indigo-500/20 sticky top-0 z-40">
    <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <router-link to="/" class="text-lg font-extrabold text-slate-100 flex items-center gap-2">
          <img src="/logo.svg" alt="Axon Layer" class="w-7 h-7" />
          Axon Layer
        </router-link>

        <!-- Desktop nav -->
        <nav class="hidden md:flex gap-1 text-sm">
          <router-link
            to="/mission"
            class="text-slate-400 hover:text-slate-100 px-3 py-2 rounded-md transition duration-200 hover:bg-slate-700"
            active-class="text-indigo-400 font-semibold bg-indigo-950"
          >Mission Control</router-link>
          <router-link
            to="/user"
            class="text-slate-400 hover:text-slate-100 px-3 py-2 rounded-md transition duration-200 hover:bg-slate-700"
            active-class="text-indigo-400 font-semibold bg-indigo-950"
          >My missions</router-link>
          <router-link
            to="/profile"
            class="text-slate-400 hover:text-slate-100 px-3 py-2 rounded-md transition duration-200 hover:bg-slate-700"
            active-class="text-indigo-400 font-semibold bg-indigo-950"
          >Profile</router-link>
          <router-link
            v-if="auth.role === 'provider' || auth.role === 'admin'"
            to="/operator"
            class="text-slate-400 hover:text-slate-100 px-3 py-2 rounded-md transition duration-200 hover:bg-slate-700"
            active-class="text-indigo-400 font-semibold bg-indigo-950"
          >Operator Console</router-link>
          <router-link
            v-if="auth.role === 'admin'"
            to="/admin"
            class="text-slate-400 hover:text-slate-100 px-3 py-2 rounded-md transition duration-200 hover:bg-slate-700"
            active-class="text-indigo-400 font-semibold bg-indigo-950"
          >Network Admin</router-link>
          <span class="text-slate-600 mx-1">|</span>

          <router-link
            to="/about"
            class="text-slate-500 hover:text-slate-300 px-3 py-2 rounded-md transition duration-200 hover:bg-slate-700"
          >About</router-link>

        </nav>
      </div>

      <div class="flex items-center gap-3 text-sm">
        <span
          class="hidden md:block px-2 py-0.5 rounded-full text-xs font-semibold"
          :class="roleTone"
        >{{ roleLabel }}</span>
        <span class="hidden md:block text-slate-300">{{ auth.firebaseUser?.email || '...' }}</span>
        <button
          @click="handleLogout"
          class="hidden md:block text-slate-500 hover:text-red-400 px-3 py-2 rounded-md transition duration-200 hover:bg-red-950/20"
        >Logout</button>
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 text-slate-400 hover:text-slate-100"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-slate-700 bg-slate-800">
      <nav class="container mx-auto px-4 py-4 flex flex-col gap-3 text-sm">
        <router-link to="/mission" @click="mobileMenuOpen = false" class="text-slate-400 hover:text-slate-100">Mission Control</router-link>
        <router-link to="/user" @click="mobileMenuOpen = false" class="text-slate-400 hover:text-slate-100">My missions</router-link>
        <router-link to="/profile" @click="mobileMenuOpen = false" class="text-slate-400 hover:text-slate-100">Profile</router-link>
        <router-link
          v-if="auth.role === 'operator' || auth.role === 'admin'"
          to="/operator"
          @click="mobileMenuOpen = false"
          class="text-slate-400 hover:text-slate-100"
        >Operator Console</router-link>
        <router-link
          v-if="auth.role === 'admin'"
          to="/admin"
          @click="mobileMenuOpen = false"
          class="text-slate-400 hover:text-slate-100"
        >Network Admin</router-link>
        <div class="border-t border-slate-700 my-2"></div>
        <router-link to="/" @click="mobileMenuOpen = false" class="text-slate-500 hover:text-slate-300">Home</router-link>
        <router-link to="/about" @click="mobileMenuOpen = false" class="text-slate-500 hover:text-slate-300">About</router-link>
        <router-link to="/privacy" @click="mobileMenuOpen = false" class="text-slate-500 hover:text-slate-300">Privacy</router-link>
        <router-link to="/terms" @click="mobileMenuOpen = false" class="text-slate-500 hover:text-slate-300">Terms</router-link>
        <div class="border-t border-slate-700 my-2"></div>
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="roleTone">{{ roleLabel }}</span>
          <span class="text-slate-300">{{ auth.firebaseUser?.email || '...' }}</span>
        </div>
        <button @click="handleLogout" class="text-red-600 hover:text-red-700 text-left">Logout</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { auth, doLogout } from '../stores/authStore.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const mobileMenuOpen = ref(false);

const roleTone = computed(() => {
  switch (auth.role) {
    case 'admin': return 'bg-red-100 text-red-700';
    case 'operator': return 'bg-violet-100 text-violet-700';
    case 'user': return 'bg-blue-100 text-blue-700';
    default: return 'bg-slate-700 text-slate-400';
  }
});

const roleLabel = computed(() => {
  return auth.role;
});

async function handleLogout() {
  mobileMenuOpen.value = false;
  await doLogout();
  router.push('/login');
}
</script>
