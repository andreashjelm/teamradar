<template>
  <div class="space-y-4">
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Pomodoro Timer</h3>
      
      <div v-if="isActive" class="text-center">
        <div class="text-4xl font-mono font-bold text-gray-900 mb-4">
          {{ timeLeft }}
        </div>
        <button
          @click="stopPomodoro"
          class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Stop Pomodoro
        </button>
      </div>

      <div v-else class="text-center">
        <div class="text-2xl font-mono text-gray-500 mb-4">
          {{ String(Math.floor(pomodoroDuration)).padStart(2, '0') }}:00
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Duration (1-120 minutes)
          </label>
          <div class="flex items-center justify-center space-x-2">
            <button
              @click="pomodoroDuration = Math.max(1, pomodoroDuration - 5)"
              class="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              title="Decrease by 5 minutes"
            >
              -5
            </button>
            <input
              v-model.number="pomodoroDuration"
              type="number"
              min="1"
              max="120"
              class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
              placeholder="25"
            />
            <button
              @click="pomodoroDuration = Math.min(120, pomodoroDuration + 5)"
              class="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              title="Increase by 5 minutes"
            >
              +5
            </button>
          </div>
        </div>
        <button
          @click="startPomodoro"
          :disabled="pomodoroDuration < 1 || pomodoroDuration > 120"
          class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Pomodoro
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import api from '../services/api.js';
import { useTeamStore } from '../stores/teamStore.js';

const teamStore = useTeamStore();
const now = ref(new Date());
const pomodoroDuration = ref(25);

const isActive = computed(() => {
  const user = teamStore.currentUser;
  return user?.pomodoroActive || false;
});

const timeLeft = computed(() => {
  const user = teamStore.currentUser;
  if (!user?.pomodoroActive || !user?.pomodoroEndTime) {
    return '25:00';
  }

  const endTimeDate = new Date(user.pomodoroEndTime);
  const diff = endTimeDate - now.value;

  if (diff > 0) {
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return '00:00';
  }
});

// Watch for pomodoro expiration
watch(() => {
  const user = teamStore.currentUser;
  if (user?.pomodoroActive && user?.pomodoroEndTime) {
    const endTimeDate = new Date(user.pomodoroEndTime);
    return endTimeDate - now.value;
  }
  return null;
}, (diff) => {
  if (diff !== null && diff <= 0) {
    // Pomodoro has expired, automatically stop it
    const user = teamStore.currentUser;
    if (user?.pomodoroActive) {
      stopPomodoro();
    }
  }
});

const startPomodoro = async () => {
  try {
    const userId = teamStore.currentUser?.id;
    if (!userId) return;
    if (pomodoroDuration.value < 1 || pomodoroDuration.value > 120) return;
    
    const response = await api.put(`/profiles/${userId}/pomodoro`, {
      action: 'start',
      duration: pomodoroDuration.value
    });
    
    // Update the user immediately with the response data
    if (response.data) {
      teamStore.updateTeamMember(response.data);
    }
    // WebSocket events will keep other users in sync, no need to fetch
    teamStore.loadCurrentUser();
  } catch (error) {
    console.error('Error starting pomodoro:', error);
    alert('Error starting pomodoro. Please try again.');
  }
};

const stopPomodoro = async () => {
  try {
    const userId = teamStore.currentUser?.id;
    if (!userId) return;
    
    const response = await api.put(`/profiles/${userId}/pomodoro`, { action: 'stop' });
    
    // Update the user immediately with the response data
    if (response.data) {
      teamStore.updateTeamMember(response.data);
    }
    // WebSocket events will keep other users in sync, no need to fetch
    teamStore.loadCurrentUser();
  } catch (error) {
    console.error('Error stopping pomodoro:', error);
    alert('Error stopping pomodoro. Please try again.');
  }
};

let updateInterval = null;

watch(isActive, (active) => {
  if (active) {
    updateInterval = setInterval(() => {
      now.value = new Date();
    }, 1000);
  } else {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
}, { immediate: true });

onMounted(() => {
  if (isActive.value) {
    updateInterval = setInterval(() => {
      now.value = new Date();
    }, 1000);
  }
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
</script>

