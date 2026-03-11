import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as svc from './superadmin.service';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await svc.getPlatformStats();
  res.json({ success: true, data: stats });
});

export const listHotels = asyncHandler(async (_req: Request, res: Response) => {
  const hotels = await svc.getAllHotels();
  res.json({ success: true, data: hotels });
});

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.createHotelAdminSchema.parse(req.body);
  const admin = await svc.createHotelAdmin(data);
  res.status(201).json({ success: true, data: admin });
});

export const listAdmins = asyncHandler(async (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const admins = await svc.listHotelAdmins(hotelId);
  res.json({ success: true, data: admins });
});

export const deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteHotelAdmin(req.params.id);
  res.json({ success: true, message: 'Admin deleted' });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await svc.getAuditLogs(req.query.hotelId as string | undefined);
  res.json({ success: true, data: logs });
});
