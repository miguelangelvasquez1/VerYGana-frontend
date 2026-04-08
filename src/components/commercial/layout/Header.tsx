'use client';

// components/layout/Header.tsx
// Versión con saldo de presupuesto para planes STANDARD y PREMIUM

import React, { useEffect, useState } from 'react';
import { Menu, Bell, User, Wallet, TrendingUp, Lock } from 'lucide-react';
import Link from 'next/link';
import { CommercialInitialDataResponseDTO } from '@/types/ads/commercial';
import { getCommercialInitialData } from '@/services/commercialService';
import { EffectivePlanState } from '@/types/plan';

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
  showMenuButton: boolean;
  /** Plan efectivo pasado desde DashboardLayout */
  planState?: EffectivePlanState | null;
}

// ─── Plan badge colors ────────────────────────────────────────────────────────

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

  const hasBudget = planState
    && (planState.effectivePlan === 'STANDARD' || planState.effectivePlan === 'PREMIUM')
    && planState.remainingBudget > 0;

  const formatBudget = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(n);

  const planCode = planState?.effectivePlan ?? 'BASIC';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-3.5">
        <div className="flex items-center justify-between">

          {/* ── Left: menu + title ── */}
          <div className="flex items-center space-x-3">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {title && (
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            )}
          </div>

          {/* ── Right: budget + plan badge + notifications + user ── */}
          <div className="flex items-center gap-2 lg:gap-3">

            {/* Budget pill — only STANDARD / PREMIUM */}
            {hasBudget ? (
              <div className="hidden sm:flex items-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-xl px-3 py-1.5 gap-2">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[10px] text-slate-500 font-semibold tracking-widest">PRESUPUESTO</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5">
                    {formatBudget(planState!.remainingBudget)}
                  </span>
                </div>
                {planState?.commissionActive && (
                  <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                    <TrendingUp className="w-2.5 h-2.5" />
                    ROI 6×
                  </div>
                )}
                <Link
                  href="/commercial/balance"
                  className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Recargar
                </Link>
              </div>
            ) : (
              // BASIC plan — show upgrade prompt
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Sin presupuesto activo</span>
                <Link
                  href="/commercial/plans"
                  className="text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Ver planes
                </Link>
              </div>
            )}

            {/* Plan badge */}
            <span className={`hidden md:inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest ${PLAN_COLORS[planCode] ?? PLAN_COLORS.BASIC}`}>
              {PLAN_LABELS[planCode] ?? 'Personal'}
            </span>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2.5">
              <div className="hidden lg:block text-right leading-tight">
                <p className="text-sm font-semibold text-gray-900">{commercial?.companyName}</p>
                <p className="text-xs text-gray-500">{commercial?.email}</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}