'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, AlertTriangle, ScrollText, FileSignature, Menu, X, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';

// ─── Nav ────────────────────────────────────────────────────────────────────
// Cada sección mantiene su propio color de acento (además del indigo
// "de marca" del panel) — ayuda a distinguir de un vistazo en qué módulo se
// está, igual que el panel de commercial usa colores por categoría.

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}

const navItems: NavItem[] = [
  {
    title: 'Revisión KYC',
    href: '/compliance/kyc',
    icon: ShieldCheck,
    activeBg: 'bg-blue-500/15',
    activeText: 'text-blue-400',
    activeBorder: 'border-blue-500/25',
  },
  {
    title: 'Alertas de Screening',
    href: '/compliance/screenings',
    icon: AlertTriangle,
    activeBg: 'bg-amber-500/15',
    activeText: 'text-amber-400',
    activeBorder: 'border-amber-500/25',
  },
  {
    title: 'Contratos comerciales',
    href: '/compliance/contracts',
    icon: FileSignature,
    activeBg: 'bg-emerald-500/15',
    activeText: 'text-emerald-400',
    activeBorder: 'border-emerald-500/25',
  },
  {
    title: 'Logs de Auditoría',
    href: '/compliance/audit-logs',
    icon: ScrollText,
    activeBg: 'bg-purple-500/15',
    activeText: 'text-purple-400',
    activeBorder: 'border-purple-500/25',
  },
];

function getPageTitle(pathname: string): string {
  const match = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  return match?.title ?? 'Portal del Oficial de Cumplimiento';
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function ComplianceSidebar({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const { logout } = useLogout();

  return (
    <div className="bg-[#0f1117] text-white w-64 h-screen flex flex-col border-r border-white/6">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logos/logoDorado.png" alt="VerYGana" className="w-9 h-9 object-contain shrink-0" />
            <div className="leading-tight">
              <p className="text-base font-extrabold text-white tracking-tight">VerYGana</p>
              <p className="text-[10px] text-white/40 font-medium tracking-wide">Cumplimiento</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-colors duration-100 group border ${
                active
                  ? `${item.activeBg} ${item.activeText} ${item.activeBorder}`
                  : 'text-slate-400 border-transparent hover:bg-white/6 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${active ? item.activeText : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.07]">
        <button
          onClick={() => logout()}
          className="w-full flex items-center px-3 py-2 text-slate-500 hover:text-white hover:bg-white/6 rounded-lg transition-colors text-sm group cursor-pointer gap-3"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

function ComplianceHeader({ title, onMenuClick, showMenuButton }: { title: string; onMenuClick: () => void; showMenuButton: boolean }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-3.5">
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
        </div>
      </div>
    </header>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const title = getPageTitle(pathname ?? '');

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ease-in-out ${
          isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        }`}
      >
        <ComplianceSidebar pathname={pathname ?? ''} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className={`transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <ComplianceHeader title={title} onMenuClick={() => setSidebarOpen(true)} showMenuButton={isMobile} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
