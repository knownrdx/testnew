import cron from 'node-cron';
import { prisma } from '../../config/database';
import { mikrotikPool } from '../mikrotik/mikrotik.pool';
import { getActiveSessions, getTrafficStats } from '../mikrotik/monitor.mikrotik';
import { emitRouterStatus, emitBandwidthUpdate } from '../socket/socket.handlers';
import { logger } from '../../utils/logger';

interface RouterRow {
  id: string;
  hotelId: string;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
  name: string;
}

async function syncRouterSessions(): Promise<void> {
  const routers = await prisma.mikrotikRouter.findMany({
    where: { isOnline: true },
    select: {
      id: true,
      hotelId: true,
      host: true,
      port: true,
      username: true,
      encryptedPassword: true,
      name: true,
    },
  });

  await Promise.allSettled(
    routers.map(async (router: RouterRow) => {
      try {
        const [sessions, stats] = await Promise.all([
          getActiveSessions(router),
          getTrafficStats(router),
        ]);

        // Update router last seen
        await prisma.mikrotikRouter.update({
          where: { id: router.id },
          data: { isOnline: true, lastSeen: new Date() },
        });

        // Emit real-time events
        emitRouterStatus({
          routerId: router.id,
          hotelId: router.hotelId,
          isOnline: true,
          activeSessions: stats.activeCount,
          bytesIn: stats.bytesIn,
          bytesOut: stats.bytesOut,
        });

        emitBandwidthUpdate(router.hotelId, router.id, {
          bytesIn: stats.bytesIn,
          bytesOut: stats.bytesOut,
          timestamp: Date.now(),
        });

        // Update session bytes in DB
        for (const session of sessions) {
          await prisma.wifiSession.updateMany({
            where: { mac: session.mac, endedAt: null },
            data: { bytesIn: session.bytesIn, bytesOut: session.bytesOut },
          });
        }
      } catch (err) {
        logger.warn(`Router ${router.id} polling failed`, { error: (err as Error).message });

        // Mark as offline
        await prisma.mikrotikRouter.update({
          where: { id: router.id },
          data: { isOnline: false },
        });

        mikrotikPool.remove(router.id);

        emitRouterStatus({
          routerId: router.id,
          hotelId: router.hotelId,
          isOnline: false,
          activeSessions: 0,
          bytesIn: 0,
          bytesOut: 0,
        });
      }
    }),
  );
}

async function expireOldSessions(): Promise<void> {
  // Close sessions for expired hotspot users
  const expiredUsers = await prisma.hotspotUser.findMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
    },
    select: { id: true },
  });

  if (expiredUsers.length > 0) {
    const ids = expiredUsers.map((u: { id: string }) => u.id);

    await prisma.hotspotUser.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false },
    });

    await prisma.wifiSession.updateMany({
      where: { hotspotUserId: { in: ids }, endedAt: null },
      data: { endedAt: new Date() },
    });

    logger.info(`Expired ${expiredUsers.length} hotspot users`);
  }
}

export function startScheduler(): void {
  // Every 30 seconds: sync active sessions + emit status
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await syncRouterSessions();
    } catch (err) {
      logger.error('Session sync job failed', { error: (err as Error).message });
    }
  });

  // Every 5 minutes: expire old sessions
  cron.schedule('*/5 * * * *', async () => {
    try {
      await expireOldSessions();
    } catch (err) {
      logger.error('Session expiry job failed', { error: (err as Error).message });
    }
  });

  logger.info('Scheduler started (session sync: 30s, expiry: 5m)');
}
