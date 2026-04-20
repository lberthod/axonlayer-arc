import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.js';
import { initAuthStore } from './stores/authStore.js';
import './style.css';

initAuthStore();

createApp(App).use(router).mount('#app');
