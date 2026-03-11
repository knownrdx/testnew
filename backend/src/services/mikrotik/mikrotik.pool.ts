import { MikroTikClient, MikroTikConfig } from './mikrotik.client';
import { decrypt } from '../../utils/encryption';
import { logger } from '../../utils/logger';

interface PoolEntry {
  client: MikroTikClient;
  routerId: string;
  lastUsed: number;
}

class MikroTikPool {
  private pool = new Map<string, PoolEntry>();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes idle before cleanup

  getClient(routerId: string): MikroTikClient | undefined {
    return this.pool.get(routerId)?.client;
  }

  async getOrCreate(router: {
    id: string;
    host: string;
    port: number;
    username: string;
    encryptedPassword: string;
  }): Promise<MikroTikClient> {
    const existing = this.pool.get(router.id);
    if (existing?.client.isConnected()) {
      existing.lastUsed = Date.now();
      return existing.client;
    }

    const config: MikroTikConfig = {
      host: router.host,
      port: router.port,
      username: router.username,
      password: decrypt(router.encryptedPassword),
    };

    const client = new MikroTikClient(config);
    await client.connect();

    this.pool.set(router.id, { client, routerId: router.id, lastUsed: Date.now() });
    return client;
  }

  remove(routerId: string): void {
    const entry = this.pool.get(routerId);
    if (entry) {
      entry.client.disconnect().catch(() => {});
      this.pool.delete(routerId);
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, entry] of this.pool.entries()) {
      if (now - entry.lastUsed > this.ttlMs) {
        logger.debug(`Evicting idle MikroTik connection: ${id}`);
        entry.client.disconnect().catch(() => {});
        this.pool.delete(id);
      }
    }
  }

  size(): number {
    return this.pool.size;
  }
}

export const mikrotikPool = new MikroTikPool();

// Cleanup idle connections every 5 minutes
setInterval(() => mikrotikPool.cleanup(), 5 * 60 * 1000);
