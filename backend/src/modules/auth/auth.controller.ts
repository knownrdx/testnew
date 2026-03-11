import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { login, refreshTokens } from './auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await login(email, password);
  res.json({ success: true, data: result });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const tokens = refreshTokens(refreshToken);
  res.json({ success: true, data: tokens });
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  // Client discards tokens; add to blacklist via Redis here if needed
  res.json({ success: true, message: 'Logged out' });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});
