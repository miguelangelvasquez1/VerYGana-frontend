'use client';

import React, { lazy, Suspense, useEffect, useRef, useState, type Ref } from 'react';
import { Search, User, LogOut, X, ChevronDown, Menu } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { useAdminSearch } from '@/context/AdminSearchContext';

// El panel de notificaciones se carga aparte: no entra en el JavaScript inicial de todo el panel (RN-8 de la spec 014).
const NotificationPanel = lazy(() =>
  import('@/components/notifications/NotificationsPanel').then((m) => ({ default: m.NotificationPanel })),
);

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Gestión de Usuarios',
  '/admin/ads': 'Gestión de Anuncios',
  '/admin/products': 'Gestión de Productos',
  '/admin/raffles': 'Gestión de Sorteos',
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

interface HeaderProps {
  onMenuClick?: () => void;
  /** Estado del cajón del menú (para `aria-expanded`). */
  menuOpen?: boolean;
  /** Para devolverle el foco al cerrar el cajón. */
  menuButtonRef?: Ref<HTMLButtonElement>;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, menuOpen = false, menuButtonRef }) => {
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

  const title = getPageTitle(pathname);

  return (
      // Por debajo de `lg` el buscador va a lo ancho en una segunda fila (spec 014, CA-5): el contenedor de la
      // derecha usa `contents` y el buscador `order-last basis-full`. Desde `lg:` todo igual que antes.
      <header className="bg-white border-b-2 border-admin-blue/20 px-4 lg:px-6 xl:px-8 py-3.5 xl:py-4 lg:h-18 flex flex-wrap lg:flex-nowrap items-center justify-between max-lg:gap-2 sticky top-0 z-30">
        {/* Título de la sección */}
        <div className="flex items-center gap-2 lg:space-x-4 lg:gap-0 min-w-0 flex-1 lg:flex-none">
          <button
              ref={menuButtonRef}
              type="button"
              onClick={onMenuClick}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="admin-sidebar"
              className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 title={title} className="text-xl xl:text-2xl font-bold text-admin-navy truncate">
            {title}
          </h1>
        </div>

        {/* Controles de la derecha */}
        <div className="contents lg:flex lg:items-center lg:gap-3 xl:gap-5">

          {/* BUSCADOR */}
          <div className="relative order-last basis-full lg:order-none lg:basis-auto lg:w-64 xl:w-80 transition-all">
            <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
            />
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tap w-full pl-10 pr-11 lg:pr-8 py-2 bg-gray-50 focus:bg-white text-sm text-gray-800 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-admin-blue focus:border-admin-blue transition-all"
            />
            {searchTerm && (
                <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Borrar búsqueda"
                    className="tap-icon absolute right-0 lg:right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 lg:p-0.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
            )}
          </div>

          {/* NOTIFICACIONES */}
          <div className="relative">
            <Suspense fallback={<span aria-hidden="true" className="block size-11 lg:h-9" />}>
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
            </Suspense>
          </div>

          {/* MENÚ DE USUARIO CON DROPDOWN */}
          <div className="relative" ref={userMenuRef}>
            <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="Menú de usuario"
                aria-expanded={isUserMenuOpen}
                className="tap tap-w flex items-center justify-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
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
                      className="tap w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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