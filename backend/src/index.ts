import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { initSocketIO } from './config/socket';
import { startScheduler } from './services/scheduler/session.job';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  // Connect to database
  await prisma.$connect();
  logger.info('Database connected');

  const app = createApp();
  const httpServer = http.createServer(app);

  // Attach Socket.IO
  initSocketIO(httpServer);
  logger.info('Socket.IO initialized');

  // Start background jobs
  startScheduler();

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    httpServer.close(async () => {
      await prisma.$disconnect();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Fatal startup error', { error: err.message });
  process.exit(1);
});
