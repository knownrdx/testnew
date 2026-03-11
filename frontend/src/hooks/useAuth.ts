'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const router = useRouter();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
      router.push('/dashboard');
    },
    [login, router],
  );

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  return {
    user,
    isAuthenticated,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isManager: user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN',
    login: handleLogin,
    logout: handleLogout,
  };
}
