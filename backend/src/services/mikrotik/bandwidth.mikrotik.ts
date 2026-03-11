import { mikrotikPool } from './mikrotik.pool';

interface RouterLike {
  id: string;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
}
interface BandwidthProfileLike {
  id: string;
  name: string;
  downloadKbps: number;
  uploadKbps: number;
}
type MikroTikRouter = RouterLike;
type BandwidthProfile = BandwidthProfileLike;

export function buildRateLimit(profile: BandwidthProfile): string {
  const dl = Math.round(profile.downloadKbps / 1024);
  const ul = Math.round(profile.uploadKbps / 1024);
  return `${dl}M/${ul}M`;
}

export async function syncProfile(
  router: MikroTikRouter,
  profile: BandwidthProfile,
): Promise<void> {
  const client = await mikrotikPool.getOrCreate(router);
  const rateLimit = buildRateLimit(profile);
  await client.upsertHotspotProfile({
    name: `profile-${profile.id}`,
    rateLimit,
  });
}

export async function syncAllProfiles(
  router: MikroTikRouter,
  profiles: BandwidthProfile[],
): Promise<void> {
  await Promise.allSettled(profiles.map((p) => syncProfile(router, p)));
}
