export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Client can join a room for specific user updates
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
    });

    // Client can leave a user room
    socket.on('leave:user', (userId) => {
      socket.leave(`user:${userId}`);
    });
  });

  // Store io instance for use in routes
  global.io = io;
};

