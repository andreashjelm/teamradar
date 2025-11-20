<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
          <router-link
            to="/"
            class="text-blue-600 hover:text-blue-800 font-medium"
          >
            Dashboard
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="!currentUser" class="text-center py-12">
        <p class="text-gray-600">Loading profile...</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Profile Picture Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
          <div class="flex items-center space-x-6">
            <div class="flex-shrink-0">
              <img
                :src="profileForm.profilePicture || DEFAULT_PROFILE_PICTURE"
                alt="Profile"
                class="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            </div>
            <div class="flex-1">
              <input
                v-model="profileForm.profilePicture"
                type="url"
                placeholder="Profile picture URL"
                @blur="validateProfilePicture"
                :class="[
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.profilePicture ? 'border-red-500' : 'border-gray-300'
                ]"
              />
              <p v-if="errors.profilePicture" class="mt-2 text-sm text-red-600">
                {{ errors.profilePicture }}
              </p>
              <p v-else class="mt-2 text-sm text-gray-500">
                Enter a URL to your profile picture (optional)
              </p>
            </div>
          </div>
        </div>

        <!-- Basic Info Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="profileForm.name"
                type="text"
                @blur="validateName"
                @input="errors.name = ''"
                :class="[
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.name ? 'border-red-500' : 'border-gray-300'
                ]"
                placeholder="Your full name"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                :value="currentUser.username"
                type="text"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
              <p class="mt-1 text-sm text-gray-500">Username cannot be changed</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                :value="currentUser.email"
                type="email"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
              <p class="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                v-model="profileForm.otherInfo.role"
                type="text"
                @blur="validateRole"
                @input="errors.role = ''"
                :class="[
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.role ? 'border-red-500' : 'border-gray-300'
                ]"
                placeholder="e.g., Software Engineer"
              />
              <p v-if="errors.role" class="mt-1 text-sm text-red-600">
                {{ errors.role }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                v-model="profileForm.otherInfo.bio"
                rows="3"
                @blur="validateBio"
                @input="errors.bio = ''"
                :class="[
                  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                ]"
                placeholder="Tell us about yourself..."
              ></textarea>
              <div class="mt-1 flex justify-between">
                <p v-if="errors.bio" class="text-sm text-red-600">
                  {{ errors.bio }}
                </p>
                <p v-else class="text-sm text-gray-500">
                  {{ profileForm.otherInfo.bio.length }}/500 characters
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Presence Status</h2>
          <StatusSelector v-model="profileForm.presenceStatus" />
        </div>

        <!-- Pomodoro Section -->
        <PomodoroTimer />

        <!-- Save Button -->
        <div class="flex justify-end space-x-4">
          <button
            @click="handleSave"
            :disabled="saving"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useTeamStore } from '../stores/teamStore.js';
import api from '../services/api.js';
import StatusSelector from '../components/StatusSelector.vue';
import PomodoroTimer from '../components/PomodoroTimer.vue';
import { DEFAULT_PROFILE_PICTURE } from '../constants.js';

const teamStore = useTeamStore();
const saving = ref(false);
const errors = reactive({
  name: '',
  profilePicture: '',
  role: '',
  bio: ''
});

const currentUser = computed(() => teamStore.currentUser);

const profileForm = reactive({
  name: '',
  profilePicture: '',
  presenceStatus: 'available',
  otherInfo: {
    role: '',
    bio: ''
  }
});

// Validation functions
const validateName = () => {
  if (!profileForm.name || profileForm.name.trim().length === 0) {
    errors.name = 'Name is required';
    return false;
  }
  if (profileForm.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
    return false;
  }
  if (profileForm.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
    return false;
  }
  errors.name = '';
  return true;
};

const validateProfilePicture = () => {
  if (profileForm.profilePicture && profileForm.profilePicture.trim().length > 0) {
    try {
      new URL(profileForm.profilePicture);
      errors.profilePicture = '';
      return true;
    } catch {
      errors.profilePicture = 'Please enter a valid URL (e.g., https://example.com/image.jpg)';
      return false;
    }
  }
  errors.profilePicture = '';
  return true; // Optional field
};

const validateRole = () => {
  if (profileForm.otherInfo.role && profileForm.otherInfo.role.length > 100) {
    errors.role = 'Role must be less than 100 characters';
    return false;
  }
  errors.role = '';
  return true;
};

const validateBio = () => {
  if (profileForm.otherInfo.bio && profileForm.otherInfo.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters';
    return false;
  }
  errors.bio = '';
  return true;
};

const validateForm = () => {
  const nameValid = validateName();
  const pictureValid = validateProfilePicture();
  const roleValid = validateRole();
  const bioValid = validateBio();
  
  return nameValid && pictureValid && roleValid && bioValid;
};

onMounted(() => {
  if (currentUser.value) {
    profileForm.name = currentUser.value.name || '';
    profileForm.profilePicture = currentUser.value.profilePicture || DEFAULT_PROFILE_PICTURE;
    profileForm.presenceStatus = currentUser.value.presenceStatus || 'available';
    profileForm.otherInfo = {
      role: currentUser.value.otherInfo?.role || '',
      bio: currentUser.value.otherInfo?.bio || ''
    };
    // Clear any previous errors
    Object.keys(errors).forEach(key => errors[key] = '');
  }
});

const handleSave = async () => {
  if (!currentUser.value) return;

  // Validate form before submitting
  if (!validateForm()) {
    // Scroll to first error
    const firstError = Object.keys(errors).find(key => errors[key]);
    if (firstError) {
      const element = document.querySelector(`[name="${firstError}"]`) || 
                     document.querySelector(`input[placeholder*="${firstError}"]`) ||
                     document.querySelector('input');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
    return;
  }

  saving.value = true;
  try {
    const userId = currentUser.value.id;

    // Update profile
    await api.put(`/profiles/${userId}`, {
      name: profileForm.name.trim(),
      profilePicture: profileForm.profilePicture.trim() || DEFAULT_PROFILE_PICTURE,
      otherInfo: {
        role: profileForm.otherInfo.role.trim(),
        bio: profileForm.otherInfo.bio.trim()
      }
    });

    // Update status
    await api.put(`/profiles/${userId}/status`, {
      status: profileForm.presenceStatus
    });

    // Refresh team members and current user
    await teamStore.fetchTeamMembers();
    teamStore.loadCurrentUser();
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successMsg.textContent = 'Profile updated successfully!';
    document.body.appendChild(successMsg);
    setTimeout(() => {
      successMsg.remove();
    }, 3000);
  } catch (error) {
    console.error('Error saving profile:', error);
    const errorMsg = error.response?.data?.error || 'Error saving profile. Please try again.';
    alert(errorMsg);
  } finally {
    saving.value = false;
  }
};
</script>

