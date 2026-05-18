'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getEffectivePlanState } from '@/services/planService';
import { EffectivePlanStateResponseDTO, PlanCode } from '@/types/finance/plans/Plan.types';
import { WalletStatus } from '@/types/finance/Wallet.types';
import { formatCents } from '@/utils/currency';

// ─── Context ──────────────────────────────────────────────────────────────────

interface PlanContextValue {
  planState: EffectivePlanStateResponseDTO | null;
  loadingPlan: boolean;
  refreshPlanState: () => void;
}

export const PlanContext = createContext<PlanContextValue>({
  planState: null,
  loadingPlan: true,
  refreshPlanState: () => {},
});

export const usePlanState = () => useContext(PlanContext);

// ─── Fallback cuando no hay plan ──────────────────────────────────────────────

const NO_PLAN_STATE: EffectivePlanStateResponseDTO = {
  effectivePlan: null,
  hasActivePlan: false,
  remainingBudgetCents: 0,
  commissionRate: 0,
  canAdvertise: false,
  canUseGames: false,
  canUseSurveys: false,
  maxProducts: 0,
  maxAds: 0,
  maxBrandedGames: 0,
  maxSurveys: 0,
  maxKeysPct: 0,
  subscriptionDaysRemaining: null,
  walletStatus: WalletStatus.INACTIVE,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [planState, setPlanState]     = useState<EffectivePlanStateResponseDTO | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadPlan = async () => {
    try {
      const state = await getEffectivePlanState();
      setPlanState(state);
    } catch (err) {
      console.error('Error cargando estado del plan:', err);
      setPlanState(NO_PLAN_STATE);
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => { loadPlan(); }, []);

  return (
    <PlanContext.Provider value={{ planState, loadingPlan, refreshPlanState: loadPlan }}>
      <div className="min-h-screen bg-gray-50">

        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={`
            fixed top-0 left-0 h-full w-64 z-50
            transition-transform duration-300 ease-in-out
            ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          `}
        >
          <Sidebar
            onClose={() => setSidebarOpen(false)}
            effectivePlan={planState?.effectivePlan as PlanCode | null ?? null}
            hasActivePlan={planState?.hasActivePlan ?? false}
            remainingBudget={formatCents(planState?.remainingBudgetCents ?? 0)}
            walletStatus={planState?.walletStatus ?? WalletStatus.INACTIVE}
          />
        </div>

        <div className={`transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
          <Header
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
            showMenuButton={isMobile}
            planState={planState}
          />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </PlanContext.Provider>
  );
}