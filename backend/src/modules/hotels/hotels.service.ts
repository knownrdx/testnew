import crypto from 'crypto';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler.middleware';
import { z } from 'zod';

export const createHotelSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
});

export const updateHotelSchema = createHotelSchema.partial();

export const portalConfigSchema = z.object({
  logoUrl: z.string().url().optional().nullable(),
  bgImageUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  welcomeText: z.string().max(500).optional(),
  languages: z.array(z.string()).optional(),
});

export async function listHotels() {
  return prisma.hotel.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { routers: true, rooms: true, admins: true } },
      portalConfig: { select: { primaryColor: true, logoUrl: true } },
    },
  });
}

export async function getHotel(id: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      _count: { select: { routers: true, rooms: true, admins: true } },
      portalConfig: true,
      bandwidthProfiles: true,
    },
  });
  if (!hotel) throw new AppError(404, 'Hotel not found');
  return hotel;
}

export async function createHotel(data: z.infer<typeof createHotelSchema>) {
  const existing = await prisma.hotel.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError(409, 'Hotel slug already exists');

  const webhookSecret = crypto.randomBytes(32).toString('hex');

  const hotel = await prisma.hotel.create({
    data: {
      ...data,
      webhookSecret,
      portalConfig: {
        create: {
          primaryColor: data.brandColor ?? '#2563EB',
          languages: ['en'],
        },
      },
    },
    include: { portalConfig: true },
  });
  return hotel;
}

export async function updateHotel(id: string, data: z.infer<typeof updateHotelSchema>) {
  const existing = await prisma.hotel.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Hotel not found');

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await prisma.hotel.findUnique({ where: { slug: data.slug } });
    if (slugTaken) throw new AppError(409, 'Hotel slug already exists');
  }

  return prisma.hotel.update({ where: { id }, data });
}

export async function deleteHotel(id: string) {
  const existing = await prisma.hotel.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Hotel not found');
  await prisma.hotel.delete({ where: { id } });
}

export async function rotateWebhookSecret(id: string) {
  const newSecret = crypto.randomBytes(32).toString('hex');
  await prisma.hotel.update({ where: { id }, data: { webhookSecret: newSecret } });
  return { webhookSecret: newSecret };
}

export async function updatePortalConfig(hotelId: string, data: z.infer<typeof portalConfigSchema>) {
  return prisma.portalConfig.upsert({
    where: { hotelId },
    create: { hotelId, ...data },
    update: data,
  });
}

export async function getPortalConfig(hotelSlug: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { slug: hotelSlug },
    include: { portalConfig: true },
  });
  if (!hotel) throw new AppError(404, 'Hotel not found');
  return {
    hotelId: hotel.id,
    name: hotel.name,
    slug: hotel.slug,
    logo: hotel.logo,
    brandColor: hotel.brandColor,
    portalConfig: hotel.portalConfig,
  };
}
