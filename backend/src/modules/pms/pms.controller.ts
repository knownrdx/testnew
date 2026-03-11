import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../middleware/errorHandler.middleware';
import { prisma } from '../../config/database';
import {
  verifyHmacSignature,
  processCheckIn,
  processCheckOut,
  logPmsEvent,
  PmsPayload,
} from './pms.service';
import { logger } from '../../utils/logger';

const pmsPayloadSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('checkin'),
    roomNumber: z.string(),
    guestLastName: z.string(),
    checkoutTime: z.string().datetime(),
  }),
  z.object({
    event: z.literal('checkout'),
    roomNumber: z.string(),
    guestLastName: z.string().optional(),
  }),
]);

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { hotelSlug } = req.params;

  const hotel = await prisma.hotel.findUnique({ where: { slug: hotelSlug } });
  if (!hotel) throw new AppError(404, 'Hotel not found');

  // Verify HMAC signature
  const signature = req.headers['x-webhook-signature'] as string;
  if (!signature) throw new AppError(401, 'Missing webhook signature');

  const rawBody = JSON.stringify(req.body);
  const valid = verifyHmacSignature(rawBody, signature, hotel.webhookSecret);
  if (!valid) throw new AppError(401, 'Invalid webhook signature');

  const payload = pmsPayloadSchema.parse(req.body) as PmsPayload;

  logger.info('PMS webhook received', { hotelSlug, event: payload.event });

  if (payload.event === 'checkin') {
    await processCheckIn(hotel.id, payload);
    await logPmsEvent(hotel.id, 'CHECKIN', payload, payload.guestLastName, payload.roomNumber);
  } else {
    await processCheckOut(hotel.id, payload);
    await logPmsEvent(
      hotel.id,
      'CHECKOUT',
      payload,
      payload.guestLastName,
      payload.roomNumber,
    );
  }

  res.json({ success: true, message: `${payload.event} processed` });
});

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  const events = await prisma.pmsEvent.findMany({
    where: { hotelId: hotelId as string },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: events });
});
