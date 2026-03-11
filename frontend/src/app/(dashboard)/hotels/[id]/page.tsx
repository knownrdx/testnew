'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Router, BedDouble, Activity, Ticket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';

const sections = [
  { href: 'routers', label: 'Routers', icon: Router, desc: 'Manage MikroTik routers' },
  { href: 'rooms', label: 'Rooms', icon: BedDouble, desc: 'Configure rooms and bandwidth' },
  { href: 'sessions', label: 'Sessions', icon: Activity, desc: 'View WiFi session logs' },
  { href: 'vouchers', label: 'Vouchers', icon: Ticket, desc: 'Generate and manage vouchers' },
];

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => api.get(`/hotels/${id}`).then((r) => r.data.data),
  });

  return (
    <div>
      <Header title={data?.name ?? 'Hotel'} />
      <main className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={`/hotels/${id}/${href}`}>
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
