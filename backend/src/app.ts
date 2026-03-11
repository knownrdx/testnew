import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler.middleware';
import { logger } from './utils/logger';

// Routers
import authRouter from './modules/auth/auth.router';
import hotelsRouter from './modules/hotels/hotels.router';
import routersRouter from './modules/routers/routers.router';
import roomsRouter from './modules/rooms/rooms.router';
import pmsRouter from './modules/pms/pms.router';
import vouchersRouter from './modules/vouchers/vouchers.router';
import hotspotRouter from './modules/hotspot/hotspot.router';
import sessionsRouter from './modules/sessions/sessions.router';
import superadminRouter from './modules/superadmin/superadmin.router';

export function createApp(): express.Application {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  const api = '/api';
  app.use(`${api}/auth`, authRouter);
  app.use(`${api}/hotels`, hotelsRouter);
  app.use(`${api}/routers`, routersRouter);
  app.use(`${api}/rooms`, roomsRouter);
  app.use(`${api}/vouchers`, vouchersRouter);
  app.use(`${api}/portal`, hotspotRouter);
  app.use(`${api}/sessions`, sessionsRouter);
  app.use(`${api}/superadmin`, superadminRouter);

  // PMS webhook (has its own sub-paths)
  app.use(`${api}`, pmsRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
