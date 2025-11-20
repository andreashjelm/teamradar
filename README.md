# Team Radar

A real-time team tracking system for software development teams. Track team member presence, pomodoro timers, and profiles with live updates via WebSocket.

## Features

- **User Authentication**: Register and login with JWT-based authentication
- **Team Dashboard**: View all team members with color-coded status cards
- **Presence Status**: Update and track status (Home, Office, Sick, Vacation, Meeting, Available)
- **Pomodoro Timer**: Start/stop 25-minute pomodoro sessions with real-time countdown
- **Profile Management**: Update profile picture, name, role, and bio
- **Real-time Updates**: Live synchronization across all clients via WebSocket

## Tech Stack

- **Frontend**: Vue.js 3, Pinia, Vue Router, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io, JWT, bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:3000`

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Environment Variables

Create a `.env` file in the `backend` directory (optional):
```
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
```

## Usage

1. Register a new account or login with existing credentials
2. View the dashboard to see all team members
3. Click "My Profile" to update your profile and status
4. Start a pomodoro timer from your profile page
5. All changes are synchronized in real-time across all connected clients

## Project Structure

```
teamradar/
├── frontend/          # Vue.js application
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── views/         # Page views
│   │   ├── services/      # API and Socket services
│   │   ├── stores/        # Pinia stores
│   │   └── router/        # Vue Router config
│   └── package.json
├── backend/           # Node.js/Express server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # Data models
│   │   ├── middleware/    # Auth middleware
│   │   ├── socket/        # WebSocket handlers
│   │   └── server.js      # Main server file
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Profiles
- `GET /api/profiles` - Get all profiles (requires auth)
- `GET /api/profiles/:id` - Get single profile (requires auth)
- `PUT /api/profiles/:id` - Update own profile (requires auth)
- `PUT /api/profiles/:id/status` - Update status (requires auth)
- `PUT /api/profiles/:id/pomodoro` - Start/stop pomodoro (requires auth)

## WebSocket Events

- `status:update` - Broadcast when a user's status changes
- `pomodoro:start` - Broadcast when a pomodoro starts
- `pomodoro:stop` - Broadcast when a pomodoro stops
- `profile:update` - Broadcast when a profile is updated

## Status Colors

- **Home**: Blue
- **Office**: Green
- **Sick**: Red
- **Vacation**: Orange
- **Meeting**: Purple
- **Available**: Gray

