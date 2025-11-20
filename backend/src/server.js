import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { getAllUsers, updateUser } from './models/User.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Check for expired pomodoros every minute and update status
setInterval(() => {
  const users = getAllUsers();
  const now = new Date();
  
  users.forEach(user => {
    if (user.pomodoroActive && user.pomodoroEndTime) {
      const endTime = new Date(user.pomodoroEndTime);
      if (now >= endTime) {
        // Pomodoro has expired, restore the previous status
        const statusToRestore = user.previousStatus || 'available';
        const updatedUser = updateUser(user.id, {
          pomodoroActive: false,
          pomodoroEndTime: null,
          previousStatus: null, // Clear the stored previous status
          presenceStatus: statusToRestore
        });
        
        // Broadcast the changes
        if (global.io) {
          global.io.emit('pomodoro:stop', {
            userId: updatedUser.id
          });
          global.io.emit('status:update', {
            userId: updatedUser.id,
            status: updatedUser.presenceStatus
          });
        }
      }
    }
  });
}, 60000); // Check every minute

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };

