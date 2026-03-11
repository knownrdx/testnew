'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Hotel,
  Router,
  BedDouble,
  Activity,
  Ticket,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hotels', label: 'Hotels', icon: Hotel, superAdminOnly: true },
  { href: '/routers', label: 'Routers', icon: Router },
  { href: '/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/sessions', label: 'Sessions', icon: Activity },
  { href: '/vouchers', label: 'Vouchers', icon: Ticket },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">HotelWiFi</h1>
            <p className="text-xs text-gray-400">Management Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.superAdminOnly || isSuperAdmin)
          .map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
      </nav>

      {isSuperAdmin && (
        <div className="p-4 border-t border-gray-800">
          <span className="text-xs text-blue-400 font-medium px-3 py-1 bg-blue-900/40 rounded-full">
            Super Admin
          </span>
        </div>
      )}
    </aside>
  );
}
