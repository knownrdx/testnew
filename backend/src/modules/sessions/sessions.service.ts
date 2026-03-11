import { prisma } from '../../config/database';
import { z } from 'zod';

interface SessionRow {
  id: string;
  mac: string;
  ip: string | null;
  bytesIn: bigint;
  bytesOut: bigint;
  startedAt: Date;
  endedAt: Date | null;
  hotspotUser: {
    username: string;
    room: { number: string; floor: string | null } | null;
  };
}

export const sessionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  roomNumber: z.string().optional(),
});

export async function listSessions(
  hotelId: string,
  query: z.infer<typeof sessionQuerySchema>,
) {
  const { page, limit, startDate, endDate, roomNumber } = query;
  const skip = (page - 1) * limit;

  // Build where clause through hotspotUser → room
  const where: Record<string, unknown> = {
    hotspotUser: {
      room: {
        hotelId,
        ...(roomNumber ? { number: roomNumber } : {}),
      },
    },
    ...(startDate || endDate
      ? {
          startedAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {}),
  };

  const [sessions, total] = await Promise.all([
    prisma.wifiSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        hotspotUser: {
          select: {
            username: true,
            room: { select: { number: true, floor: true } },
          },
        },
      },
    }),
    prisma.wifiSession.count({ where }),
  ]);

  return { sessions, total, page, limit };
}

export async function getSessionStats(hotelId: string) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [activeSessions, totalToday, bytesResult] = await Promise.all([
    prisma.wifiSession.count({
      where: {
        endedAt: null,
        hotspotUser: { room: { hotelId } },
      },
    }),
    prisma.wifiSession.count({
      where: {
        startedAt: { gte: dayAgo },
        hotspotUser: { room: { hotelId } },
      },
    }),
    prisma.wifiSession.aggregate({
      where: {
        startedAt: { gte: dayAgo },
        hotspotUser: { room: { hotelId } },
      },
      _sum: { bytesIn: true, bytesOut: true },
    }),
  ]);

  return {
    activeSessions,
    totalToday,
    bytesIn: bytesResult._sum.bytesIn ?? BigInt(0),
    bytesOut: bytesResult._sum.bytesOut ?? BigInt(0),
  };
}

export async function exportSessionsCsv(
  hotelId: string,
  query: z.infer<typeof sessionQuerySchema>,
): Promise<string> {
  const { sessions } = await listSessions(hotelId, { ...query, limit: 10000 });

  const header = 'Session ID,Username,Room,MAC,IP,Bytes In,Bytes Out,Started At,Ended At\n';
  const rows = (sessions as SessionRow[])
    .map((s) => {
      const username = s.hotspotUser.username;
      const room = s.hotspotUser.room?.number ?? '';
      return [
        s.id,
        username,
        room,
        s.mac,
        s.ip ?? '',
        s.bytesIn.toString(),
        s.bytesOut.toString(),
        s.startedAt.toISOString(),
        s.endedAt?.toISOString() ?? '',
      ].join(',');
    })
    .join('\n');

  return header + rows;
}
