'use client';

import { Router, Wifi, WifiOff, Users } from 'lucide-react';
import { useRouterStatus } from '@/hooks/useRouterStatus';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function RouterStatusGrid() {
  const { routerStatuses } = useRouterStatus();

  if (routerStatuses.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Router className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No router data yet. Add a router and wait for status updates.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {routerStatuses.map((router) => (
        <Card key={router.routerId} className="relative">
          <div className="absolute top-4 right-4">
            <Badge variant={router.isOnline ? 'success' : 'error'}>
              {router.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${router.isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
              {router.isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{router.routerId}</p>
              <p className="text-xs text-gray-500">Router</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <Users className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold">{router.activeSessions}</p>
              <p className="text-xs text-gray-500">Sessions</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600 mb-1">↓ In</p>
              <p className="text-sm font-bold">{formatBytes(router.bytesIn)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-orange-600 mb-1">↑ Out</p>
              <p className="text-sm font-bold">{formatBytes(router.bytesOut)}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
