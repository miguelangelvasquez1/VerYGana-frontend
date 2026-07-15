'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CreditCard,
  FileImage,
  Headset,
  Package,
  ClipboardList,
  X,
  LogOut,
  PawPrint,
  Lock,
  Sparkles,
  Palette,
} from 'lucide-react';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { useLogout } from '@/hooks/useLogout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiredPlans?: PlanCode[];
  lockIfUnavailable?: boolean;
  /** Prevents this item from being highlighted even when the path matches (used for action/create pages). */
  skipActive?: boolean;
  /** Only highlight on an exact pathname match — no matching of child routes (used for the root Dashboard link). */
  exactMatch?: boolean;
}

interface SidebarProps {
  onClose?: () => void;
  effectivePlan?: PlanCode | null;
  hasActivePlan?: boolean;
  pathname?: string;
}

// ─── Menu items ───────────────────────────────────────────────────────────────

const menuItems: MenuItem[] = [
  {
    href: '/commercial/products', icon: Package, label: 'Mis productos',
    requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  {
    href: '/commercial/ads', icon: FileImage, label: 'Mis Anuncios',
    requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  {
    href: '/commercial/branding', icon: Palette, label: 'Branding en Juegos',
    requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  {
    href: '/commercial/surveys', icon: ClipboardList, label: 'Encuestas',
    requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  {
    href: '/commercial/pets', icon: PawPrint, label: 'Mascotas',
    requiredPlans: [PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  {
    href: '/commercial/analytics', icon: BarChart3, label: 'Estadísticas',
    requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  {
    href: '/commercial/billing', icon: CreditCard, label: 'Facturación',
    requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  { href: '/commercial/support', icon: Headset, label: 'Soporte' },
  { href: '/plans', icon: Sparkles, label: 'Ver Planes' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  onClose,
  effectivePlan = null,
  hasActivePlan = false,
  pathname = '',
}: SidebarProps) {

  const { logout } = useLogout();

  // Usamos el pathname que viene del Layout (más estable)
  const isActive = useMemo(() => {
    return (item: MenuItem): boolean => {
      if (item.skipActive) return false;
      if (pathname === item.href) return true;
      if (item.exactMatch) return false;
      // List/section pages are active for any of their child paths
      return pathname.startsWith(item.href + '/');
    };
  }, [pathname]);

// =============

  const canAccess = (item: MenuItem): boolean => {
    if (!hasActivePlan) return false;
    if (!item.requiredPlans || item.requiredPlans.length === 0) return true;
    return effectivePlan != null && item.requiredPlans.includes(effectivePlan);
  };

  const isLocked = (item: MenuItem): boolean => {
    if (!item.lockIfUnavailable) return false;
    return !canAccess(item);
  };

  const showItem = (item: MenuItem): boolean => {
    if (item.requiredPlans && !item.lockIfUnavailable && !canAccess(item)) return false;
    return true;
  };

  return (
    <div className="bg-[#0f1117] text-white w-64 h-screen flex flex-col border-r border-white/6">

      {/* ── Header ── */}
      <div className="px-4 py-4 border-b border-white/[0.07]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logos/logoDorado.png"
              alt="VerYGana"
              className="w-9 h-9 object-contain shrink-0"
            />
            <div className="leading-tight">
              <p className="text-base font-extrabold text-white tracking-tight">VerYGana</p>
              <p className="text-[10px] text-white/40 font-medium tracking-wide">Activación de ventas</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {menuItems.map((item) => {
          if (!showItem(item)) return null;

          const active = isActive(item)
          const locked = isLocked(item);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {locked ? (
                <div className="flex items-center px-3 py-2.5 rounded-lg text-slate-600 cursor-not-allowed select-none">
                  <Icon className="w-4 h-4 mr-3 text-slate-700 shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <Lock className="w-3 h-3 text-slate-700" />
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg transition-colors duration-100 group
                    ${active
                      ? 'bg-[#00a4ff]/15 text-[#00a4ff] border border-[#00a4ff]/25'
                      : 'text-slate-400 hover:bg-white/6 hover:text-white border border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${
                    active ? 'text-[#00a4ff]' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.href === '/plans' && (
                    <span className="ml-auto text-[9px] font-bold bg-linear-to-r from-[#03548C] to-[#00a4ff] text-white px-1.5 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-white/[0.07]">
        <button className="w-full flex items-center px-3 py-2 text-slate-500 hover:text-white hover:bg-white/6 rounded-lg transition-colors text-sm group cursor-pointer"
          onClick={async () => {
            await logout();
          }}
        >
          <LogOut className="w-4 h-4 mr-3 group-hover:text-red-400 transition-colors" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}