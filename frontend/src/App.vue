<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useTeamStore } from './stores/teamStore.js';

const teamStore = useTeamStore();

onMounted(() => {
  if (teamStore.currentUser || localStorage.getItem('token')) {
    teamStore.init();
  }
});
</script>

