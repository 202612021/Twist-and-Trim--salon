import { Server } from 'socket.io';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function broadcastQueueUpdate(payload = {}) {
  if (io) {
    io.emit('queue:updated', payload);
  }
}

export function broadcastTokenCalled(payload) {
  if (io) {
    io.emit('token:called', payload);
    io.emit('queue:updated', payload);
  }
}

export function broadcastBarbersUpdate(payload = {}) {
  if (io) {
    io.emit('barbers:updated', payload);
  }
}

export function broadcastServicesUpdate(payload = {}) {
  if (io) {
    io.emit('services:updated', payload);
  }
}

export function broadcastSettingsUpdate(payload = {}) {
  if (io) {
    io.emit('settings:updated', payload);
  }
}
