'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wifi, WifiOff, TestTube, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface Router {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  isOnline: boolean;
  lastSeen: string | null;
}

export default function RoutersPage() {
  const { id: hotelId } = useParams<{ id: string }>();
  const [showModal, setShowModal] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { online: boolean; identity?: string }>>({});
  const [form, setForm] = useState({ name: '', host: '', port: '8728', username: 'admin', password: '' });
  const qc = useQueryClient();

  const { data: routers } = useQuery({
    queryKey: ['routers', hotelId],
    queryFn: () => api.get(`/routers?hotelId=${hotelId}`).then((r) => r.data.data as Router[]),
  });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post('/routers', { ...body, hotelId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routers'] }); setShowModal(false); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/routers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routers'] }),
  });

  const testConnection = async (routerId: string) => {
    const { data } = await api.post(`/routers/${routerId}/test`);
    setTestResults((prev) => ({ ...prev, [routerId]: data.data }));
  };

  return (
    <div>
      <Header title="Routers" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">{routers?.length ?? 0} routers</p>
          <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add Router</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routers?.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${r.isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {r.isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.host}:{r.port}</p>
                  </div>
                </div>
                <Badge variant={r.isOnline ? 'success' : 'neutral'}>{r.isOnline ? 'Online' : 'Offline'}</Badge>
              </div>

              {testResults[r.id] && (
                <div className={`text-xs p-2 rounded mb-3 ${testResults[r.id].online ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {testResults[r.id].online ? `Connected: ${testResults[r.id].identity}` : 'Connection failed'}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => testConnection(r.id)}>
                  <TestTube className="w-3.5 h-3.5" /> Test
                </Button>
                <Button variant="danger" size="sm" onClick={() => remove.mutate(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Router">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Host/IP" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Port" type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
            <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Add Router</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
