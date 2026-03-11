import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as svc from './sessions.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = svc.sessionQuerySchema.parse(req.query);
  const result = await svc.listSessions(req.hotelId!, query);
  res.json({ success: true, data: result });
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.getSessionStats(req.hotelId!);
  // Convert BigInt to string for JSON serialization
  res.json({
    success: true,
    data: {
      ...result,
      bytesIn: result.bytesIn.toString(),
      bytesOut: result.bytesOut.toString(),
    },
  });
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const query = svc.sessionQuerySchema.parse(req.query);
  const csv = await svc.exportSessionsCsv(req.hotelId!, query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sessions.csv"');
  res.send(csv);
});
