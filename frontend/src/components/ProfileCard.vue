<template>
  <div
    :class="[
      'bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg border-l-4 relative',
      statusColor,
      { 'pomodoro-fading': isFading }
    ]"
    :style="fadeStyle"
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
import { socketService } from '../services/socket.js';
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
const isFading = ref(false);
const fadeProgress = ref(0);
let pomodoroInterval = null;
let fadeInterval = null;

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

// Compute fade style when fading from locked in to next status
const fadeStyle = computed(() => {
  if (!isFading.value || !props.member.pomodoroActive) {
    return {};
  }
  
  const lockedInColor = '#4f46e5'; // indigo-600
  const nextStatus = props.member.previousStatus || 'available';
  const nextStatusColor = getStatusColorValue(nextStatus);
  
  // Interpolate between colors based on fade progress (0 to 1)
  const interpolateColor = (color1, color2, progress) => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const currentColor = interpolateColor(lockedInColor, nextStatusColor, fadeProgress.value);
  
  // Determine text color based on background brightness
  // For darker colors (like locked in), use white text; for lighter, use dark
  const getBrightness = (r, g, b) => {
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  
  const hex1 = lockedInColor.replace('#', '');
  const hex2 = nextStatusColor.replace('#', '');
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const currentR = Math.round(r1 + (r2 - r1) * fadeProgress.value);
  const currentG = Math.round(g1 + (g2 - g1) * fadeProgress.value);
  const currentB = Math.round(b1 + (b2 - b1) * fadeProgress.value);
  const brightness = getBrightness(currentR, currentG, currentB);
  
  return {
    backgroundColor: currentColor,
    borderLeftColor: currentColor,
    color: brightness < 128 ? 'white' : '#1f2937' // white for dark backgrounds, dark gray for light
  };
});

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
      
      // Check if we're 5 seconds or less from the end - start fade
      const secondsLeft = diff / 1000;
      if (secondsLeft <= 5 && !isFading.value) {
        startFade();
      } else if (secondsLeft > 5 && isFading.value) {
        // Reset if pomodoro was extended or restarted
        stopFade();
      }
    } else {
      // Pomodoro has expired
      stopFade();
      // Automatically stop it if it's the current user
      if (isCurrentUser.value && props.member.pomodoroActive) {
        handleStopPomodoro();
      }
      pomodoroTimeLeft.value = '00:00';
    }
  } else {
    pomodoroTimeLeft.value = '';
    stopFade();
  }
};

const startFade = () => {
  if (isFading.value) return; // Already fading
  
  isFading.value = true;
  
  const updateFade = () => {
    if (!props.member.pomodoroActive || !props.member.pomodoroEndTime) {
      stopFade();
      return;
    }
    
    const endTime = new Date(props.member.pomodoroEndTime);
    const now = new Date();
    const diff = endTime - now;
    const secondsLeft = diff / 1000;
    
    if (secondsLeft <= 0) {
      fadeProgress.value = 1;
      stopFade();
      return;
    }
    
    // Calculate progress: 0 when 5 seconds left, 1 when 0 seconds left
    // So progress = (5 - secondsLeft) / 5
    fadeProgress.value = Math.max(0, Math.min(1, (5 - secondsLeft) / 5));
  };
  
  updateFade(); // Initial update
  fadeInterval = setInterval(updateFade, 16); // Update ~60fps
};

const stopFade = () => {
  isFading.value = false;
  fadeProgress.value = 0;
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
};

// Handle pomodoro stop event - ensure fade completes
const handlePomodoroStop = (data) => {
  if (data.userId === props.member.id) {
    // Ensure fade is complete
    if (isFading.value) {
      fadeProgress.value = 1;
      setTimeout(() => {
        stopFade();
      }, 100);
    }
  }
};

onMounted(() => {
  updatePomodoroTime();
  pomodoroInterval = setInterval(updatePomodoroTime, 1000);
  
  // Listen for pomodoro stop events
  socketService.on('pomodoro:stop', handlePomodoroStop);
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
  if (fadeInterval) {
    clearInterval(fadeInterval);
  }
  socketService.off('pomodoro:stop', handlePomodoroStop);
});
</script>

<style scoped>
.pomodoro-fading * {
  color: inherit !important;
}
</style>

