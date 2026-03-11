import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import * as svc from './rooms.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rooms = await svc.listRooms(req.hotelId!);
  res.json({ success: true, data: rooms });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const room = await svc.getRoom(req.params.id, req.hotelId!);
  res.json({ success: true, data: room });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.createRoomSchema.parse(req.body);
  const room = await svc.createRoom(req.hotelId!, data);
  res.status(201).json({ success: true, data: room });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = svc.updateRoomSchema.parse(req.body);
  const room = await svc.updateRoom(req.params.id, req.hotelId!, data);
  res.json({ success: true, data: room });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteRoom(req.params.id, req.hotelId!);
  res.json({ success: true, message: 'Room deleted' });
});

export const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ rooms: z.array(svc.createRoomSchema) });
  const { rooms } = schema.parse(req.body);
  const result = await svc.bulkCreateRooms(req.hotelId!, rooms);
  res.status(201).json({ success: true, data: result });
});

export const listProfiles = asyncHandler(async (req: Request, res: Response) => {
  const profiles = await svc.listBandwidthProfiles(req.hotelId!);
  res.json({ success: true, data: profiles });
});

export const createProfile = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    downloadKbps: z.coerce.number().int().positive(),
    uploadKbps: z.coerce.number().int().positive(),
  });
  const data = schema.parse(req.body);
  const profile = await svc.createBandwidthProfile(req.hotelId!, data);
  res.status(201).json({ success: true, data: profile });
});
