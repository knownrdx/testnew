'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Td, Tr } from '@/components/ui/Table';

export default function SessionsPage() {
  const { id: hotelId } = useParams<{ id: string }>();

  const { data } = useQuery({
    queryKey: ['sessions', hotelId],
    queryFn: () =>
      api.get('/sessions', { params: { hotelId } }).then((r) => r.data.data),
  });

  const exportCsv = async () => {
    const response = await api.get('/sessions/export', {
      params: { hotelId },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sessions.csv';
    a.click();
  };

  return (
    <div>
      <Header title="WiFi Sessions" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">{data?.total ?? 0} sessions</p>
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <Card padding={false}>
          <Table headers={['Room', 'Username', 'MAC', 'IP', 'Download', 'Upload', 'Started', 'Ended']}>
            {data?.sessions?.map((s: {
              id: string; mac: string; ip: string; bytesIn: string; bytesOut: string;
              startedAt: string; endedAt: string | null;
              hotspotUser: { username: string; room: { number: string } | null };
            }) => (
              <Tr key={s.id}>
                <Td>{s.hotspotUser.room?.number ?? '-'}</Td>
                <Td className="font-mono text-xs">{s.hotspotUser.username}</Td>
                <Td className="font-mono text-xs">{s.mac}</Td>
                <Td className="font-mono text-xs">{s.ip ?? '-'}</Td>
                <Td>{(Number(s.bytesIn) / 1024 / 1024).toFixed(1)} MB</Td>
                <Td>{(Number(s.bytesOut) / 1024 / 1024).toFixed(1)} MB</Td>
                <Td className="text-xs">{new Date(s.startedAt).toLocaleString()}</Td>
                <Td className="text-xs">{s.endedAt ? new Date(s.endedAt).toLocaleString() : 'Active'}</Td>
              </Tr>
            ))}
          </Table>
        </Card>
      </main>
    </div>
  );
}
