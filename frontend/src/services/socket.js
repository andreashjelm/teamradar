import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

export const socketService = {
  connect() {
    if (socket?.connected) {
      return socket;
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on(event, callback) {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off(event, callback) {
    if (socket) {
      socket.off(event, callback);
    }
  },

  emit(event, data) {
    if (socket) {
      socket.emit(event, data);
    }
  },

  isConnected() {
    return socket?.connected || false;
  }
};

