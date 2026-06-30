'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu, User, Lock } from 'lucide-react';
import Link from 'next/link';
import { CommercialInitialDataResponseDTO } from '@/types/ads/commercial';
import { getCommercialInitialData } from '@/services/commercialService';
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

const PLAN_COLORS: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-600',
  STANDARD: 'bg-blue-50 text-blue-700',
  PREMIUM: 'bg-purple-50 text-purple-700',
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
              <div className="hidden sm:flex items-center bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-xl px-3 py-1.5 gap-2">
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
                    className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
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
            <span className={`hidden md:inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest ${PLAN_COLORS[planCode] ?? PLAN_COLORS.BASIC}`}>
              {PLAN_LABELS[planCode] ?? 'Personal'}
            </span>

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
              <button className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}