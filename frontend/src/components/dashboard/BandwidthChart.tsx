'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useRouterStatus } from '@/hooks/useRouterStatus';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function BandwidthChart() {
  const { bandwidthHistory } = useRouterStatus();

  const chartData = bandwidthHistory.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString(),
    'Download (MB)': +(p.bytesIn / 1024 / 1024).toFixed(2),
    'Upload (MB)': +(p.bytesOut / 1024 / 1024).toFixed(2),
  }));

  return (
    <Card padding={false} className="p-6">
      <CardHeader>
        <CardTitle>Bandwidth Usage (Live)</CardTitle>
        <span className="text-xs text-gray-500">Last 60 snapshots</span>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v) => `${v}MB`} />
            <Tooltip
              formatter={(value: number) => [`${value} MB`, '']}
              labelStyle={{ fontSize: 12 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Download (MB)"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="Upload (MB)"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
