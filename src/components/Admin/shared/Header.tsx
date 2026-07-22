'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, User, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from '@/components/notifications/NotificationsPanel';
import { useAdminSearch } from '@/context/AdminSearchContext';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Gestión de Usuarios',
  '/admin/ads': 'Gestión de Anuncios',
  '/admin/products': 'Gestión de Productos',
  '/admin/raffles': 'Gestión de Rifas',
  '/admin/surveys': 'Encuestas',
  '/admin/forum': 'Historias de Impacto',
  '/admin/system': 'Gestión del Sistema',
  '/admin/branding': 'Solicitudes de Branding',
  '/admin/config': 'Configuración',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const parent = Object.keys(PAGE_TITLES)
    .filter((k) => k !== '/admin' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return parent ? PAGE_TITLES[parent] : 'Dashboard';
}

const Header: React.FC = () => {
  const { logout } = useLogout();
  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const { notifications, unreadCount, loading: notifLoading, hasMore, markAllAsRead, loadMore } = useNotifications();
  const { searchTerm, setSearchTerm, placeholder } = useAdminSearch();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 h-18">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-800">{getPageTitle(pathname)}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notifications */}
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            loading={notifLoading}
            hasMore={hasMore}
            isOpen={isNotificationsOpen}
            onToggle={() => setIsNotificationsOpen(v => !v)}
            onMarkAllAsRead={markAllAsRead}
            onLoadMore={loadMore}
            menuRef={notificationsMenuRef}
            variant="light"
          />

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
            <button className="p-2 text-gray-600 hover:text-gray-800 cursor-pointer" onClick={logout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
