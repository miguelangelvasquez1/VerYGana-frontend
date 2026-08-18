'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, User, LogOut, X, ChevronDown } from 'lucide-react';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const { notifications, unreadCount, loading: notifLoading, hasMore, markAllAsRead, loadMore } = useNotifications();
  const { searchTerm, setSearchTerm, placeholder } = useAdminSearch();

  // Cerrar menús al hacer clic por fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
      <header className="bg-white border-b-2 border-admin-blue/20 px-6 xl:px-8 py-3.5 xl:py-4 h-18 flex items-center justify-between sticky top-0 z-30">
        {/* Título de la sección */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl xl:text-2xl font-bold text-admin-navy">
            {getPageTitle(pathname)}
          </h1>
        </div>

        {/* Controles de la derecha */}
        <div className="flex items-center gap-3 xl:gap-5">

          {/* BUSCADOR */}
          <div className="relative w-64 xl:w-80 transition-all">
            <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
            />
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 focus:bg-white text-sm text-gray-800 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-admin-blue transition-all"
            />
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
            )}
          </div>

          {/* NOTIFICACIONES */}
          <div className="relative">
            <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                loading={notifLoading}
                hasMore={hasMore}
                isOpen={isNotificationsOpen}
                onToggle={() => setIsNotificationsOpen((v) => !v)}
                onMarkAllAsRead={markAllAsRead}
                onLoadMore={loadMore}
                menuRef={notificationsMenuRef}
                variant="light"
            />
          </div>

          {/* MENÚ DE USUARIO CON DROPDOWN */}
          <div className="relative" ref={userMenuRef}>
            <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 bg-admin-gradient rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium text-admin-navy hidden sm:inline-block">
              Admin
            </span>
              <ChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {/* Menú Desplegable de Cierre de Sesión */}
            {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
            )}
          </div>

        </div>
      </header>
  );
};

export default Header;