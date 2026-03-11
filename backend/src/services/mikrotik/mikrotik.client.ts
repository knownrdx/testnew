import { RouterOSAPI } from 'node-routeros';
import { logger } from '../../utils/logger';

export interface MikroTikConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface HotspotActiveSession {
  id: string;
  user: string;
  mac: string;
  ip: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
}

export class MikroTikClient {
  private api: RouterOSAPI;
  private config: MikroTikConfig;
  private connected = false;

  constructor(config: MikroTikConfig) {
    this.config = config;
    this.api = new RouterOSAPI({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      timeout: 10,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.api.connect();
    this.connected = true;
    logger.debug(`MikroTik connected: ${this.config.host}`);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.api.close();
    this.connected = false;
  }

  async getIdentity(): Promise<string> {
    await this.connect();
    const result = await this.api.write('/system/identity/print');
    return (result[0] as { name: string })?.name ?? 'Unknown';
  }

  async addHotspotUser(params: {
    username: string;
    password: string;
    profile?: string;
    limitUptime?: string;
    comment?: string;
  }): Promise<void> {
    await this.connect();
    const cmd: Record<string, string> = {
      name: params.username,
      password: params.password,
    };
    if (params.profile) cmd.profile = params.profile;
    if (params.limitUptime) cmd['limit-uptime'] = params.limitUptime;
    if (params.comment) cmd.comment = params.comment;

    await this.api.write('/ip/hotspot/user/add', Object.entries(cmd).map(([k, v]) => `=${k}=${v}`));
  }

  async disableHotspotUser(username: string): Promise<void> {
    await this.connect();
    const users = await this.api.write('/ip/hotspot/user/print', [`?name=${username}`]);
    if (!users.length) return;

    const id = (users[0] as { '.id': string })['.id'];
    await this.api.write('/ip/hotspot/user/set', [`=.id=${id}`, '=disabled=yes']);
  }

  async removeHotspotUser(username: string): Promise<void> {
    await this.connect();
    const users = await this.api.write('/ip/hotspot/user/print', [`?name=${username}`]);
    if (!users.length) return;

    const id = (users[0] as { '.id': string })['.id'];
    await this.api.write('/ip/hotspot/user/remove', [`=.id=${id}`]);
  }

  async getActiveSessions(): Promise<HotspotActiveSession[]> {
    await this.connect();
    const raw = await this.api.write('/ip/hotspot/active/print');
    return (raw as Array<Record<string, string>>).map((s) => ({
      id: s['.id'] ?? '',
      user: s.user ?? '',
      mac: s['mac-address'] ?? '',
      ip: s.address ?? '',
      uptime: s.uptime ?? '',
      bytesIn: parseInt(s['bytes-in'] ?? '0', 10),
      bytesOut: parseInt(s['bytes-out'] ?? '0', 10),
    }));
  }

  async getTrafficStats(): Promise<{ bytesIn: number; bytesOut: number }> {
    await this.connect();
    const sessions = await this.getActiveSessions();
    return sessions.reduce(
      (acc, s) => ({ bytesIn: acc.bytesIn + s.bytesIn, bytesOut: acc.bytesOut + s.bytesOut }),
      { bytesIn: 0, bytesOut: 0 },
    );
  }

  async upsertHotspotProfile(params: {
    name: string;
    rateLimit: string; // e.g. "10M/5M"
  }): Promise<void> {
    await this.connect();
    const profiles = await this.api.write('/ip/hotspot/user/profile/print', [
      `?name=${params.name}`,
    ]);

    if (profiles.length) {
      const id = (profiles[0] as { '.id': string })['.id'];
      await this.api.write('/ip/hotspot/user/profile/set', [
        `=.id=${id}`,
        `=rate-limit=${params.rateLimit}`,
      ]);
    } else {
      await this.api.write('/ip/hotspot/user/profile/add', [
        `=name=${params.name}`,
        `=rate-limit=${params.rateLimit}`,
      ]);
    }
  }

  async authorizeByMac(mac: string): Promise<void> {
    await this.connect();
    await this.api.write('/ip/hotspot/host/make-binding', [`=mac-address=${mac}`]);
  }

  isConnected(): boolean {
    return this.connected;
  }
}
