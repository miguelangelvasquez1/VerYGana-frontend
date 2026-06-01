'use client';

// components/layout/DashboardLayout.tsx
// Versión con carga de EffectivePlanState y propagación a Sidebar/Header

import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getEffectivePlanState } from '@/services/planService';
import { EffectivePlanStateResponseDTO, PlanCode } from '@/types/finance/plans/Plan.types';
import { WalletStatus } from '@/types/finance/Wallet.types';
import { formatCents } from '@/utils/currency';
import { usePathname } from 'next/navigation';

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

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [planState, setPlanState]     = useState<EffectivePlanStateResponseDTO | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const pathname = usePathname();
  // Memoizamos el pathname actual para evitar renders inestables
  const currentPath = useMemo(() => pathname, [pathname]);

  const getPageTitle = (path: string): string => {
    // 1️⃣ Exact match primero
    if (PAGE_TITLES[path]) {
      return PAGE_TITLES[path];
    }

    // 2️⃣ Partial match (ordenado por longitud)
    const routes = [
      { match: '/commercial/ads/create', title: 'Crear Anuncio' },
      { match: '/commercial/ads', title: 'Mis Anuncios' },

      { match: '/commercial/products/create', title: 'Crear Producto' },
      { match: '/commercial/products', title: 'Mis Productos' },

      { match: '/commercial/campaigns/create', title: 'Crear Campaña' },
      { match: '/commercial/campaigns', title: 'Campañas' },

      { match: '/commercial/pets/create', title: 'Crear Mascotas' },
      { match: '/commercial/pets', title: 'Mascotas' },
    ];

    const sortedRoutes = routes.sort((a, b) => b.match.length - a.match.length);

    const found = sortedRoutes.find(r => path.startsWith(r.match));
    if (found) return found.title;

    // 3️⃣ fallback
    return 'Panel';
  };

  const title = getPageTitle(pathname);

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
            remainingBudget={planState?.remainingBudgetCents ?? 0}
            walletStatus={planState?.walletStatus ?? WalletStatus.INACTIVE}
            pathname={currentPath}
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

// config/pageTitles.ts
export const PAGE_TITLES: Record<string, string> = {
  '/commercial': 'Dashboard',
  '/commercial/products': 'Mis Productos',
  '/commercial/products/create': 'Crear Producto',
  '/commercial/ads': 'Mis Anuncios',
  '/commercial/ads/create': 'Crear Anuncio',
  '/commercial/campaigns': 'Campañas',
  '/commercial/campaigns/create': 'Crear Campaña',
  '/commercial/surveys': 'Encuestas',
  '/commercial/analytics': 'Estadísticas',
  '/commercial/billing': 'Facturación',
  '/commercial/settings': 'Configuración',
  '/plans': 'Planes',
};