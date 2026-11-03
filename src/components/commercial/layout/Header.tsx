'use client';

import React, { useEffect, useRef, useState, type Ref } from 'react';
import { Menu, User, Lock } from 'lucide-react';
import Link from 'next/link';
import { CommercialInitialDataResponseDTO } from '@/types/ads/commercial';
import { EffectivePlanStateResponseDTO } from '@/types/finance/plans/Plan.types';
import { formatBudget, formatCents } from '@/utils/currency';
import { NotificationPanel } from '@/components/notifications/NotificationsPanel';
import { useNotifications } from '@/hooks/useNotifications';

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
  /** Estado del cajón del menú (para `aria-expanded`). */
  menuOpen?: boolean;
  /** Para devolverle el foco al cerrar el cajón. */
  menuButtonRef?: Ref<HTMLButtonElement>;
  showMenuButton: boolean;
  planState?: EffectivePlanStateResponseDTO | null;
  // La pide DashboardLayout una sola vez (junto con el estado de onboarding)
  // y la pasa hacia abajo — antes Header la pedía por su cuenta, duplicando
  // la llamada a /commercials/initialData en cada carga del panel.
  commercialData?: CommercialInitialDataResponseDTO | null;
}

const PLAN_COLORS: Record<string, { pill: string; label: string }> = {
  BASIC:    { pill: 'bg-slate-100 text-slate-600 border border-slate-200', label: 'text-slate-400' },
  STANDARD: { pill: 'bg-[#03548C]/10 text-[#03548C] border border-[#03548C]/20', label: 'text-[#03548C]/60' },
  PREMIUM:  { pill: 'bg-[#0b1440]/10 text-[#0b1440] border border-[#0b1440]/20', label: 'text-[#0b1440]/60' },
};

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Personal',
  STANDARD: 'Estándar',
  PREMIUM: 'Premium',
};

// Presupuesto, plan y "Recargar". Lo usa el encabezado (desde `sm` y `md`) y, con `inDrawer`, el cajón del menú en el
// celular (D-5 de la spec 014): por debajo de 640 px el encabezado lo oculta y sin él no se llega a Saldo.
export function BudgetAndPlan({
  planState,
  inDrawer = false,
  onNavigate,
}: {
  planState?: EffectivePlanStateResponseDTO | null;
  inDrawer?: boolean;
  onNavigate?: () => void;
}) {
  const planCode = planState?.effectivePlan ?? 'BASIC';
  const remainingBudget = formatCents(planState?.remainingBudgetCents ?? 0);
  const hasBudget = (planCode === 'STANDARD' || planCode === 'PREMIUM') && remainingBudget > 0;
  const show = inDrawer ? 'flex' : 'hidden sm:flex';
  const tapCls = inDrawer ? 'tap inline-flex items-center' : '';

  return (
    <>
      {hasBudget ? (
        <div className={`${show} items-center bg-[#03548C]/5 border border-[#03548C]/15 rounded-xl px-3 py-1.5 gap-2`}>
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] text-slate-500 font-semibold tracking-widest">PRESUPUESTO</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5">
              {formatBudget(remainingBudget)}
            </span>
          </div>

          {/* Botón Recargar - Siempre visible */}
          <Link
            href="/commercial/balance"
            onClick={onNavigate}
            className={`text-[10px] font-bold bg-[#03548C] text-white px-3 py-1.5 rounded-lg hover:bg-[#0b1440] transition-colors ${tapCls}`}
          >
            Recargar
          </Link>
        </div>
      ) : (
        /* BASIC o sin presupuesto */
        <div className={`${show} items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5`}>
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">Sin presupuesto activo</span>
          <Link
            href="/commercial/balance"
            onClick={onNavigate}
            className={`text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded-lg hover:bg-gray-700 transition-colors ${tapCls}`}
          >
            Recargar
          </Link>
        </div>
      )}

      {(() => {
        const style = PLAN_COLORS[planCode] ?? PLAN_COLORS.BASIC;
        return (
          <div className={`${inDrawer ? 'flex' : 'hidden md:flex'} flex-col items-center px-3 py-1 rounded-xl border ${style.pill}`}>
            <span className={`text-[9px] font-semibold tracking-widest uppercase leading-none ${style.label}`}>
              Plan actual
            </span>
            <span className="text-[11px] font-extrabold tracking-wide leading-none mt-0.5">
              {PLAN_LABELS[planCode] ?? 'Personal'}
            </span>
          </div>
        );
      })()}
    </>
  );
}

export function Header({ title, onMenuClick, menuOpen = false, menuButtonRef, showMenuButton, planState, commercialData }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const { notifications, unreadCount, loading: notifLoading, hasMore, markAllAsRead, loadMore } = useNotifications();

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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-3.5">
        <div className="flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {showMenuButton && (
              <button
                ref={menuButtonRef}
                type="button"
                onClick={onMenuClick}
                aria-label="Abrir menú"
                aria-expanded={menuOpen}
                aria-controls="commercial-sidebar"
                className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {title && <h1 title={title} className="text-xl font-bold text-gray-900 truncate">{title}</h1>}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-3">

            <BudgetAndPlan planState={planState} />

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

            <div className="flex items-center gap-2.5">
              <div className="hidden lg:block text-right leading-tight">
                <p className="text-sm font-semibold text-gray-900">{commercialData?.companyName}</p>
                <p className="text-xs text-gray-500">{commercialData?.email}</p>
              </div>
              {/* Área de toque de 44 px en el celular; el círculo del avatar sigue en 32 px */}
              <Link
                href="/commercial/profile"
                className="group/avatar flex size-11 items-center justify-center lg:size-8"
                title="Ver mi perfil"
                aria-label="Ver mi perfil"
              >
                <span className="w-8 h-8 rounded-full bg-linear-to-br from-[#03548C] to-[#0b1440] flex items-center justify-center group-hover/avatar:opacity-80 transition">
                  <User className="w-4 h-4 text-white" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}