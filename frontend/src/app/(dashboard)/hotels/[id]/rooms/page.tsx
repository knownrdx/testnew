'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table, Td, Tr } from '@/components/ui/Table';

interface Room {
  id: string;
  number: string;
  floor: string | null;
  maxDevices: number;
  bandwidthProfile: { name: string } | null;
}

export default function RoomsPage() {
  const { id: hotelId } = useParams<{ id: string }>();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ number: '', floor: '', maxDevices: '3' });
  const qc = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: ['rooms', hotelId],
    queryFn: () => api.get('/rooms', { params: { hotelId } }).then((r) => r.data.data as Room[]),
  });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post('/rooms', { ...body, hotelId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); setShowModal(false); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });

  return (
    <div>
      <Header title="Rooms" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">{rooms?.length ?? 0} rooms</p>
          <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add Room</Button>
        </div>

        <Card padding={false}>
          <Table headers={['Room', 'Floor', 'Max Devices', 'Bandwidth Profile', 'Actions']}>
            {rooms?.map((r) => (
              <Tr key={r.id}>
                <Td className="font-semibold">{r.number}</Td>
                <Td>{r.floor ?? '-'}</Td>
                <Td>{r.maxDevices}</Td>
                <Td>{r.bandwidthProfile?.name ?? 'Default'}</Td>
                <Td>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(r.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      </main>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Room">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <Input label="Room Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
          <Input label="Floor" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          <Input label="Max Devices" type="number" min="1" max="20" value={form.maxDevices}
            onChange={(e) => setForm({ ...form, maxDevices: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Add Room</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
