import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as svc from './hotels.service';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const hotels = await svc.listHotels();
  res.json({ success: true, data: hotels });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const hotel = await svc.getHotel(req.params.id);
  res.json({ success: true, data: hotel });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.createHotelSchema.parse(req.body);
  const hotel = await svc.createHotel(data);
  res.status(201).json({ success: true, data: hotel });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.updateHotelSchema.parse(req.body);
  const hotel = await svc.updateHotel(req.params.id, data);
  res.json({ success: true, data: hotel });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteHotel(req.params.id);
  res.json({ success: true, message: 'Hotel deleted' });
});

export const rotateSecret = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.rotateWebhookSecret(req.params.id);
  res.json({ success: true, data: result });
});

export const updatePortalConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.portalConfigSchema.parse(req.body);
  const config = await svc.updatePortalConfig(req.params.id, data);
  res.json({ success: true, data: config });
});

export const getPortalConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await svc.getPortalConfig(req.params.slug);
  res.json({ success: true, data: config });
});
