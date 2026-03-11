import { getIO } from '../../config/socket';
import { logger } from '../../utils/logger';

export interface RouterStatusPayload {
  routerId: string;
  hotelId: string;
  isOnline: boolean;
  activeSessions: number;
  bytesIn: number;
  bytesOut: number;
  identity?: string;
}

export interface SessionUpdatePayload {
  hotelId: string;
  session: {
    id: string;
    mac: string;
    ip: string;
    username: string;
    roomNumber: string;
    bytesIn: number;
    bytesOut: number;
    startedAt: string;
  };
}

export function emitRouterStatus(payload: RouterStatusPayload): void {
  try {
    const io = getIO();
    io.to(`hotel:${payload.hotelId}`).emit('router:status', payload);
    io.to(`router:${payload.routerId}`).emit('router:status', payload);
  } catch {
    logger.warn('Socket not ready, skipping router status emit');
  }
}

export function emitBandwidthUpdate(
  hotelId: string,
  routerId: string,
  data: { bytesIn: number; bytesOut: number; timestamp: number },
): void {
  try {
    const io = getIO();
    io.to(`hotel:${hotelId}`).emit('bandwidth:update', { routerId, ...data });
  } catch {
    logger.warn('Socket not ready, skipping bandwidth emit');
  }
}

export function emitSessionNew(payload: SessionUpdatePayload): void {
  try {
    const io = getIO();
    io.to(`hotel:${payload.hotelId}`).emit('session:new', payload.session);
  } catch {
    logger.warn('Socket not ready, skipping session emit');
  }
}
