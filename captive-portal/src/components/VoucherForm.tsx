import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VoucherFormProps {
  onSubmit: (data: { code: string }) => void;
  loading: boolean;
  error?: string;
}

export function VoucherForm({ onSubmit, loading, error }: VoucherFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ code: code.toUpperCase().trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('voucher_code')}</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t('placeholder_voucher')}
          required
          maxLength={12}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-center font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
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
