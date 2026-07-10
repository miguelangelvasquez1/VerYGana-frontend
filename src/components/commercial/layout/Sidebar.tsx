'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CreditCard,
  FileImage,
  Home,
  PlusCircle,
  Settings,
  Package,
  ClipboardList,
  X,
  LogOut,
  PawPrint,
  Lock,
  Sparkles,
  Megaphone,
  Palette,
} from 'lucide-react';
import { WalletStatus } from '@/types/finance/Wallet.types';
import {PlanCode} from '@/types/finance/plans/Plan.types';
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
  remainingBudget?: number;
  walletStatus?: WalletStatus;
  pathname?: string;
}

// ─── Menu items ───────────────────────────────────────────────────────────────

const menuItems: MenuItem[] = [
  { href: '/commercial', icon: Home, label: 'Dashboard', exactMatch: true },
  {
    href: '/commercial/products', icon: Package, label: 'Mis productos',
    requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  {
    href: '/commercial/products/create', icon: PlusCircle, label: 'Crear producto',
    requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true, skipActive: true,
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
  {
    href: '/commercial/settings', icon: Settings, label: 'Configuración',
    requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM],
    lockIfUnavailable: true,
  },
  { href: '/plans', icon: Sparkles, label: 'Ver Planes' },
];

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<PlanCode, { label: string; className: string }> = {
  [PlanCode.BASIC]: {
    label: 'Personal',
    className: 'bg-slate-600/40 text-slate-300 border border-slate-500/30',
  },
  [PlanCode.STANDARD]: {
    label: 'Estándar',
    className: 'bg-blue-600/30 text-blue-300 border border-blue-500/40',
  },
  [PlanCode.PREMIUM]: {
    label: 'Premium',
    className: 'bg-purple-600/30 text-purple-300 border border-purple-500/40',
  },
};

function PlanBadge({ plan }: { plan: PlanCode | null }) {
  if (!plan) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest bg-slate-700/40 text-slate-500 border border-slate-600/30">
        SIN PLAN
      </span>
    );
  }
  const style = PLAN_STYLES[plan];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest ${style.className}`}>
      {style.label.toUpperCase()}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  onClose,
  effectivePlan = null,
  hasActivePlan = false,
  remainingBudget,
  walletStatus = WalletStatus.INACTIVE,
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

  const hasBudget =
    (effectivePlan === PlanCode.STANDARD || effectivePlan === PlanCode.PREMIUM) &&
    typeof remainingBudget === 'number';

  return (
    <div className="bg-[#0f1117] text-white w-64 h-screen flex flex-col border-r border-white/6">

      {/* ── Header ── */}
      <div className="p-5 border-b border-white/[0.07]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              Control <span className="text-blue-400">Panel</span>
            </h1>
            <div className="mt-2">
              <PlanBadge plan={effectivePlan} />
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
                      ? 'bg-blue-600/20 text-white border border-blue-500/30'
                      : 'text-slate-400 hover:bg-white/6 hover:text-white border border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${
                    active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.href === '/plans' && (
                    <span className="ml-auto text-[9px] font-bold bg-linear-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full">
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