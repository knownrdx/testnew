'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Hotel, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface HotelData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  brandColor: string;
  _count: { routers: number; rooms: number; admins: number };
}

export default function HotelsPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => api.get('/hotels').then((r) => r.data.data as HotelData[]),
  });

  const create = useMutation({
    mutationFn: (body: { name: string; slug: string }) => api.post('/hotels', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotels'] });
      setShowModal(false);
      setForm({ name: '', slug: '' });
    },
  });

  return (
    <div>
      <Header title="Hotels" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{data?.length ?? 0} hotels</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Add Hotel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.map((hotel) => (
            <Card key={hotel.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: hotel.brandColor + '20' }}
                  >
                    <Hotel className="w-5 h-5" style={{ color: hotel.brandColor }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{hotel.name}</p>
                    <p className="text-xs text-gray-500">{hotel.slug}</p>
                  </div>
                </div>
                <Badge variant="info">{hotel.plan}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm mt-4 mb-4">
                <div>
                  <p className="font-bold text-gray-900">{hotel._count.routers}</p>
                  <p className="text-xs text-gray-500">Routers</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{hotel._count.rooms}</p>
                  <p className="text-xs text-gray-500">Rooms</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{hotel._count.admins}</p>
                  <p className="text-xs text-gray-500">Admins</p>
                </div>
              </div>

              <Link href={`/hotels/${hotel.id}`}>
                <Button variant="secondary" size="sm" className="w-full">
                  <ExternalLink className="w-3.5 h-3.5" /> Manage
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </main>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Hotel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form);
          }}
          className="space-y-4"
        >
          <Input
            label="Hotel Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            helperText="Used in URLs and webhooks (e.g. grand-hotel)"
            required
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create Hotel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
