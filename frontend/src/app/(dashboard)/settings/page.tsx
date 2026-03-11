'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const hotelId = user?.hotelId;
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: hotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => api.get(`/hotels/${hotelId}`).then((r) => r.data.data),
    enabled: !!hotelId,
  });

  const rotateSecret = useMutation({
    mutationFn: () => api.post(`/hotels/${hotelId}/rotate-secret`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel'] }),
  });

  const webhookUrl = hotel ? `${window.location.origin.replace(':3000', ':4000')}/api/webhook/pms/${hotel.slug}` : '';

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <Header title="Settings" />
      <main className="p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>PMS Webhook</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Webhook URL</p>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                <Button variant="secondary" onClick={copyWebhookUrl} size="sm">
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Webhook Secret</p>
              <p className="text-xs text-gray-500 mb-2">
                Use this to generate HMAC-SHA256 signatures for your PMS requests.
              </p>
              <div className="flex items-center gap-2">
                <Input value="••••••••••••••••••••••••••••••••" readOnly className="font-mono text-xs" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => rotateSecret.mutate()}
                  loading={rotateSecret.isPending}
                >
                  <RotateCcw className="w-4 h-4" /> Rotate
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-900 mb-1">Webhook Payload Format</p>
              <pre className="text-xs text-blue-800 overflow-x-auto">{JSON.stringify({
                event: 'checkin',
                roomNumber: '101',
                guestLastName: 'Smith',
                checkoutTime: '2026-03-11T12:00:00Z',
              }, null, 2)}</pre>
              <p className="mt-2 text-xs text-blue-700">
                Header: <code>X-Webhook-Signature: sha256=HMAC_SHA256(body, secret)</code>
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portal Config</CardTitle>
          </CardHeader>
          <p className="text-sm text-gray-500">
            Guest portal URL:{' '}
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
              http://localhost:5174/portal/{hotel?.slug ?? 'your-hotel'}
            </code>
          </p>
        </Card>
      </main>
    </div>
  );
}
