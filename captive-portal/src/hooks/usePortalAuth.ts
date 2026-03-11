import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

interface AuthParams {
  hotelSlug: string;
  mac: string;
  ip: string;
  linkLogin?: string;
  credentials:
    | { type: 'room'; roomNumber: string; guestLastName: string }
    | { type: 'voucher'; code: string };
}

interface AuthResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

export function usePortalAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<AuthResult | null>(null);

  const authenticate = async (params: AuthParams) => {
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await axios.post(`${API_URL}/portal/auth`, params);
      setResult({ success: true, redirectUrl: data.data.redirectUrl });
      return { success: true, redirectUrl: data.data.redirectUrl as string };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Connection failed';
      setError(message);
      setResult({ success: false, error: message });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { authenticate, loading, error, result };
}
