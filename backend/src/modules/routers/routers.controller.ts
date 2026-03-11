import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as svc from './routers.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const routers = await svc.listRouters(req.hotelId!);
  res.json({ success: true, data: routers });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const router = await svc.getRouter(req.params.id, req.hotelId!);
  res.json({ success: true, data: router });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.createRouterSchema.parse(req.body);
  const router = await svc.createRouter(req.hotelId!, data);
  res.status(201).json({ success: true, data: router });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.updateRouterSchema.parse(req.body);
  const router = await svc.updateRouter(req.params.id, req.hotelId!, data);
  res.json({ success: true, data: router });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteRouter(req.params.id, req.hotelId!);
  res.json({ success: true, message: 'Router deleted' });
});

export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.testRouterConnection(req.params.id, req.hotelId!);
  res.json({ success: true, data: result });
});
