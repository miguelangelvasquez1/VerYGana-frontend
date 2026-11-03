'use client';

import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './shared/Sidebar';
import Header from './shared/Header';
import { Poppins } from 'next/font/google';
import { AdminSearchProvider } from '@/context/AdminSearchContext';
import { AdminRoleGuard } from './AdminRoleGuard';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

// Por debajo de `lg` (1024 px, D-11 de la spec 014) la barra lateral es un cajón.
const DRAWER_BREAKPOINT_PX = 1024;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // El foco entra al abrir el cajón y vuelve al botón de menú al cerrarlo (CA-7).
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < DRAWER_BREAKPOINT_PX;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  // Abierto, el foco entra al primer enlace y Escape lo cierra.
  useEffect(() => {
    if (!menuOpen) return;
    drawerRef.current?.querySelector<HTMLElement>('nav a')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <AdminRoleGuard>
      <AdminSearchProvider>
        <div className="panel-touch flex h-dvh lg:h-screen overflow-hidden bg-gray-50">
          {menuOpen && (
            <button
              type="button"
              aria-label="Cerrar menú"
              tabIndex={-1}
              className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden"
              onClick={closeMenu}
            />
          )}
          <Sidebar
            drawerRef={drawerRef}
            isMobile={isMobile}
            open={menuOpen}
            onClose={closeMenu}
            onNavigate={() => setMenuOpen(false)}
          />
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <Header
              onMenuClick={() => setMenuOpen(true)}
              menuOpen={menuOpen}
              menuButtonRef={menuButtonRef}
            />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </AdminSearchProvider>
    </AdminRoleGuard>
  );
};

export default AdminLayout;
