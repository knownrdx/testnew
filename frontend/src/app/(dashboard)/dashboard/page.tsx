'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Wifi, Users, Ticket } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RouterStatusGrid } from '@/components/dashboard/RouterStatusGrid';
import { BandwidthChart } from '@/components/dashboard/BandwidthChart';
import { ActiveSessionsTable } from '@/components/dashboard/ActiveSessionsTable';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['session-stats'],
    queryFn: () => api.get('/sessions/stats').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: superStats } = useQuery({
    queryKey: ['super-stats'],
    queryFn: () => api.get('/superadmin/stats').then((r) => r.data.data),
    enabled: user?.role === 'SUPER_ADMIN',
    refetchInterval: 60_000,
  });

  return (
    <div>
      <Header title="Dashboard" />
      <main className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="Active Sessions"
              value={statsData?.activeSessions ?? 0}
              icon={Activity}
              color="blue"
            />
            <MetricCard
              title="Sessions Today"
              value={statsData?.totalToday ?? 0}
              icon={Users}
              color="green"
            />
            {user?.role === 'SUPER_ADMIN' && (
              <>
                <MetricCard
                  title="Online Routers"
                  value={superStats?.onlineRouters ?? 0}
                  icon={Wifi}
                  color="purple"
                />
                <MetricCard
                  title="Total Hotels"
                  value={superStats?.hotels ?? 0}
                  icon={Ticket}
                  color="orange"
                />
              </>
            )}
          </div>
        )}

        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Router Status</h3>
          <RouterStatusGrid />
        </div>

        <BandwidthChart />
        <ActiveSessionsTable />
      </main>
    </div>
  );
}
