// Socket.IO client setup
import { io } from 'socket.io-client';

// Initialize Socket.IO connection
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create socket instance
export const socket = io(`${API_URL}/assist`, {
  autoConnect: false,
  withCredentials: true
});

// Connect to socket
export const connectSocket = (sessionId: string) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit('join', sessionId);
  }
};

// Disconnect from socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Listen for events
export const listenToSocket = (
  eventName: string, 
  callback: (...args: any[]) => void
) => {
  socket.on(eventName, callback);
  
  // Return a function to remove the listener
  return () => {
    socket.off(eventName, callback);
  };
};

export default {
  socket,
  connectSocket,
  disconnectSocket,
  listenToSocket
};
