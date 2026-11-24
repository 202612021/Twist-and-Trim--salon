import { io, Socket } from 'socket.io-client';

// Use same host or default to port 5000 in dev
const SOCKET_URL = window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
});
