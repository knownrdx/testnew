import { mikrotikPool } from './mikrotik.pool';
import type { HotspotActiveSession } from './mikrotik.client';

interface RouterConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
}

export async function getActiveSessions(
  router: RouterConfig,
): Promise<HotspotActiveSession[]> {
  const client = await mikrotikPool.getOrCreate(router);
  return client.getActiveSessions();
}

export async function getTrafficStats(
  router: RouterConfig,
): Promise<{ bytesIn: number; bytesOut: number; activeCount: number }> {
  const client = await mikrotikPool.getOrCreate(router);
  const sessions = await client.getActiveSessions();
  return sessions.reduce(
    (acc, s) => ({
      bytesIn: acc.bytesIn + s.bytesIn,
      bytesOut: acc.bytesOut + s.bytesOut,
      activeCount: acc.activeCount + 1,
    }),
    { bytesIn: 0, bytesOut: 0, activeCount: 0 },
  );
}
