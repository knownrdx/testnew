import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from '../utils/logger';
import type { JwtPayload } from '../middleware/auth.middleware';

let io: SocketServer;

export function initSocketIO(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
    },
  });

  // JWT auth middleware for Socket.IO
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (socket as Socket & { user?: JwtPayload }).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as Socket & { user?: JwtPayload }).user;
    logger.debug('Socket connected', { socketId: socket.id, userId: user?.sub });

    // Join hotel room automatically
    if (user?.hotelId) {
      socket.join(`hotel:${user.hotelId}`);
    }
    if (user?.role === 'SUPER_ADMIN') {
      socket.join('superadmin');
    }

    socket.on('join:router', (routerId: string) => {
      socket.join(`router:${routerId}`);
    });

    socket.on('leave:router', (routerId: string) => {
      socket.leave(`router:${routerId}`);
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { socketId: socket.id });
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
