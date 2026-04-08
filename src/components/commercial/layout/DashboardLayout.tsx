'use client';

// components/layout/DashboardLayout.tsx
// Versión con carga de EffectivePlanState y propagación a Sidebar/Header

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getEffectivePlanState } from '@/services/planService';
import { EffectivePlanState } from '@/types/plan';

// ─── Context: plan state accesible en cualquier hijo ─────────────────────────

interface PlanContextValue {
  planState: EffectivePlanState | null;
  loadingPlan: boolean;
}

export const PlanContext = createContext<PlanContextValue>({
  planState: null,
  loadingPlan: true,
});

export const usePlanState = () => useContext(PlanContext);

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Plan state
  const [planState, setPlanState] = useState<EffectivePlanState | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // ── Screen size detection ──
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ── Load effective plan state ──
  useEffect(() => {
    async function loadPlan() {
      try {
        const state = await getEffectivePlanState();
        setPlanState(state);
      } catch (err) {
        console.error('Error cargando estado del plan:', err);
        // Fallback a BASIC sin presupuesto
        setPlanState({
          effectivePlan: 'BASIC',
          commissionActive: true,
          commissionRate: 10,
          remainingBudget: 0,
          canAdvertise: false,
          canUseGames: false,
          maxProducts: 10,
          maxAds: 0,
          maxBrandedGames: 0,
          roiReached: false,
        });
      } finally {
        setLoadingPlan(false);
      }
    }
    loadPlan();
  }, []);

  return (
    <PlanContext.Provider value={{ planState, loadingPlan }}>
      <div className="min-h-screen bg-gray-50">

        {/* Overlay móvil */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <div
          id="sidebar"
          className={`
            fixed top-0 left-0 h-full w-64 z-50
            transition-transform duration-300 ease-in-out
            ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          `}
        >
          <Sidebar
            onClose={() => setSidebarOpen(false)}
            effectivePlan={planState?.effectivePlan ?? 'BASIC'}
            remainingBudget={planState?.remainingBudget ?? 0}
            commissionActive={planState?.commissionActive ?? false}
          />
        </div>

        {/* ── Main content ── */}
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