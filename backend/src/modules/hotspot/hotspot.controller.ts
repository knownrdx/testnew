import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { portalAuth } from './hotspot.service';

const portalAuthSchema = z.object({
  hotelSlug: z.string(),
  mac: z.string().regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/),
  ip: z.string().ip(),
  linkLogin: z.string().url().optional(),
  credentials: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('room'),
      roomNumber: z.string(),
      guestLastName: z.string().min(1),
    }),
    z.object({
      type: z.literal('voucher'),
      code: z.string().min(1),
    }),
  ]),
});

export const auth = asyncHandler(async (req: Request, res: Response) => {
  const data = portalAuthSchema.parse(req.body);
  const result = await portalAuth(data);

  if (result.success) {
    res.json({ success: true, data: { redirectUrl: result.redirectUrl } });
  } else {
    res.status(401).json({ success: false, error: result.error });
  }
});
