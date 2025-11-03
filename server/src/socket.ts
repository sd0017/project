import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';

let io: IOServer | null = null;

export function initSocket(server: HttpServer) {
  if (io) return io;
  io = new IOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('🔌 Socket connected:', socket.id);
    socket.on('disconnect', () => console.log('🔌 Socket disconnected:', socket.id));
  });

  return io;
}

export function getIo() {
  if (!io) {
    console.warn('Socket.IO not initialized yet. Call initSocket(server) first.');
  }
  return io;
}
