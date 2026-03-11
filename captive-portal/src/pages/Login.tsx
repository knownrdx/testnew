import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PortalLayout } from '../components/PortalLayout';
import { RoomLoginForm } from '../components/RoomLoginForm';
import { VoucherForm } from '../components/VoucherForm';
import { LanguageSelector } from '../components/LanguageSelector';
import { usePortalAuth } from '../hooks/usePortalAuth';

type Tab = 'room' | 'voucher';

export function LoginPage() {
  const { hotelSlug } = useParams<{ hotelSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { authenticate, loading, error } = usePortalAuth();
  const [tab, setTab] = useState<Tab>('room');
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);

  const mac = searchParams.get('mac') ?? '';
  const ip = searchParams.get('ip') ?? '';
  const linkLogin = searchParams.get('link-login') ?? undefined;

  const handleRoomSubmit = async (data: { roomNumber: string; guestLastName: string }) => {
    const result = await authenticate({
      hotelSlug: hotelSlug!,
      mac,
      ip,
      linkLogin,
      credentials: { type: 'room', ...data },
    });
    if (result.success) {
      navigate(`/portal/${hotelSlug}/success?redirect=${encodeURIComponent(result.redirectUrl ?? '')}`);
    }
  };

  const handleVoucherSubmit = async (data: { code: string }) => {
    const result = await authenticate({
      hotelSlug: hotelSlug!,
      mac,
      ip,
      linkLogin,
      credentials: { type: 'voucher', code: data.code },
    });
    if (result.success) {
      navigate(`/portal/${hotelSlug}/success?redirect=${encodeURIComponent(result.redirectUrl ?? '')}`);
    }
  };

  return (
    <PortalLayout
      hotelSlug={hotelSlug!}
      onConfigLoaded={(config) => {
        setAvailableLangs(config.portalConfig?.languages ?? ['en']);
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 text-center border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">{t('welcome')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
          </div>

          <div className="flex border-b border-gray-100">
            {(['room', 'voucher'] as Tab[]).map((t_) => (
              <button
                key={t_}
                onClick={() => setTab(t_)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t_
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t_ === 'room' ? t('tab_room') : t('tab_voucher')}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'room' ? (
              <RoomLoginForm onSubmit={handleRoomSubmit} loading={loading} error={error} />
            ) : (
              <VoucherForm onSubmit={handleVoucherSubmit} loading={loading} error={error} />
            )}
          </div>

          <div className="px-6 pb-6">
            <LanguageSelector available={availableLangs} />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
