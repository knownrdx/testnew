'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VouchersRedirect() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.hotelId) {
      router.push(`/hotels/${user.hotelId}/vouchers`);
    } else {
      router.push('/hotels');
    }
  }, [user, router]);

  return null;
}
