'use client';

// components/layout/Sidebar.tsx
// Versión con control de acceso por plan efectivo

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, CreditCard, FileImage, Home, PlusCircle,
  Settings, Target, Package, ClipboardList, Wallet,
  X, LogOut, Gamepad2, PawPrint, Lock, Sparkles,
  TrendingUp, Megaphone
} from 'lucide-react';
import { Plan } from '@/types/plan';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** Si está definido, el item solo aparece para estos planes */
  requiredPlans?: Plan['code'][];
  /** Si true, aparece pero deshabilitado con lock en planes inferiores */
  lockIfUnavailable?: boolean;
}

interface SidebarProps {
  onClose?: () => void;
  /** Plan efectivo del anunciante (viene de EffectivePlanState) */
  effectivePlan?: Plan['code'];
  /** Saldo del presupuesto activo (solo STANDARD / PREMIUM) */
  remainingBudget?: number;
  /** true si hay comisión activa */
  commissionActive?: boolean;
}

// ─── Menu items con control de plan ──────────────────────────────────────────

const menuItems: MenuItem[] = [
  { href: '/commercial', icon: Home, label: 'Dashboard' },
  {
    href: '/commercial/products', icon: Package, label: 'Mis productos',
  },
  {
    href: '/commercial/ads', icon: FileImage, label: 'Mis Anuncios',
    requiredPlans: ['STANDARD', 'PREMIUM'], lockIfUnavailable: true,
  },
  {
    href: '/commercial/ads/create', icon: Megaphone, label: 'Crear Anuncio',
    requiredPlans: ['STANDARD', 'PREMIUM'], lockIfUnavailable: true,
  },
  {
    href: '/commercial/campaigns', icon: Target, label: 'Campañas',
    requiredPlans: ['STANDARD', 'PREMIUM'], lockIfUnavailable: true,
  },
  {
    href: '/commercial/campaigns/create', icon: PlusCircle, label: 'Crear Campaña',
    requiredPlans: ['STANDARD', 'PREMIUM'], lockIfUnavailable: true,
  },
  {
    href: '/commercial/games', icon: Gamepad2, label: 'Juegos Branded',
    requiredPlans: ['STANDARD', 'PREMIUM'], lockIfUnavailable: true,
  },
  {
    href: '/commercial/surveys', icon: ClipboardList, label: 'Encuestas',
    requiredPlans: ['STANDARD', 'PREMIUM'], lockIfUnavailable: true,
  },
  {
    href: '/commercial/pets', icon: PawPrint, label: 'Mascotas',
    requiredPlans: ['PREMIUM'], lockIfUnavailable: true,
  },
  { href: '/commercial/analytics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/commercial/billing', icon: CreditCard, label: 'Facturación' },
  {
    href: '/commercial/balance', icon: Wallet, label: 'Mi Saldo',
    requiredPlans: ['STANDARD', 'PREMIUM'],
  },
  { href: '/commercial/settings', icon: Settings, label: 'Configuración' },
  { href: '/commercial/plans', icon: Sparkles, label: 'Ver Planes' },
];

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  BASIC: {
    label: 'Personal',
    className: 'bg-slate-600/40 text-slate-300 border border-slate-500/30',
  },
  STANDARD: {
    label: 'Estándar',
    className: 'bg-blue-600/30 text-blue-300 border border-blue-500/40',
  },
  PREMIUM: {
    label: 'Premium',
    className: 'bg-purple-600/30 text-purple-300 border border-purple-500/40',
  },
};

function PlanBadge({ plan }: { plan: Plan['code'] }) {
  const style = PLAN_STYLES[plan] ?? PLAN_STYLES['BASIC'];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest ${style.className}`}>
      {style.label.toUpperCase()}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  onClose,
  effectivePlan = 'BASIC',
  remainingBudget,
  commissionActive = false,
}: SidebarProps) {
  const pathname = usePathname();

  const canAccess = (item: MenuItem): boolean => {
    if (!item.requiredPlans) return true;
    return item.requiredPlans.includes(effectivePlan);
  };

  const isLocked = (item: MenuItem): boolean => {
    if (!item.lockIfUnavailable) return false;
    return !canAccess(item);
  };

  const showItem = (item: MenuItem): boolean => {
    // Items sin lockIfUnavailable y sin acceso → se ocultan directamente
    if (item.requiredPlans && !item.lockIfUnavailable && !canAccess(item)) return false;
    return true;
  };

  const hasBudget = (effectivePlan === 'STANDARD' || effectivePlan === 'PREMIUM')
    && typeof remainingBudget === 'number';

  const formatBudget = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-[#0f1117] text-white w-64 h-screen flex flex-col border-r border-white/[0.06]">

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

      {/* ── Budget block (only STANDARD / PREMIUM) ── */}
      {hasBudget && (
        <div className="mx-4 mt-4 rounded-xl bg-gradient-to-br from-blue-600/15 to-purple-600/10 border border-blue-500/20 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 font-semibold tracking-widest">PRESUPUESTO ACTIVO</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white leading-tight">
            {formatBudget(remainingBudget!)}
          </p>
          {commissionActive && (
            <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Comisión activa (ROI 6x alcanzado)
            </p>
          )}
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {menuItems.map((item) => {
          if (!showItem(item)) return null;

          const active = pathname === item.href;
          const locked = isLocked(item);
          const Icon = item.icon;

          return (
            <div key={item.href}>
              {locked ? (
                // Locked state — not clickable
                <div className="flex items-center px-3 py-2.5 rounded-lg text-slate-600 cursor-not-allowed select-none group">
                  <Icon className="w-4 h-4 mr-3 text-slate-700 shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <Lock className="w-3 h-3 text-slate-700" />
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center px-3 py-2.5 rounded-lg transition-all duration-150 group
                    ${active
                      ? 'bg-blue-600/20 text-white border border-blue-500/30'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-3 shrink-0 transition-colors ${
                    active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {/* "Plans" pill highlight */}
                  {item.href === '/commercial/plans' && (
                    <span className="ml-auto text-[9px] font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full">
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
        <button className="w-full flex items-center px-3 py-2 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors text-sm group">
          <LogOut className="w-4 h-4 mr-3 group-hover:text-red-400 transition-colors" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}