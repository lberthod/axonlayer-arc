import { createRouter, createWebHashHistory } from 'vue-router';
import { auth } from './stores/authStore.js';
import LandingView from './views/LandingView.vue';
import AboutView from './views/AboutView.vue';
import PrivacyView from './views/PrivacyView.vue';
import TermsView from './views/TermsView.vue';
import MissionControlView from './views/MissionControlView.vue';
import LoginView from './views/LoginView.vue';
import UserDashboardView from './views/UserDashboardView.vue';
import AgentOperatorConsoleView from './views/AgentOperatorConsoleView.vue';
import NetworkAdminView from './views/NetworkAdminView.vue';

const routes = [
  // Public marketing
  { path: '/', component: LandingView, meta: { public: true, layout: 'marketing' } },
  { path: '/about', component: AboutView, meta: { public: true, layout: 'marketing' } },
  { path: '/privacy', component: PrivacyView, meta: { public: true, layout: 'marketing' } },
  { path: '/terms', component: TermsView, meta: { public: true, layout: 'marketing' } },

  // Auth
  { path: '/login', component: LoginView, meta: { public: true } },

  // App
  { path: '/mission', component: MissionControlView, meta: { requiresAuth: true } },
  { path: '/user', component: UserDashboardView, meta: { requiresAuth: true } },
  { path: '/operator', component: AgentOperatorConsoleView, meta: { requiresAuth: true, roles: ['provider', 'admin'] } },
  { path: '/provider', redirect: '/operator' },
  { path: '/admin', component: NetworkAdminView, meta: { requiresAuth: true, roles: ['admin'] } },

  { path: '/:pathMatch(.*)*', redirect: '/' }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach(async (to) => {
  if (to.meta.public) return true;

  // Wait for auth init to finish before deciding
  if (auth.loading) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!auth.loading) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  if (to.meta.requiresAuth && !auth.firebaseUser) {
    return { path: '/login', query: { next: to.fullPath } };
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { path: '/mission' };
  }

  return true;
});
