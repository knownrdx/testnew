import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler.middleware';
import type { JwtPayload } from '../../middleware/auth.middleware';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    hotelId?: string;
  };
}

function signAccess(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function signRefresh(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function loginSuperAdmin(email: string, password: string): Promise<LoginResult> {
  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const base: Omit<JwtPayload, 'type'> = {
    sub: admin.id,
    email: admin.email,
    role: 'SUPER_ADMIN',
  };

  return {
    accessToken: signAccess(base),
    refreshToken: signRefresh(base),
    user: { id: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
  };
}

export async function loginHotelAdmin(email: string, password: string): Promise<LoginResult> {
  const admin = await prisma.hotelAdmin.findUnique({ where: { email } });
  if (!admin) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const base: Omit<JwtPayload, 'type'> = {
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    hotelId: admin.hotelId,
  };

  return {
    accessToken: signAccess(base),
    refreshToken: signRefresh(base),
    user: { id: admin.id, email: admin.email, role: admin.role, hotelId: admin.hotelId },
  };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  // Try superadmin first, then hotel admin
  const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
  if (superAdmin) {
    return loginSuperAdmin(email, password);
  }
  return loginHotelAdmin(email, password);
}

export function refreshTokens(refreshToken: string): { accessToken: string; refreshToken: string } {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new AppError(401, 'Invalid token type');
  }

  const base: Omit<JwtPayload, 'type'> = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    hotelId: payload.hotelId,
  };

  return {
    accessToken: signAccess(base),
    refreshToken: signRefresh(base),
  };
}
