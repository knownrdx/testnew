import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RoomLoginFormProps {
  onSubmit: (data: { roomNumber: string; guestLastName: string }) => void;
  loading: boolean;
  error?: string;
}

export function RoomLoginForm({ onSubmit, loading, error }: RoomLoginFormProps) {
  const { t } = useTranslation();
  const [roomNumber, setRoomNumber] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ roomNumber, guestLastName: lastName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('room_number')}</label>
        <input
          type="text"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder={t('placeholder_room')}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('last_name')}</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder={t('placeholder_name')}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? t('connecting') : t('connect')}
      </button>
    </form>
  );
}
