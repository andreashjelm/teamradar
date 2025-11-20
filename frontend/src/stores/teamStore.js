import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api.js';
import { socketService } from '../services/socket.js';

export const useTeamStore = defineStore('team', () => {
  const teamMembers = ref([]);
  const currentUser = ref(null);
  const loading = ref(false);

  // Load current user from localStorage
  const loadCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUser.value = JSON.parse(userStr);
    }
  };

  // Load team members from API
  const fetchTeamMembers = async () => {
    try {
      loading.value = true;
      const response = await api.get('/profiles');
      teamMembers.value = response.data;
      
      // Update current user if it exists in the team members
      if (currentUser.value) {
        const updatedUser = response.data.find(u => u.id === currentUser.value.id);
        if (updatedUser) {
          currentUser.value = updatedUser;
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      // Cache in localStorage
      localStorage.setItem('teamMembers', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Try to load from cache
      const cached = localStorage.getItem('teamMembers');
      if (cached) {
        teamMembers.value = JSON.parse(cached);
      }
    } finally {
      loading.value = false;
    }
  };

  // Update team member (from WebSocket or API)
  const updateTeamMember = (memberData) => {
    const index = teamMembers.value.findIndex(m => m.id === memberData.id);
    if (index !== -1) {
      teamMembers.value[index] = { ...teamMembers.value[index], ...memberData };
    } else {
      teamMembers.value.push(memberData);
    }
    
    // Update current user if it's the same user
    if (currentUser.value && currentUser.value.id === memberData.id) {
      currentUser.value = { ...currentUser.value, ...memberData };
      localStorage.setItem('user', JSON.stringify(currentUser.value));
    }
    
    // Update cache
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers.value));
  };

  // Update status for a team member
  const updateMemberStatus = (userId, status) => {
    const member = teamMembers.value.find(m => m.id === userId);
    if (member) {
      member.presenceStatus = status;
      localStorage.setItem('teamMembers', JSON.stringify(teamMembers.value));
    }
    
    // Update current user if it's the same user
    if (currentUser.value && currentUser.value.id === userId) {
      currentUser.value.presenceStatus = status;
      localStorage.setItem('user', JSON.stringify(currentUser.value));
    }
  };

  // Update pomodoro for a team member
  const updateMemberPomodoro = (userId, pomodoroData) => {
    const member = teamMembers.value.find(m => m.id === userId);
    if (member) {
      member.pomodoroActive = pomodoroData.active;
      member.pomodoroEndTime = pomodoroData.endTime;
      localStorage.setItem('teamMembers', JSON.stringify(teamMembers.value));
    }
    
    // Update current user if it's the same user
    if (currentUser.value && currentUser.value.id === userId) {
      currentUser.value.pomodoroActive = pomodoroData.active;
      currentUser.value.pomodoroEndTime = pomodoroData.endTime;
      localStorage.setItem('user', JSON.stringify(currentUser.value));
    }
  };

  // Setup WebSocket listeners
  const setupSocketListeners = () => {
    socketService.on('status:update', (data) => {
      updateMemberStatus(data.userId, data.status);
    });

    socketService.on('pomodoro:start', (data) => {
      updateMemberPomodoro(data.userId, {
        active: true,
        endTime: data.endTime
      });
      // Also update status to lockedin when pomodoro starts
      if (data.userId) {
        updateMemberStatus(data.userId, 'lockedin');
      }
    });

    socketService.on('pomodoro:stop', (data) => {
      updateMemberPomodoro(data.userId, {
        active: false,
        endTime: null
      });
      // Status will be updated via status:update event
    });

    socketService.on('profile:update', (data) => {
      updateTeamMember(data);
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      home: 'bg-blue-500',
      office: 'bg-green-500',
      sick: 'bg-red-500',
      vacation: 'bg-orange-500',
      meeting: 'bg-purple-500',
      available: 'bg-gray-500',
      lockedin: 'bg-indigo-600'
    };
    return colors[status] || colors.available;
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      home: 'Working from Home',
      office: 'In Office',
      sick: 'Sick',
      vacation: 'On Vacation',
      meeting: 'In Meeting',
      available: 'Available',
      lockedin: 'Locked In'
    };
    return labels[status] || status;
  };

  // Initialize store
  const init = async () => {
    loadCurrentUser();
    await fetchTeamMembers();
    socketService.connect();
    setupSocketListeners();
  };

  return {
    teamMembers,
    currentUser,
    loading,
    loadCurrentUser,
    fetchTeamMembers,
    updateTeamMember,
    updateMemberStatus,
    updateMemberPomodoro,
    setupSocketListeners,
    getStatusColor,
    getStatusLabel,
    init
  };
});

