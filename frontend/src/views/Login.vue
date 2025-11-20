<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">Team Radar</h1>
      
      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div v-if="isRegister" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login') }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <button
          @click="toggleMode"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {{ isRegister ? 'Already have an account? Login' : "Don't have an account? Register" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/auth.js';
import { useTeamStore } from '../stores/teamStore.js';

const router = useRouter();
const teamStore = useTeamStore();

const isRegister = ref(false);
const loading = ref(false);
const error = ref('');

const form = reactive({
  email: '',
  password: '',
  username: '',
  name: ''
});

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  error.value = '';
  form.username = '';
  form.name = '';
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    if (isRegister.value) {
      await authService.register(form);
    } else {
      await authService.login(form.email, form.password);
    }
    
    // Initialize team store
    await teamStore.init();
    
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.error || 'An error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

