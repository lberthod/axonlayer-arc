<template>
  <header class="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
    <div class="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
      <router-link to="/" class="flex items-center gap-2 text-lg font-extrabold text-gray-900">
        <img src="/logo.svg" alt="ArcAgent Hub" class="w-8 h-8" />
        ArcAgent Hub
      </router-link>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-1 text-sm">
        <router-link to="/" exact-active-class="text-violet-600 font-semibold bg-violet-50" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition duration-200 hover:bg-gray-100">Home</router-link>
        <router-link to="/about" active-class="text-violet-600 font-semibold bg-violet-50" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition duration-200 hover:bg-gray-100">About</router-link>
        <a href="#how" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition duration-200 hover:bg-gray-100">How it works</a>
        <a href="#economics" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition duration-200 hover:bg-gray-100">Economics</a>
      </nav>

      <div class="flex items-center gap-3">
        <router-link
          v-if="!auth.firebaseUser"
          to="/login"
          class="hidden md:block text-sm text-gray-700 hover:text-gray-900"
        >Sign in</router-link>
        <router-link
          :to="auth.firebaseUser ? '/mission' : '/login'"
          class="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          {{ auth.firebaseUser ? 'Open Mission Control' : 'Launch a mission' }}
        </router-link>
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 text-gray-600 hover:text-gray-900"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-100 bg-white">
      <nav class="container mx-auto px-4 py-4 flex flex-col gap-3 text-sm">
        <router-link to="/" @click="mobileMenuOpen = false" class="text-gray-600 hover:text-gray-900">Home</router-link>
        <router-link to="/about" @click="mobileMenuOpen = false" class="text-gray-600 hover:text-gray-900">About</router-link>
        <a href="#how" @click="mobileMenuOpen = false" class="text-gray-600 hover:text-gray-900">How it works</a>
        <a href="#economics" @click="mobileMenuOpen = false" class="text-gray-600 hover:text-gray-900">Economics</a>
        <router-link
          v-if="!auth.firebaseUser"
          to="/login"
          @click="mobileMenuOpen = false"
          class="text-gray-700 hover:text-gray-900"
        >Sign in</router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { auth } from '../stores/authStore.js';

const mobileMenuOpen = ref(false);
</script>
