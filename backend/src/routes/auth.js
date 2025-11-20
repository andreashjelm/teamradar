import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, getUserByUsername, createUser } from '../models/User.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    if (getUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (getUserByUsername(username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const DEFAULT_PROFILE_PICTURE = 'https://images.emojiterra.com/microsoft/fluent-emoji/15.1/128px/1f480_flat.png';
    const user = createUser({
      username,
      email,
      password: hashedPassword,
      name: name || username,
      profilePicture: DEFAULT_PROFILE_PICTURE,
      presenceStatus: 'available',
      previousStatus: null, // Store previous status for pomodoro
      pomodoroActive: false,
      pomodoroEndTime: null,
      otherInfo: {
        role: '',
        bio: ''
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

