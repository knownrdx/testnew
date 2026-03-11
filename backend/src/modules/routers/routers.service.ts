import { prisma } from '../../config/database';
import { encrypt, decrypt } from '../../utils/encryption';
import { mikrotikPool } from '../../services/mikrotik/mikrotik.pool';
import { MikroTikClient } from '../../services/mikrotik/mikrotik.client';
import { AppError } from '../../middleware/errorHandler.middleware';
import { z } from 'zod';

export const createRouterSchema = z.object({
  name: z.string().min(1).max(100),
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535).default(8728),
  username: z.string().min(1),
  password: z.string().min(1),
});

export const updateRouterSchema = createRouterSchema.partial().omit({ password: true }).extend({
  password: z.string().min(1).optional(),
});

export async function listRouters(hotelId: string) {
  return prisma.mikrotikRouter.findMany({
    where: { hotelId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      hotelId: true,
      name: true,
      host: true,
      port: true,
      username: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getRouter(id: string, hotelId: string) {
  const router = await prisma.mikrotikRouter.findFirst({
    where: { id, hotelId },
    select: {
      id: true,
      hotelId: true,
      name: true,
      host: true,
      port: true,
      username: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!router) throw new AppError(404, 'Router not found');
  return router;
}

export async function createRouter(hotelId: string, data: z.infer<typeof createRouterSchema>) {
  const encryptedPassword = encrypt(data.password);
  return prisma.mikrotikRouter.create({
    data: {
      hotelId,
      name: data.name,
      host: data.host,
      port: data.port,
      username: data.username,
      encryptedPassword,
    },
    select: {
      id: true, hotelId: true, name: true, host: true, port: true,
      username: true, isOnline: true, lastSeen: true, createdAt: true, updatedAt: true,
    },
  });
}

export async function updateRouter(
  id: string,
  hotelId: string,
  data: z.infer<typeof updateRouterSchema>,
) {
  const existing = await prisma.mikrotikRouter.findFirst({ where: { id, hotelId } });
  if (!existing) throw new AppError(404, 'Router not found');

  const updateData: Record<string, unknown> = {
    name: data.name,
    host: data.host,
    port: data.port,
    username: data.username,
  };
  if (data.password) {
    updateData.encryptedPassword = encrypt(data.password);
    mikrotikPool.remove(id); // Force reconnect with new creds
  }

  return prisma.mikrotikRouter.update({
    where: { id },
    data: updateData,
    select: {
      id: true, hotelId: true, name: true, host: true, port: true,
      username: true, isOnline: true, lastSeen: true, createdAt: true, updatedAt: true,
    },
  });
}

export async function deleteRouter(id: string, hotelId: string) {
  const existing = await prisma.mikrotikRouter.findFirst({ where: { id, hotelId } });
  if (!existing) throw new AppError(404, 'Router not found');
  mikrotikPool.remove(id);
  await prisma.mikrotikRouter.delete({ where: { id } });
}

export async function testRouterConnection(
  id: string,
  hotelId: string,
): Promise<{ online: boolean; identity?: string; error?: string }> {
  const router = await prisma.mikrotikRouter.findFirst({ where: { id, hotelId } });
  if (!router) throw new AppError(404, 'Router not found');

  try {
    const password = decrypt(router.encryptedPassword);
    const client = new MikroTikClient({
      host: router.host,
      port: router.port,
      username: router.username,
      password,
    });
    await client.connect();
    const identity = await client.getIdentity();
    await client.disconnect();

    await prisma.mikrotikRouter.update({
      where: { id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    return { online: true, identity };
  } catch (err) {
    await prisma.mikrotikRouter.update({ where: { id }, data: { isOnline: false } });
    return { online: false, error: (err as Error).message };
  }
}
