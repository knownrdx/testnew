'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    socketRef.current = getSocket(accessToken);
    return () => {
      // Don't disconnect on unmount — keep persistent connection
    };
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
}

export function useSocketEvent<T>(
  event: string,
  handler: (data: T) => void,
  deps: unknown[] = [],
) {
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const socket = getSocket(accessToken);
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isAuthenticated, accessToken, ...deps]);
}
