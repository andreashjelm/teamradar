<template>
  <div
    :class="[
      'bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg border-l-4 relative',
      statusColor
    ]"
  >
    <div class="flex items-start space-x-4">
      <!-- Profile Picture -->
      <div class="flex-shrink-0">
        <img
          :src="member.profilePicture || DEFAULT_PROFILE_PICTURE"
          :alt="member.name || member.username"
          class="w-16 h-16 rounded-full object-cover border-4 border-white shadow"
        />
      </div>

      <!-- Member Info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 truncate">
          {{ member.name || member.username }}
        </h3>
        <p class="text-sm text-gray-600 truncate">{{ member.username }}</p>
        
        <!-- Status Badge / Selector -->
        <div class="mt-2">
          <div v-if="isCurrentUser" class="relative inline-block">
            <select
              :value="member.presenceStatus"
              @change="handleStatusChange"
              :disabled="updatingStatus"
              class="text-xs font-medium text-white px-3 py-1 rounded-full border-0 cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50"
              :style="{ backgroundColor: getStatusColorValue(member.presenceStatus) }"
              title="Click to change your status"
            >
              <option value="available" style="background-color: #6b7280;">Available</option>
              <option value="home" style="background-color: #3b82f6;">Working from Home</option>
              <option value="office" style="background-color: #10b981;">In Office</option>
              <option value="meeting" style="background-color: #8b5cf6;">In Meeting</option>
              <option value="sick" style="background-color: #ef4444;">Sick</option>
              <option value="vacation" style="background-color: #f97316;">On Vacation</option>
              <option value="lockedin" style="background-color: #4f46e5;">Locked In</option>
            </select>
            <span v-if="!updatingStatus" class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </span>
            <span v-else class="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          </div>
          <span
            v-else
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              statusColor,
              'text-white'
            ]"
          >
            {{ statusLabel }}
          </span>
        </div>

        <!-- Pomodoro Timer / Controls -->
        <div class="mt-3">
          <!-- Active Pomodoro Display -->
          <div v-if="member.pomodoroActive && pomodoroTimeLeft" class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-mono text-gray-700">
                Pomodoro: {{ pomodoroTimeLeft }}
              </span>
            </div>
            <button
              v-if="isCurrentUser"
              @click="handleStopPomodoro"
              :disabled="updatingPomodoro"
              class="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Stop
            </button>
          </div>
          
          <!-- Pomodoro Controls for Current User -->
          <div v-else-if="isCurrentUser" class="space-y-2">
            
            <button
              @click="handleStartPomodoro"
              :disabled="updatingPomodoro || pomodoroDuration < 1 || pomodoroDuration > 120"
              class="w-full px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Start Pomodoro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useTeamStore } from '../stores/teamStore.js';
import api from '../services/api.js';
import { DEFAULT_PROFILE_PICTURE } from '../constants.js';

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
});

const teamStore = useTeamStore();
const pomodoroTimeLeft = ref('');
const updatingStatus = ref(false);
const updatingPomodoro = ref(false);
const pomodoroDuration = ref(25);
let pomodoroInterval = null;

const isCurrentUser = computed(() => {
  return teamStore.currentUser && teamStore.currentUser.id === props.member.id;
});

const statusColor = computed(() => {
  return teamStore.getStatusColor(props.member.presenceStatus);
});

const statusLabel = computed(() => {
  return teamStore.getStatusLabel(props.member.presenceStatus);
});

const getStatusColorValue = (status) => {
  const colors = {
    home: '#3b82f6',
    office: '#10b981',
    sick: '#ef4444',
    vacation: '#f97316',
    meeting: '#8b5cf6',
    available: '#6b7280',
    lockedin: '#4f46e5'
  };
  return colors[status] || colors.available;
};

const handleStatusChange = async (event) => {
  if (!isCurrentUser.value) return;
  
  const newStatus = event.target.value.trim();
  if (!newStatus || newStatus === props.member.presenceStatus) return;

  updatingStatus.value = true;
  try {
    const response = await api.put(`/profiles/${props.member.id}/status`, {
      status: newStatus
    });
    // Status will be updated via WebSocket, but we can also refresh
    await teamStore.fetchTeamMembers();
  } catch (error) {
    console.error('Error updating status:', error);
    const errorMessage = error.response?.data?.error || 'Error updating status. Please try again.';
    alert(errorMessage);
    // Reset select to original value
    event.target.value = props.member.presenceStatus;
  } finally {
    updatingStatus.value = false;
  }
};

const updatePomodoroTime = () => {
  if (props.member.pomodoroActive && props.member.pomodoroEndTime) {
    const endTime = new Date(props.member.pomodoroEndTime);
    const now = new Date();
    const diff = endTime - now;

    if (diff > 0) {
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      pomodoroTimeLeft.value = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // Pomodoro has expired, automatically stop it if it's the current user
      if (isCurrentUser.value && props.member.pomodoroActive) {
        handleStopPomodoro();
      }
      pomodoroTimeLeft.value = '00:00';
    }
  } else {
    pomodoroTimeLeft.value = '';
  }
};

onMounted(() => {
  updatePomodoroTime();
  pomodoroInterval = setInterval(updatePomodoroTime, 1000);
});

const handleStartPomodoro = async () => {
  if (!isCurrentUser.value) return;
  if (pomodoroDuration.value < 1 || pomodoroDuration.value > 120) return;

  updatingPomodoro.value = true;
  try {
    const response = await api.put(`/profiles/${props.member.id}/pomodoro`, {
      action: 'start',
      duration: pomodoroDuration.value
    });
    // Update the user immediately with the response data
    if (response.data) {
      teamStore.updateTeamMember(response.data);
    }
    // WebSocket events will keep other users in sync, no need to fetch
  } catch (error) {
    console.error('Error starting pomodoro:', error);
    alert('Error starting pomodoro. Please try again.');
  } finally {
    updatingPomodoro.value = false;
  }
};

const handleStopPomodoro = async () => {
  if (!isCurrentUser.value) return;

  updatingPomodoro.value = true;
  try {
    const response = await api.put(`/profiles/${props.member.id}/pomodoro`, {
      action: 'stop'
    });
    // Update the user immediately with the response data
    if (response.data) {
      teamStore.updateTeamMember(response.data);
    }
    // WebSocket events will keep other users in sync, no need to fetch
  } catch (error) {
    console.error('Error stopping pomodoro:', error);
    alert('Error stopping pomodoro. Please try again.');
  } finally {
    updatingPomodoro.value = false;
  }
};

onUnmounted(() => {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
  }
});
</script>

