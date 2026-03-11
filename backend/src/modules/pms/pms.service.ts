import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler.middleware';
import { mikrotikPool } from '../../services/mikrotik/mikrotik.pool';
import { addHotspotUser, disableHotspotUser } from '../../services/mikrotik/hotspot.mikrotik';
import { logger } from '../../utils/logger';

export interface PmsCheckInPayload {
  event: 'checkin';
  roomNumber: string;
  guestLastName: string;
  checkoutTime: string; // ISO 8601
}

export interface PmsCheckOutPayload {
  event: 'checkout';
  roomNumber: string;
  guestLastName?: string;
}

export type PmsPayload = PmsCheckInPayload | PmsCheckOutPayload;

export function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  const sigBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
  const expBuffer = Buffer.from(expected, 'hex');
  if (sigBuffer.length !== expBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expBuffer);
}

export async function processCheckIn(
  hotelId: string,
  payload: PmsCheckInPayload,
): Promise<void> {
  const { roomNumber, guestLastName, checkoutTime } = payload;
  const expiresAt = new Date(checkoutTime);

  // Find hotel's first online router
  const router = await prisma.mikrotikRouter.findFirst({
    where: { hotelId, isOnline: true },
  });

  // Find room config
  const room = await prisma.room.findUnique({
    where: { hotelId_number: { hotelId, number: roomNumber } },
    include: { bandwidthProfile: true },
  });

  const username = `room${roomNumber}_${guestLastName.toLowerCase().replace(/\s+/g, '')}`;
  const plainPassword = crypto.randomBytes(8).toString('hex');
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const hotspotUser = await prisma.hotspotUser.create({
    data: {
      routerId: router?.id ?? 'no-router',
      roomId: room?.id,
      username,
      passwordHash,
      macAddresses: [],
      expiresAt,
      isActive: true,
    },
  });

  if (router) {
    try {
      const profile = room?.bandwidthProfile
        ? `profile-${room.bandwidthProfile.id}`
        : undefined;
      await addHotspotUser(router, {
        username,
        password: plainPassword,
        profile,
        expiresAt,
        comment: `PMS: ${guestLastName} room ${roomNumber}`,
      });
      logger.info('Hotspot user created via PMS checkin', { username, roomNumber });
    } catch (err) {
      logger.error('Failed to add hotspot user to MikroTik', {
        username,
        error: (err as Error).message,
      });
    }
  }
}

export async function processCheckOut(
  hotelId: string,
  payload: PmsCheckOutPayload,
): Promise<void> {
  const { roomNumber, guestLastName } = payload;

  const router = await prisma.mikrotikRouter.findFirst({
    where: { hotelId, isOnline: true },
  });

  // Find active hotspot users for this room
  const room = await prisma.room.findUnique({
    where: { hotelId_number: { hotelId, number: roomNumber } },
  });

  if (room) {
    const users = await prisma.hotspotUser.findMany({
      where: { roomId: room.id, isActive: true },
    });

    for (const user of users) {
      await prisma.hotspotUser.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      if (router) {
        try {
          await disableHotspotUser(router, user.username);
          logger.info('Hotspot user disabled via PMS checkout', {
            username: user.username,
            roomNumber,
          });
        } catch (err) {
          logger.error('Failed to disable hotspot user on MikroTik', {
            username: user.username,
            error: (err as Error).message,
          });
        }
      }
    }
  }
}

export async function logPmsEvent(
  hotelId: string,
  type: 'CHECKIN' | 'CHECKOUT',
  payload: PmsPayload,
  guestName?: string,
  roomNumber?: string,
): Promise<void> {
  await prisma.pmsEvent.create({
    data: {
      hotelId,
      type,
      guestName,
      roomNumber,
      rawPayload: payload as object,
      processedAt: new Date(),
    },
  });
}
