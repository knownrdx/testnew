import { useEffect, useState } from 'react';
import axios from 'axios';
import { Wifi } from 'lucide-react';

interface PortalConfig {
  name: string;
  brandColor: string;
  portalConfig: {
    primaryColor: string;
    secondaryColor: string;
    welcomeText: string;
    logoUrl: string | null;
    bgImageUrl: string | null;
    languages: string[];
  } | null;
}

interface PortalLayoutProps {
  hotelSlug: string;
  children: React.ReactNode;
  onConfigLoaded?: (config: PortalConfig) => void;
}

export function PortalLayout({ hotelSlug, children, onConfigLoaded }: PortalLayoutProps) {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
    axios
      .get(`${API_URL}/hotels/portal/config/${hotelSlug}`)
      .then((r) => {
        setConfig(r.data.data);
        onConfigLoaded?.(r.data.data);
      })
      .catch(() => {
        setConfig(null);
      })
      .finally(() => setLoading(false));
  }, [hotelSlug, onConfigLoaded]);

  const primaryColor = config?.portalConfig?.primaryColor ?? '#2563EB';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: config?.portalConfig?.bgImageUrl
          ? `url(${config.portalConfig.bgImageUrl}) center/cover`
          : `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}40)`,
      }}
    >
      <header className="p-4 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
        {config?.portalConfig?.logoUrl ? (
          <img src={config.portalConfig.logoUrl} alt="Hotel Logo" className="h-10 object-contain" />
        ) : (
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Wifi className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="text-white">
          <p className="font-bold text-lg">{config?.name ?? 'Hotel WiFi'}</p>
          {loading && <p className="text-xs opacity-70">Loading...</p>}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">{children}</main>

      <footer className="p-4 text-center text-xs text-gray-500">
        Powered by HotelWiFi Platform
      </footer>
    </div>
  );
}
