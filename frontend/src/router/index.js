import { createRouter, createWebHistory } from 'vue-router';
import { authService } from '../services/auth.js';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Profile from '../views/Profile.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  const isAuthenticated = authService.isAuthenticated();

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;

