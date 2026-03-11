import { mikrotikPool } from './mikrotik.pool';

interface RouterLike {
  id: string;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
}
type MikroTikRouter = RouterLike;

export async function addHotspotUser(
  router: MikroTikRouter,
  params: {
    username: string;
    password: string;
    profile?: string;
    expiresAt?: Date;
    comment?: string;
  },
): Promise<void> {
  const client = await mikrotikPool.getOrCreate(router);

  let limitUptime: string | undefined;
  if (params.expiresAt) {
    const ms = params.expiresAt.getTime() - Date.now();
    if (ms > 0) {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      limitUptime = `${hours}h${minutes}m${seconds}s`;
    }
  }

  await client.addHotspotUser({
    username: params.username,
    password: params.password,
    profile: params.profile,
    limitUptime,
    comment: params.comment,
  });
}

export async function disableHotspotUser(router: MikroTikRouter, username: string): Promise<void> {
  const client = await mikrotikPool.getOrCreate(router);
  await client.disableHotspotUser(username);
}

export async function removeHotspotUser(router: MikroTikRouter, username: string): Promise<void> {
  const client = await mikrotikPool.getOrCreate(router);
  await client.removeHotspotUser(username);
}
