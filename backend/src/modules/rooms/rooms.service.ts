import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler.middleware';
import { z } from 'zod';

export const createRoomSchema = z.object({
  number: z.string().min(1).max(20),
  floor: z.string().max(10).optional(),
  maxDevices: z.coerce.number().int().min(1).max(20).default(3),
  bandwidthProfileId: z.string().optional().nullable(),
});

export const updateRoomSchema = createRoomSchema.partial();

export async function listRooms(hotelId: string) {
  return prisma.room.findMany({
    where: { hotelId },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    include: { bandwidthProfile: true },
  });
}

export async function getRoom(id: string, hotelId: string) {
  const room = await prisma.room.findFirst({
    where: { id, hotelId },
    include: { bandwidthProfile: true },
  });
  if (!room) throw new AppError(404, 'Room not found');
  return room;
}

export async function createRoom(hotelId: string, data: z.infer<typeof createRoomSchema>) {
  const existing = await prisma.room.findUnique({
    where: { hotelId_number: { hotelId, number: data.number } },
  });
  if (existing) throw new AppError(409, 'Room number already exists');

  return prisma.room.create({
    data: { hotelId, ...data },
    include: { bandwidthProfile: true },
  });
}

export async function updateRoom(id: string, hotelId: string, data: z.infer<typeof updateRoomSchema>) {
  const existing = await prisma.room.findFirst({ where: { id, hotelId } });
  if (!existing) throw new AppError(404, 'Room not found');

  return prisma.room.update({
    where: { id },
    data,
    include: { bandwidthProfile: true },
  });
}

export async function deleteRoom(id: string, hotelId: string) {
  const existing = await prisma.room.findFirst({ where: { id, hotelId } });
  if (!existing) throw new AppError(404, 'Room not found');
  await prisma.room.delete({ where: { id } });
}

export async function bulkCreateRooms(
  hotelId: string,
  rooms: z.infer<typeof createRoomSchema>[],
) {
  return prisma.room.createMany({
    data: rooms.map((r) => ({ hotelId, ...r })),
    skipDuplicates: true,
  });
}

export async function listBandwidthProfiles(hotelId: string) {
  return prisma.bandwidthProfile.findMany({ where: { hotelId } });
}

export async function createBandwidthProfile(
  hotelId: string,
  data: { name: string; downloadKbps: number; uploadKbps: number },
) {
  return prisma.bandwidthProfile.create({ data: { hotelId, ...data } });
}
