import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAllUsers, getUserById, updateUser } from '../models/User.js';

const router = express.Router();

// All profile routes require authentication
router.use(authenticateToken);

// Get all profiles
router.get('/', (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single profile
router.get('/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update own profile
router.put('/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Users can only update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allowedUpdates = ['name', 'profilePicture', 'otherInfo', 'pomodoroSound'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedUser = updateUser(userId, updates);
    const { password, ...userWithoutPassword } = updatedUser;

    // Broadcast profile update
    if (global.io) {
      global.io.emit('profile:update', userWithoutPassword);
    }

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update status
router.put('/:id/status', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Users can only update their own status
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'You can only update your own status' });
    }

    const { status } = req.body;
    const validStatuses = ['home', 'office', 'sick', 'vacation', 'meeting', 'available', 'lockedin'];
    
    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required' 
      });
    }
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status must be one of: ${validStatuses.join(', ')}. Received: ${status}` 
      });
    }

    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = updateUser(userId, { presenceStatus: status });
    const { password, ...userWithoutPassword } = updatedUser;

    // Broadcast status update
    if (global.io) {
      global.io.emit('status:update', {
        userId: userWithoutPassword.id,
        status: userWithoutPassword.presenceStatus
      });
    }

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start/stop pomodoro
router.put('/:id/pomodoro', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Users can only update their own pomodoro
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'You can only update your own pomodoro' });
    }

    const { action } = req.body; // 'start' or 'stop'
    
    if (!['start', 'stop'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "start" or "stop"' });
    }

    const user = getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updates = {};
    if (action === 'start') {
      // Get duration from request (default 25 minutes)
      const durationMinutes = req.body.duration || 25;
      // Validate duration (between 1 and 120 minutes)
      const validDuration = Math.max(1, Math.min(120, parseInt(durationMinutes)));
      const pomodoroDuration = validDuration * 60 * 1000; // Convert to milliseconds
      const endTime = new Date(Date.now() + pomodoroDuration);
      
      // Store the current status as previousStatus before changing to lockedin
      const previousStatus = user.presenceStatus === 'lockedin' 
        ? (user.previousStatus || 'available') 
        : user.presenceStatus;
      
      updates = {
        pomodoroActive: true,
        pomodoroEndTime: endTime.toISOString(),
        previousStatus: previousStatus, // Store the status before pomodoro
        presenceStatus: 'lockedin' // Automatically set status to "locked in"
      };
    } else {
      // Restore the previous status (or default to 'available' if none was stored)
      const statusToRestore = user.previousStatus || 'available';
      
      updates = {
        pomodoroActive: false,
        pomodoroEndTime: null,
        previousStatus: null, // Clear the stored previous status
        presenceStatus: statusToRestore // Restore the previous status
      };
    }

    const updatedUser = updateUser(userId, updates);
    const { password, ...userWithoutPassword } = updatedUser;

    // Broadcast pomodoro event and status update
    if (global.io) {
      if (action === 'start') {
        global.io.emit('pomodoro:start', {
          userId: userWithoutPassword.id,
          endTime: userWithoutPassword.pomodoroEndTime
        });
        // Broadcast status change
        global.io.emit('status:update', {
          userId: userWithoutPassword.id,
          status: userWithoutPassword.presenceStatus
        });
      } else {
        global.io.emit('pomodoro:stop', {
          userId: userWithoutPassword.id
        });
        // Broadcast status change
        global.io.emit('status:update', {
          userId: userWithoutPassword.id,
          status: userWithoutPassword.presenceStatus
        });
      }
    }

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Pomodoro update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

