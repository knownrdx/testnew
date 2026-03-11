import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler.middleware';
import { z } from 'zod';

export const createHotelAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['MANAGER', 'STAFF']).default('MANAGER'),
  hotelId: z.string(),
});

export async function getAllHotels() {
  return prisma.hotel.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { routers: true, rooms: true, admins: true } },
      portalConfig: { select: { primaryColor: true, logoUrl: true } },
    },
  });
}

export async function getPlatformStats() {
  const [hotels, admins, sessions, routers] = await Promise.all([
    prisma.hotel.count(),
    prisma.hotelAdmin.count(),
    prisma.wifiSession.count({ where: { endedAt: null } }),
    prisma.mikrotikRouter.count({ where: { isOnline: true } }),
  ]);

  return { hotels, admins, activeSessions: sessions, onlineRouters: routers };
}

export async function createHotelAdmin(data: z.infer<typeof createHotelAdminSchema>) {
  const existing = await prisma.hotelAdmin.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.hotelAdmin.create({
    data: {
      hotelId: data.hotelId,
      email: data.email,
      passwordHash,
      role: data.role,
    },
    select: { id: true, email: true, role: true, hotelId: true, createdAt: true },
  });
}

export async function listHotelAdmins(hotelId: string) {
  return prisma.hotelAdmin.findMany({
    where: { hotelId },
    select: { id: true, email: true, role: true, hotelId: true, createdAt: true },
  });
}

export async function deleteHotelAdmin(id: string) {
  const admin = await prisma.hotelAdmin.findUnique({ where: { id } });
  if (!admin) throw new AppError(404, 'Admin not found');
  await prisma.hotelAdmin.delete({ where: { id } });
}

export async function getAuditLogs(hotelId?: string) {
  return prisma.auditLog.findMany({
    where: hotelId ? { hotelId } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      admin: { select: { email: true } },
      hotel: { select: { name: true } },
    },
  });
}
