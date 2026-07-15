'use client';

// components/layout/DashboardLayout.tsx
// Versión con carga de EffectivePlanState y propagación a Sidebar/Header

import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getEffectivePlanState } from '@/services/planService';
import { EffectivePlanStateResponseDTO, PlanCode } from '@/types/finance/plans/Plan.types';
import { WalletStatus } from '@/types/finance/Wallet.types';
import { usePathname, useRouter } from 'next/navigation';

// ─── Route protection ─────────────────────────────────────────────────────────

const PROTECTED_ROUTES: { path: string; requiredPlans: PlanCode[] }[] = [
  { path: '/commercial/products',  requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/ads',       requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/surveys',   requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/pets',      requiredPlans: [PlanCode.PREMIUM] },
  { path: '/commercial/analytics', requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/billing',   requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM] },
];

const PLAN_LABELS: Record<PlanCode, string> = {
  [PlanCode.BASIC]:    'Personal',
  [PlanCode.STANDARD]: 'Estándar',
  [PlanCode.PREMIUM]:  'Premium',
};

function getRouteAccess(
  path: string,
  planState: EffectivePlanStateResponseDTO | null,
): { ok: boolean; requiredPlans: PlanCode[] | null } {
  const matched = PROTECTED_ROUTES
    .filter(r => path === r.path || path.startsWith(r.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0];

  if (!matched) return { ok: true, requiredPlans: null };
  if (!planState?.hasActivePlan) return { ok: false, requiredPlans: matched.requiredPlans };

  const ok = planState.effectivePlan != null
    && matched.requiredPlans.includes(planState.effectivePlan as PlanCode);
  return { ok, requiredPlans: matched.requiredPlans };
}

function LockedPage({ requiredPlans }: { requiredPlans: PlanCode[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Sección no disponible</h2>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">
        Esta funcionalidad requiere uno de los siguientes planes:
      </p>
      <div className="flex gap-2 mb-6">
        {requiredPlans.map(p => (
          <span key={p} className="px-3 py-1 bg-[#03548C]/10 text-[#03548C] text-xs font-bold rounded-full border border-[#03548C]/20">
            {PLAN_LABELS[p]}
          </span>
        ))}
      </div>
      <Link
        href="/plans"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Ver planes disponibles
      </Link>
    </div>
  );
}

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
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/commercial') router.replace('/commercial/products');
  }, [pathname, router]);
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

      { match: '/commercial/pets/create', title: 'Crear Mascotas' },
      { match: '/commercial/pets', title: 'Mascotas' },

      { match: '/commercial/branding/campaigns', title: 'Campañas' },
      { match: '/commercial/branding/requests', title: 'Solicitudes de Marca' },
      { match: '/commercial/branding', title: 'Campañas' },
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
          <main className="p-4 lg:p-6">
            {(() => {
              if (loadingPlan) {
                return (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  </div>
                );
              }
              const access = getRouteAccess(currentPath, planState);
              if (!access.ok) return <LockedPage requiredPlans={access.requiredPlans!} />;
              return children;
            })()}
          </main>
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
  '/commercial/surveys': 'Encuestas',
  '/commercial/analytics': 'Estadísticas',
  '/commercial/billing': 'Facturación',
  '/commercial/support': 'Soporte',
  '/plans': 'Planes',
};