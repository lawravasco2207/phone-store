// Socket.IO setup for real-time communication with the AI Sales Assistant
import { Server } from 'socket.io';
import http from 'http';
import app from './index.js';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Namespace for the AI assistant
const assistNamespace = io.of('/assist');

// Handle assistant connections
assistNamespace.on('connection', (socket) => {
  console.log('Client connected to assist namespace');
  
  // Join the client to a room based on their session ID
  socket.on('join', (sessionId) => {
    if (sessionId) {
      socket.join(`assist:${sessionId}`);
      console.log(`Client joined room assist:${sessionId}`);
    }
  });
  
  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected from assist namespace');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for use in other modules
export { io, assistNamespace };
