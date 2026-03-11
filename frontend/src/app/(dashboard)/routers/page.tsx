'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function RoutersRedirect() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.hotelId) {
      router.push(`/hotels/${user.hotelId}/routers`);
    }
  }, [user, router]);

  // For superadmin, show list of all routers
  const { data: hotels } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => api.get('/hotels').then((r) => r.data.data),
    enabled: user?.role === 'SUPER_ADMIN',
  });

  if (user?.hotelId) return null;

  return (
    <div>
      <Header title="Routers" />
      <main className="p-6">
        <p className="text-sm text-gray-500 mb-4">Select a hotel to manage its routers:</p>
        <div className="space-y-2">
          {(hotels ?? []).map((h: { id: string; name: string }) => (
            <Link key={h.id} href={`/hotels/${h.id}/routers`}
              className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              {h.name}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
