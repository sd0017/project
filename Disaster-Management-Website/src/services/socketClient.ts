import { backendManager } from '../config/backend-integration';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocketClient() {
  if (socket) return socket;

  const apiBase = backendManager.getCurrentBackend().baseUrl;
  // Derive socket URL from base (remove trailing /api if present)
  const socketUrl = apiBase.replace(/\/api\/?$/, '') || window.location.origin;

  socket = io(socketUrl, {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => console.log('Socket connected (client):', socket?.id));
  socket.on('disconnect', () => console.log('Socket disconnected (client)'));

  return socket;
}

export function getSocket() {
  return socket;
}
