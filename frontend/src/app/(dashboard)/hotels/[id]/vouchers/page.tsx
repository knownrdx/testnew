'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Printer, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, Td, Tr } from '@/components/ui/Table';

interface Voucher {
  id: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface GeneratedVoucher extends Voucher {
  code: string;
}

export default function VouchersPage() {
  const { id: hotelId } = useParams<{ id: string }>();
  const [showGenModal, setShowGenModal] = useState(false);
  const [generated, setGenerated] = useState<GeneratedVoucher[]>([]);
  const [form, setForm] = useState({ count: '10', maxUses: '1', expiresAt: '' });
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['vouchers', hotelId],
    queryFn: () =>
      api.get('/vouchers', { params: { hotelId } }).then((r) => r.data.data),
  });

  const generate = useMutation({
    mutationFn: (body: { count: number; maxUses: number; expiresAt?: string }) =>
      api.post('/vouchers/generate', { ...body, hotelId }),
    onSuccess: (res) => {
      setGenerated(res.data.data);
      qc.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/vouchers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
  });

  const printPdf = async () => {
    const response = await api.post(
      '/vouchers/export-pdf',
      { codes: generated },
      { responseType: 'blob' },
    );
    const url = URL.createObjectURL(response.data);
    window.open(url, '_blank');
  };

  return (
    <div>
      <Header title="Vouchers" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">{data?.total ?? 0} vouchers</p>
          <Button onClick={() => setShowGenModal(true)}>
            <Plus className="w-4 h-4" /> Generate Vouchers
          </Button>
        </div>

        {generated.length > 0 && (
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold text-sm">Generated Codes (save these — shown once!)</p>
              <Button variant="secondary" size="sm" onClick={printPdf}>
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {generated.map((v) => (
                <div key={v.id} className="bg-gray-50 rounded-lg p-3 text-center font-mono text-sm font-bold tracking-widest">
                  {v.code}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card padding={false}>
          <Table headers={['ID', 'Uses', 'Expires', 'Status', 'Created', 'Actions']}>
            {data?.vouchers?.map((v: Voucher) => (
              <Tr key={v.id}>
                <Td className="font-mono text-xs">{v.id.slice(0, 8)}...</Td>
                <Td>{v.usedCount}/{v.maxUses}</Td>
                <Td className="text-xs">{v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : 'Never'}</Td>
                <Td><Badge variant={v.isActive ? 'success' : 'neutral'}>{v.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                <Td className="text-xs">{new Date(v.createdAt).toLocaleDateString()}</Td>
                <Td>
                  {v.isActive && (
                    <Button variant="ghost" size="sm" onClick={() => deactivate.mutate(v.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      </main>

      <Modal open={showGenModal} onClose={() => setShowGenModal(false)} title="Generate Vouchers">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate.mutate({
              count: parseInt(form.count),
              maxUses: parseInt(form.maxUses),
              expiresAt: form.expiresAt || undefined,
            });
            setShowGenModal(false);
          }}
          className="space-y-4"
        >
          <Input label="Count" type="number" min="1" max="500" value={form.count}
            onChange={(e) => setForm({ ...form, count: e.target.value })} />
          <Input label="Max Uses Per Code" type="number" min="1" value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          <Input label="Expires At (optional)" type="datetime-local" value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowGenModal(false)}>Cancel</Button>
            <Button type="submit" loading={generate.isPending}>Generate</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
