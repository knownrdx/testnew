'use client';

import { useState, useEffect } from 'react';
import { useSocketEvent } from '@/hooks/useSocket';
import { Table, Td, Tr } from '@/components/ui/Table';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

interface Session {
  id: string;
  mac: string;
  ip: string;
  username: string;
  roomNumber: string;
  bytesIn: number;
  bytesOut: number;
  startedAt: string;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ActiveSessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useSocketEvent<Session>('session:new', (session) => {
    setSessions((prev) => {
      const exists = prev.find((s) => s.mac === session.mac);
      if (exists) return prev.map((s) => (s.mac === session.mac ? session : s));
      return [session, ...prev].slice(0, 50);
    });
  });

  return (
    <Card padding={false}>
      <div className="p-6 border-b border-gray-200">
        <CardHeader className="mb-0">
          <CardTitle>Active Sessions</CardTitle>
          <span className="text-sm text-gray-500">{sessions.length} live</span>
        </CardHeader>
      </div>
      <Table headers={['Room', 'Username', 'MAC', 'IP', 'Down', 'Up', 'Since']}>
        {sessions.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-center py-8 text-gray-500 text-sm">
              No active sessions
            </td>
          </tr>
        ) : (
          sessions.map((s) => (
            <Tr key={s.id}>
              <Td>{s.roomNumber}</Td>
              <Td className="font-mono text-xs">{s.username}</Td>
              <Td className="font-mono text-xs">{s.mac}</Td>
              <Td className="font-mono text-xs">{s.ip}</Td>
              <Td>{formatBytes(s.bytesIn)}</Td>
              <Td>{formatBytes(s.bytesOut)}</Td>
              <Td className="text-xs text-gray-500">
                {new Date(s.startedAt).toLocaleTimeString()}
              </Td>
            </Tr>
          ))
        )}
      </Table>
    </Card>
  );
}
