<template>
  <div class="min-h-screen bg-gray-50 relative" :class="{ 'grayscale-filter': isActive }">
    <!-- Gray Overlay when pomodoro is active -->
    <div 
      v-if="isActive" 
      class="fixed inset-0 bg-gray-900 bg-opacity-30 z-40 pointer-events-none"
    ></div>

    <!-- Header -->
    <header class="bg-white shadow-sm relative z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Pomodoro Timer</h1>
          <div class="flex items-center space-x-4">
            <router-link
              to="/"
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              Dashboard
            </router-link>
            <router-link
              to="/profile"
              class="text-blue-600 hover:text-blue-800 font-medium"
            >
              My Profile
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-30">
      <div v-if="!currentUser" class="text-center py-12">
        <p class="text-gray-600">Loading...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Sound Selection -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Notification Sound</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select a fanfare sound to play when pomodoro ends
              </label>
              <select
                v-model="selectedSound"
                @change="saveSoundPreference"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option v-for="(sound, index) in fanfareSounds" :key="index" :value="sound.url">
                  {{ sound.name }}
                </option>
                <option v-if="customSoundUrl" :value="customSoundUrl">Custom Sound</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Or use a custom sound URL
              </label>
              <div class="flex space-x-2">
                <input
                  v-model="customSoundUrl"
                  type="url"
                  placeholder="https://example.com/sound.mp3"
                  @blur="handleCustomSoundChange"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  v-if="customSoundUrl"
                  @click="setCustomSound"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Use
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-500">
                Enter a direct URL to an MP3, WAV, or OGG audio file
              </p>
            </div>
            
            <div>
              <button
                @click="playSound(selectedSound)"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                🔊 Test Sound
              </button>
            </div>
          </div>
        </div>

        <!-- Pomodoro Timer Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Timer</h2>
          
          <div v-if="isActive" class="text-center">
            <div class="text-6xl font-mono font-bold text-gray-900 mb-6">
              {{ timeLeft }}
            </div>
            <button
              @click="stopPomodoro"
              class="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-lg"
            >
              Stop Pomodoro
            </button>
          </div>

          <div v-else class="text-center">
            <div class="text-4xl font-mono text-gray-500 mb-6">
              {{ String(Math.floor(pomodoroDuration)).padStart(2, '0') }}:00
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duration (1-120 minutes)
              </label>
              <div class="flex items-center justify-center space-x-2">
                <button
                  @click="pomodoroDuration = Math.max(1, pomodoroDuration - 5)"
                  class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  title="Decrease by 5 minutes"
                >
                  -5
                </button>
                <input
                  v-model.number="pomodoroDuration"
                  type="number"
                  min="1"
                  max="120"
                  class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg"
                  placeholder="25"
                />
                <button
                  @click="pomodoroDuration = Math.min(120, pomodoroDuration + 5)"
                  class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  title="Increase by 5 minutes"
                >
                  +5
                </button>
              </div>
            </div>
            <button
              @click="startPomodoro"
              :disabled="pomodoroDuration < 1 || pomodoroDuration > 120"
              class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Start Pomodoro
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api.js';
import { useTeamStore } from '../stores/teamStore.js';
import { socketService } from '../services/socket.js';

const teamStore = useTeamStore();
const router = useRouter();
const now = ref(new Date());
const pomodoroDuration = ref(25);
const selectedSound = ref('');
const customSoundUrl = ref('');
const audioRef = ref(null);

// Fanfare sound options
// Note: The default sounds use Web Audio API fallback if URLs fail
// Users can add custom sound URLs using the input field
// For best results, host your own sound files or use a reliable CDN
const fanfareSounds = [
  { name: 'Fanfare 1 - Victory (Default Beep)', url: 'default-beep-1' },
  { name: 'Fanfare 2 - Celebration (Default Beep)', url: 'default-beep-2' },
  { name: 'Fanfare 3 - Triumph (Default Beep)', url: 'default-beep-3' },
  { name: 'Fanfare 4 - Achievement (Default Beep)', url: 'default-beep-4' },
  { name: 'Fanfare 5 - Success (Default Beep)', url: 'default-beep-5' },
  { name: 'Fanfare 6 - Accomplishment (Default Beep)', url: 'default-beep-6' },
  { name: 'Fanfare 7 - Completion (Default Beep)', url: 'default-beep-7' },
  { name: 'Fanfare 8 - Milestone (Default Beep)', url: 'default-beep-8' },
  { name: 'Fanfare 9 - Achievement Unlocked (Default Beep)', url: 'default-beep-9' },
  { name: 'Fanfare 10 - Mission Complete (Default Beep)', url: 'default-beep-10' }
];

const currentUser = computed(() => teamStore.currentUser);

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

// Initialize sound preference
const initializeSoundPreference = () => {
  if (currentUser.value) {
    selectedSound.value = currentUser.value.pomodoroSound || fanfareSounds[0].url;
  }
};

// Watch for currentUser changes to update sound preference
watch(currentUser, () => {
  initializeSoundPreference();
}, { immediate: true });

onMounted(() => {
  initializeSoundPreference();
  
  // Listen for pomodoro stop events to play sound
  socketService.on('pomodoro:stop', handlePomodoroStop);
  
  if (isActive.value) {
    updateInterval = setInterval(() => {
      now.value = new Date();
    }, 1000);
  }
});

onUnmounted(() => {
  socketService.off('pomodoro:stop', handlePomodoroStop);
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value = null;
  }
});

// Track if pomodoro was active before stop (to know if we should play sound)
const wasPomodoroActive = ref(false);

// Watch isActive to track state changes
watch(isActive, (active) => {
  if (active) {
    wasPomodoroActive.value = true;
  }
});

// Handle pomodoro stop event - play sound if it's the current user and was active
const handlePomodoroStop = (data) => {
  const user = teamStore.currentUser;
  if (user && user.id === data.userId && wasPomodoroActive.value) {
    // Pomodoro just ended, play sound
    playSound(selectedSound.value);
    wasPomodoroActive.value = false;
  }
};

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

// Play fanfare sound with different frequencies for variety
const playFanfareBeep = (index = 0) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a fanfare-like sequence of beeps
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (C major chord)
    const duration = 0.15;
    const startTime = audioContext.currentTime;
    
    frequencies.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const noteStart = startTime + (i * duration * 0.8);
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(0.2, noteStart + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + duration);
      
      oscillator.start(noteStart);
      oscillator.stop(noteStart + duration);
    });
  } catch (error) {
    console.error('Error playing fanfare beep:', error);
  }
};

const playSound = (soundUrl) => {
  if (!soundUrl) return;
  
  // Stop any currently playing sound
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value = null;
  }
  
  // Check if it's a default beep (starts with "default-beep-")
  if (soundUrl.startsWith('default-beep-')) {
    const beepIndex = parseInt(soundUrl.replace('default-beep-', '')) - 1;
    playFanfareBeep(beepIndex);
    return;
  }
  
  // Try to play from URL
  try {
    // Create and play new audio with error handling
    audioRef.value = new Audio(soundUrl);
    
    // Handle errors - fallback to beep
    audioRef.value.onerror = (error) => {
      console.error('Error loading sound from URL, using fallback beep:', error);
      playFanfareBeep();
    };
    
    // Handle successful load
    audioRef.value.oncanplaythrough = () => {
      audioRef.value.play().catch(error => {
        console.error('Error playing sound (autoplay may be blocked), using fallback beep:', error);
        playFanfareBeep();
      });
    };
    
    // Load the audio
    audioRef.value.load();
  } catch (error) {
    console.error('Error creating audio, using fallback beep:', error);
    playFanfareBeep();
  }
};

const handleCustomSoundChange = () => {
  if (customSoundUrl.value && customSoundUrl.value.trim()) {
    // Validate URL
    try {
      new URL(customSoundUrl.value);
    } catch {
      alert('Please enter a valid URL');
      customSoundUrl.value = '';
      return;
    }
  }
};

const setCustomSound = () => {
  if (customSoundUrl.value && customSoundUrl.value.trim()) {
    selectedSound.value = customSoundUrl.value;
    saveSoundPreference();
  }
};

const saveSoundPreference = async () => {
  try {
    const userId = currentUser.value?.id;
    if (!userId) return;
    
    await api.put(`/profiles/${userId}`, {
      pomodoroSound: selectedSound.value
    });
    
    // Update local user data
    teamStore.loadCurrentUser();
    await teamStore.fetchTeamMembers();
  } catch (error) {
    console.error('Error saving sound preference:', error);
  }
};

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
</script>

<style scoped>
.grayscale-filter {
  filter: grayscale(0.3);
}

/* Ensure overlay is above content but below header */
.fixed.inset-0 {
  z-index: 40;
}
</style>

