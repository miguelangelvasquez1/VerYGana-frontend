'use client';

/**
 * Carcasa del portal de cumplimiento.
 *
 * El consumidor de Ver y Gana vive en el azul brillante de la marca; el
 * oficial de cumplimiento trabaja en la versión callada de ese mismo azul:
 * un riel de tinta a la izquierda, papel frío a la derecha y un solo acento
 * cian que marca dónde está parado. Nada compite con los expedientes.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeftRight,
  FileSignature,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  ScrollText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';

const NAV = [
  { title: 'Revisión KYC', short: 'KYC', href: '/compliance/kyc', icon: ShieldCheck },
  { title: 'Alertas de screening', short: 'Screening', href: '/compliance/screenings', icon: AlertTriangle },
  { title: 'Contratos comerciales', short: 'Contratos', href: '/compliance/contracts', icon: FileSignature },
  { title: 'Cambios de plan', short: 'Cambios plan', href: '/compliance/plan-changes', icon: ArrowLeftRight },
  { title: 'Logs de auditoría', short: 'Auditoría', href: '/compliance/audit-logs', icon: ScrollText },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

function NavList({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <nav className="flex-1 space-y-0.5 px-2 py-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.title : undefined}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
              active ? 'bg-cmp-ink-2 text-white' : 'text-[#93A7B8] hover:bg-cmp-ink-2/60 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            {/* La guía cian se desliza entre secciones: el mismo objeto se
                mueve, en vez de apagarse aquí y encenderse allá. */}
            {active && (
              <motion.span
                layoutId="cmp-nav-spine"
                transition={reduce ? { duration: 0 } : { duration: 0.26, ease: EASE_OUT }}
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-cmp-cian"
              />
            )}
            <Icon
              className={`h-[17px] w-[17px] shrink-0 ${active ? 'text-cmp-cian' : 'text-current'}`}
            />
            {!collapsed && <span className="truncate">{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function RailFooter({ collapsed }: { collapsed: boolean }) {
  const { logout } = useLogout();
  const { data: session } = useSession();
  const name = session?.user?.name?.trim();
  const email = session?.user?.email ?? '';
  const initials = (name || email || 'OC')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="border-t border-white/10 p-2">
      {!collapsed && (
        <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="cmp-mono grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cmp-ink-3 text-[11px] font-medium text-cmp-cian">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{name || 'Oficial'}</p>
            <p className="cmp-label mt-0.5 truncate text-[#6F8497]">Oficial de cumplimiento</p>
          </div>
        </div>
      )}
      <button
        onClick={logout}
        title={collapsed ? 'Cerrar sesión' : undefined}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#93A7B8] hover:bg-cmp-flag/20 hover:text-[#FF9C93] ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <LogOut className="h-[17px] w-[17px] shrink-0" />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cmp-cian/15">
        <ShieldCheck className="h-[18px] w-[18px] text-cmp-cian" />
      </span>
      <div className="min-w-0">
        {/* Days One es la voz de la marca: aparece una sola vez, aquí. */}
        <p
          className="truncate text-[13px] leading-none text-white"
          style={{ fontFamily: 'var(--font-days-one)' }}
        >
          VER Y GANA
        </p>
        <p className="cmp-label mt-1.5 text-cmp-cian">Cumplimiento</p>
      </div>
    </div>
  );
}

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const section = NAV.find((n) => isActive(pathname, n.href));

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="compliance-root flex h-screen overflow-hidden bg-cmp-paper">
      {/* Riel fijo — escritorio */}
      <aside
        className={`hidden shrink-0 flex-col bg-cmp-ink md:flex ${
          collapsed ? 'w-[68px]' : 'w-[244px]'
        }`}
        style={{ transition: 'width 220ms cubic-bezier(0.23, 1, 0.32, 1)' }}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-3">
          {collapsed ? (
            // Contraído, la marca ES el control: al pasar el cursor el escudo
            // cede su lugar al icono de expandir, sin ocupar espacio extra.
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menú"
              className="group relative mx-auto grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-cmp-cian/15 hover:bg-cmp-ink-3"
            >
              <ShieldCheck className="h-[18px] w-[18px] text-cmp-cian transition-opacity duration-150 group-hover:opacity-0" />
              <PanelLeft className="absolute h-4 w-4 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            </button>
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <Wordmark />
              </div>
              <button
                onClick={() => setCollapsed(true)}
                aria-label="Contraer menú"
                className="cursor-pointer rounded-lg p-1.5 text-[#7F94A6] hover:bg-white/5 hover:text-white"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        <NavList pathname={pathname} collapsed={collapsed} />
        <RailFooter collapsed={collapsed} />
      </aside>

      {/* Riel deslizante — móvil */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-cmp-ink/50 backdrop-blur-[2px] md:hidden"
            />
            <motion.aside
              initial={reduce ? { opacity: 0 } : { transform: 'translateX(-100%)' }}
              animate={reduce ? { opacity: 1 } : { transform: 'translateX(0%)' }}
              exit={reduce ? { opacity: 0 } : { transform: 'translateX(-100%)' }}
              transition={{ duration: 0.3, ease: EASE_DRAWER }}
              className="fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-cmp-ink md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-3">
                <Wordmark />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Cerrar menú"
                  className="cursor-pointer rounded-lg p-1.5 text-[#7F94A6] hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavList pathname={pathname} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
              <RailFooter collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-cmp-rule bg-white/70 px-4 backdrop-blur-sm md:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="cursor-pointer rounded-lg p-2 text-cmp-slate hover:bg-cmp-rule-soft md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="cmp-label flex items-center gap-2 text-cmp-mute">
            Portal de cumplimiento
            {section && (
              <>
                <span className="text-cmp-rule">/</span>
                <span className="text-cmp-ink">{section.short}</span>
              </>
            )}
          </p>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
