import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler.middleware';
import { validateVoucher, redeemVoucher } from '../vouchers/vouchers.service';
import { addHotspotUser } from '../../services/mikrotik/hotspot.mikrotik';
import { logger } from '../../utils/logger';
interface MikroTikRouter {
  id: string;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
}

export interface PortalAuthRequest {
  hotelSlug: string;
  mac: string;
  ip: string;
  credentials:
    | { type: 'room'; roomNumber: string; guestLastName: string }
    | { type: 'voucher'; code: string };
  linkLogin?: string;
}

export interface PortalAuthResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

export async function portalAuth(req: PortalAuthRequest): Promise<PortalAuthResult> {
  const hotel = await prisma.hotel.findUnique({ where: { slug: req.hotelSlug } });
  if (!hotel) throw new AppError(404, 'Hotel not found');

  const router = await prisma.mikrotikRouter.findFirst({
    where: { hotelId: hotel.id, isOnline: true },
  });

  if (req.credentials.type === 'room') {
    return handleRoomAuth(hotel.id, router, req);
  } else {
    return handleVoucherAuth(hotel.id, router, req);
  }
}

async function handleRoomAuth(
  hotelId: string,
  router: MikroTikRouter | null,
  req: PortalAuthRequest,
): Promise<PortalAuthResult> {
  if (req.credentials.type !== 'room') throw new AppError(400, 'Invalid credentials type');
  const { roomNumber, guestLastName } = req.credentials;

  const room = await prisma.room.findUnique({
    where: { hotelId_number: { hotelId, number: roomNumber } },
    include: { bandwidthProfile: true },
  });
  if (!room) return { success: false, error: 'Room not found' };

  // Find active hotspot user for this room with matching last name
  const usernamePattern = `room${roomNumber}_${guestLastName.toLowerCase().replace(/\s+/g, '')}`;
  const hotspotUser = await prisma.hotspotUser.findFirst({
    where: {
      roomId: room.id,
      isActive: true,
      username: usernamePattern,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!hotspotUser) return { success: false, error: 'No active reservation found' };

  // Add MAC to hotspot user
  if (!hotspotUser.macAddresses.includes(req.mac)) {
    const newMacs = [...hotspotUser.macAddresses, req.mac];
    if (newMacs.length > room.maxDevices) {
      return { success: false, error: `Device limit (${room.maxDevices}) reached` };
    }
    await prisma.hotspotUser.update({
      where: { id: hotspotUser.id },
      data: { macAddresses: newMacs },
    });
  }

  // Log session
  await prisma.wifiSession.create({
    data: {
      hotspotUserId: hotspotUser.id,
      mac: req.mac,
      ip: req.ip,
    },
  });

  logger.info('Portal auth success (room)', { username: usernamePattern, mac: req.mac });

  return {
    success: true,
    redirectUrl: req.linkLogin ?? 'https://google.com',
  };
}

async function handleVoucherAuth(
  hotelId: string,
  router: MikroTikRouter | null,
  req: PortalAuthRequest,
): Promise<PortalAuthResult> {
  if (req.credentials.type !== 'voucher') throw new AppError(400, 'Invalid credentials type');
  const { code } = req.credentials;

  const result = await validateVoucher(hotelId, code);
  if (!result.valid) return { success: false, error: 'Invalid or expired voucher' };

  await redeemVoucher(result.voucherId!);

  // Create a temporary hotspot user for this MAC
  const username = `voucher_${req.mac.replace(/:/g, '').toLowerCase()}`;
  const plainPassword = code;

  if (router) {
    try {
      const profile = result.bandwidthProfileId
        ? `profile-${result.bandwidthProfileId}`
        : undefined;
      await addHotspotUser(router, {
        username,
        password: plainPassword,
        profile,
      });
    } catch (err) {
      logger.error('Failed to add voucher hotspot user', { error: (err as Error).message });
    }
  }

  logger.info('Portal auth success (voucher)', { voucherId: result.voucherId, mac: req.mac });

  return {
    success: true,
    redirectUrl: req.linkLogin ?? 'https://google.com',
  };
}
