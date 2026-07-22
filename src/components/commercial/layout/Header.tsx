'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu, User, Lock } from 'lucide-react';
import Link from 'next/link';
import { CommercialInitialDataResponseDTO } from '@/types/ads/commercial';
import { getCommercialInitialData } from '@/services/CommercialService';
import { EffectivePlanStateResponseDTO } from '@/types/finance/plans/Plan.types';
import { formatBudget, formatCents } from '@/utils/currency';
import { NotificationPanel } from '@/components/notifications/NotificationsPanel';
import { useNotifications } from '@/hooks/useNotifications';

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
  showMenuButton: boolean;
  planState?: EffectivePlanStateResponseDTO | null;
}

// Umbral desde variable de entorno (con fallback seguro)
const BUDGET_LOW_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_BUDGET_LOW_THRESHOLD ?? 500000
);

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

export function Header({ title, onMenuClick, showMenuButton, planState }: HeaderProps) {
  const [commercial, setCommercial] = useState<CommercialInitialDataResponseDTO | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const { notifications, unreadCount, loading: notifLoading, hasMore, markAllAsRead, loadMore } = useNotifications();

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getCommercialInitialData();
        setCommercial(data);
      } catch (err) {
        console.error('Error cargando datos del comercial:', err);
      }
    }
    loadUser();
  }, []);

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

  const planCode = planState?.effectivePlan ?? 'BASIC';
  const remainingBudget = formatCents(planState?.remainingBudgetCents ?? 0);

  const isStandardOrPremium = 
    planState?.effectivePlan === 'STANDARD' || 
    planState?.effectivePlan === 'PREMIUM';

  const hasBudget = isStandardOrPremium && remainingBudget > 0;

  const shouldShowRechargeButton = remainingBudget < BUDGET_LOW_THRESHOLD;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-3.5">
        <div className="flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {title && <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-3">

            {/* Budget Section */}
            {hasBudget ? (
              <div className="hidden sm:flex items-center bg-[#03548C]/5 border border-[#03548C]/15 rounded-xl px-3 py-1.5 gap-2">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[10px] text-slate-500 font-semibold tracking-widest">PRESUPUESTO</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5">
                    {formatBudget(remainingBudget)}
                  </span>
                </div>

                {/* Botón Recargar - Solo aparece si está bajo el umbral */}
                {shouldShowRechargeButton && (
                  <Link
                    href="/commercial/balance"
                    className="text-[10px] font-bold bg-[#03548C] text-white px-3 py-1.5 rounded-lg hover:bg-[#0b1440] transition-colors"
                  >
                    Recargar
                  </Link>
                )}
              </div>
            ) : (
              /* BASIC o sin presupuesto */
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Sin presupuesto activo</span>
                <Link
                  href="/plans"
                  className="text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Ver planes
                </Link>
              </div>
            )}

            {/* Plan Badge */}
            {(() => {
              const style = PLAN_COLORS[planCode] ?? PLAN_COLORS.BASIC;
              return (
                <div className={`hidden md:flex flex-col items-center px-3 py-1 rounded-xl border ${style.pill}`}>
                  <span className={`text-[9px] font-semibold tracking-widest uppercase leading-none ${style.label}`}>
                    Plan actual
                  </span>
                  <span className="text-[11px] font-extrabold tracking-wide leading-none mt-0.5">
                    {PLAN_LABELS[planCode] ?? 'Personal'}
                  </span>
                </div>
              );
            })()}

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
                <p className="text-sm font-semibold text-gray-900">{commercial?.companyName}</p>
                <p className="text-xs text-gray-500">{commercial?.email}</p>
              </div>
              <Link
                href="/commercial/profile"
                className="w-8 h-8 rounded-full bg-linear-to-br from-[#03548C] to-[#0b1440] flex items-center justify-center hover:opacity-80 transition"
                title="Ver mi perfil"
              >
                <User className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}