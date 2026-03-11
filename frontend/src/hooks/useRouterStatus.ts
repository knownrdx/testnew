'use client';

import { useState, useCallback } from 'react';
import { useSocketEvent } from './useSocket';

export interface RouterStatus {
  routerId: string;
  hotelId: string;
  isOnline: boolean;
  activeSessions: number;
  bytesIn: number;
  bytesOut: number;
  lastUpdated: number;
}

export interface BandwidthPoint {
  timestamp: number;
  bytesIn: number;
  bytesOut: number;
  routerId: string;
}

const BUFFER_SIZE = 60;

export function useRouterStatus() {
  const [routerStatuses, setRouterStatuses] = useState<Map<string, RouterStatus>>(new Map());
  const [bandwidthHistory, setBandwidthHistory] = useState<BandwidthPoint[]>([]);

  const handleRouterStatus = useCallback((data: RouterStatus) => {
    setRouterStatuses((prev) => {
      const next = new Map(prev);
      next.set(data.routerId, { ...data, lastUpdated: Date.now() });
      return next;
    });
  }, []);

  const handleBandwidthUpdate = useCallback(
    (data: { routerId: string; bytesIn: number; bytesOut: number; timestamp: number }) => {
      setBandwidthHistory((prev) => {
        const next = [...prev, data].slice(-BUFFER_SIZE);
        return next;
      });
    },
    [],
  );

  useSocketEvent<RouterStatus>('router:status', handleRouterStatus);
  useSocketEvent<BandwidthPoint>('bandwidth:update', handleBandwidthUpdate);

  return {
    routerStatuses: Array.from(routerStatuses.values()),
    bandwidthHistory,
  };
}
