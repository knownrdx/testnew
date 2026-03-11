import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';

export function attachTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError(401, 'Not authenticated'));
    return;
  }

  if (req.user.role === 'SUPER_ADMIN') {
    // SuperAdmin can optionally scope to a hotel via query param or body
    req.hotelId = (req.query.hotelId as string) || req.body?.hotelId;
  } else {
    if (!req.user.hotelId) {
      next(new AppError(403, 'No hotel context'));
      return;
    }
    req.hotelId = req.user.hotelId;
  }

  next();
}
