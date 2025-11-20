<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Team Dashboard</h1>
          <div class="flex items-center space-x-4">
            <router-link
              to="/profile"
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              My Profile
            </router-link>
            <button
              @click="handleLogout"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading team members...</p>
      </div>

      <div v-else-if="teamMembers.length === 0" class="text-center py-12">
        <p class="text-gray-600">No team members found.</p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <ProfileCard
          v-for="member in teamMembers"
          :key="member.id"
          :member="member"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTeamStore } from '../stores/teamStore.js';
import { authService } from '../services/auth.js';
import ProfileCard from '../components/ProfileCard.vue';

const router = useRouter();
const teamStore = useTeamStore();

const loading = computed(() => teamStore.loading);
const teamMembers = computed(() => teamStore.teamMembers);

const handleLogout = () => {
  authService.logout();
  router.push('/login');
};

onMounted(async () => {
  if (!teamStore.teamMembers.length) {
    await teamStore.fetchTeamMembers();
  }
});
</script>

