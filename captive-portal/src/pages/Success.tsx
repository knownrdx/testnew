import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wifi } from 'lucide-react';
import { PortalLayout } from '../components/PortalLayout';

export function SuccessPage() {
  const { hotelSlug } = useParams<{ hotelSlug: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const redirect = searchParams.get('redirect') ?? 'https://google.com';

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirect;
    }, 3000);
    return () => clearTimeout(timer);
  }, [redirect]);

  return (
    <PortalLayout hotelSlug={hotelSlug!}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wifi className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('success_title')}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('success_subtitle')}</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
            {t('redirecting')}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
