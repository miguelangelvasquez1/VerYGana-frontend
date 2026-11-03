'use client';

// components/layout/DashboardLayout.tsx
// Versión con carga de EffectivePlanState y propagación a Sidebar/Header

import React, { useState, useEffect, useRef, createContext, useContext, useMemo, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getEffectivePlanState } from '@/services/planService';
import { getCommercialInitialData } from '@/services/commercial/commercialService';
import { CommercialInitialDataResponseDTO } from '@/types/ads/commercial';
import { PaymentRequiredModal } from '../plans/PaymentRequiredModal';
import { PlanChangeBlockedModal } from '../planChange/PlanChangeBlockedModal';
import { EffectivePlanStateResponseDTO, PlanCode } from '@/types/finance/plans/Plan.types';
import { WalletStatus } from '@/types/finance/Wallet.types';
import { isWalletExhausted, isBudgetDormant } from '../plans/WalletBudgetAlerts';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Los avisos y las pantallas de estado se cargan solo cuando hacen falta: no entran en el JavaScript inicial (RN-8 de la spec 014).
const LockedPage = lazy(() => import('./LayoutStates').then((m) => ({ default: m.LockedPage })));
const OnboardingErrorState = lazy(() => import('./LayoutStates').then((m) => ({ default: m.OnboardingErrorState })));
const WalletExhaustedBanner = lazy(() => import('../plans/WalletBanners').then((m) => ({ default: m.WalletExhaustedBanner })));
const WalletDormantBanner = lazy(() => import('../plans/WalletBanners').then((m) => ({ default: m.WalletDormantBanner })));

// ─── Route protection ─────────────────────────────────────────────────────────

const PROTECTED_ROUTES: { path: string; requiredPlans: PlanCode[] }[] = [
  { path: '/commercial/dashboard', requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/products',  requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD] },
  { path: '/commercial/ads',       requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/branding',  requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/surveys',   requiredPlans: [PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/pets',      requiredPlans: [PlanCode.PREMIUM] },
  { path: '/commercial/allies',    requiredPlans: [PlanCode.PREMIUM] },
  { path: '/commercial/analytics', requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM] },
  { path: '/commercial/billing',   requiredPlans: [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM] },
];

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

// ─── Context ──────────────────────────────────────────────────────────────────

interface PlanContextValue {
  planState: EffectivePlanStateResponseDTO | null;
  loadingPlan: boolean;
  refreshPlanState: () => void;
  /**
   * Tras volver del checkout de recarga: el backend levanta la suspensión
   * del presupuesto cuando el webhook de pago confirma, y eso puede tardar
   * unos segundos. Re-consulta el estado con reintentos hasta que el saldo
   * deje de estar agotado (o se agoten los intentos). Devuelve `true` si el
   * saldo ya está disponible.
   */
  pollPlanStateAfterRecharge: () => Promise<boolean>;
}

export const PlanContext = createContext<PlanContextValue>({
  planState: null,
  loadingPlan: true,
  refreshPlanState: () => {},
  pollPlanStateAfterRecharge: async () => false,
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
  // Cajón del menú (CA-7): el foco entra al abrir y vuelve al botón al cerrar.
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const [planState, setPlanState]     = useState<EffectivePlanStateResponseDTO | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [commercialData, setCommercialData]           = useState<CommercialInitialDataResponseDTO | null>(null);
  const [loadingCommercialData, setLoadingCommercialData] = useState(true);
  const [commercialDataError, setCommercialDataError]     = useState(false);

  const onboardingCompleted = commercialData?.onboardingStatus === 'COMPLETED';
  // Evita el doble llamado a getCommercialInitialData()/getEffectivePlanState()
  // que provoca React Strict Mode en dev (monta -> limpia -> vuelve a montar
  // cada efecto). No se resetea en el cleanup a propósito: solo debe permitir
  // una carga automática por cada montaje real del layout.
  const hasStartedCommercialDataLoad = useRef(false);

  const { status: sessionStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/commercial') router.replace('/commercial/dashboard');
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
      { match: '/commercial/dashboard', title: 'Inicio' },

      { match: '/commercial/ads/create', title: 'Crear Anuncio' },
      { match: '/commercial/ads', title: 'Mis Anuncios' },

      { match: '/commercial/products/create', title: 'Crear Producto' },
      { match: '/commercial/products', title: 'Mis Productos' },

      { match: '/commercial/pets/create', title: 'Crear Mascotas' },
      { match: '/commercial/pets', title: 'Mascotas' },

      { match: '/commercial/allies', title: 'Aliados' },

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

  // Cierra el cajón y devuelve el foco al botón de menú.
  const closeMenu = () => {
    setSidebarOpen(false);
    menuButtonRef.current?.focus();
  };

  // Abierto, el foco entra al primer enlace y Escape lo cierra.
  useEffect(() => {
    if (!sidebarOpen) return;
    drawerRef.current?.querySelector<HTMLElement>('nav a')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setSidebarOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const loadPlan = async () => {
    try {
      const state = await getEffectivePlanState();
      setPlanState(state);
    } catch {
      console.error('Error cargando estado del plan');
      setPlanState(NO_PLAN_STATE);
    } finally {
      setLoadingPlan(false);
    }
  };

  const pollPlanStateAfterRecharge = async (): Promise<boolean> => {
    const MAX_TRIES = 8;
    const INTERVAL_MS = 2500;
    for (let i = 0; i < MAX_TRIES; i++) {
      try {
        const state = await getEffectivePlanState();
        setPlanState(state);
        if (!isWalletExhausted(state)) return true;
      } catch {
        console.error('Error re-consultando estado del plan tras recarga');
      }
      if (i < MAX_TRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
      }
    }
    return false;
  };

  const loadCommercialData = async () => {
    setLoadingCommercialData(true);
    try {
      const data = await getCommercialInitialData();
      setCommercialData(data);
      setCommercialDataError(false);
      if (data.onboardingStatus === 'COMPLETED') {
        await loadPlan();
      } else {
        setLoadingPlan(false);
      }
    } catch {
      console.error('Error cargando datos del comercial');
      setCommercialDataError(true);
      setLoadingPlan(false);
    } finally {
      setLoadingCommercialData(false);
    }
  };

  useEffect(() => {
    // Esperamos a que la sesión de NextAuth esté realmente lista antes de
    // pedir el estado del onboarding/plan. Si disparábamos esto apenas se
    // montaba el layout, justo después de loguearse y ser redirigido a
    // /commercial la request podía salir antes de que el token nuevo
    // estuviera sincronizado (whenTokenReady() solo espera la primera
    // sincronización de toda la pestaña, que ya ocurrió en /login con token
    // null) — el backend respondía 401 y se veía un flash de LockedPage
    // hasta que la sesión terminaba de sincronizar.
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (sessionStatus !== 'authenticated') return;
    if (hasStartedCommercialDataLoad.current) return;
    hasStartedCommercialDataLoad.current = true;
    loadCommercialData();
  }, [sessionStatus, router]);

  // El onboarding vive en su propia ruta (sin sidebar/header del panel
  // comercial) — si todavía no está completo, sacamos al usuario de ahí.
  useEffect(() => {
    if (commercialData && !onboardingCompleted) {
      router.replace('/commercial-onboarding');
    }
  }, [commercialData, onboardingCompleted, router]);

  return (
    <PlanContext.Provider value={{ planState, loadingPlan, refreshPlanState: loadPlan, pollPlanStateAfterRecharge }}>
      <div className="panel-touch min-h-screen bg-gray-50">

        <PaymentRequiredModal />
        <PlanChangeBlockedModal />

        {isMobile && sidebarOpen && (
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeMenu}
          />
        )}

        <div
          id="commercial-sidebar"
          ref={drawerRef}
          // En el celular es un diálogo; cerrado, `inert` lo saca del orden de tabulación.
          {...(isMobile
            ? { role: 'dialog', 'aria-modal': sidebarOpen, 'aria-label': 'Menú', inert: !sidebarOpen }
            : {})}
          className={`
            fixed top-0 left-0 h-full w-64 z-50
            transition-transform duration-300 ease-in-out
            ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          `}
        >
          <Sidebar
            onClose={closeMenu}
            planState={planState}
            effectivePlan={planState?.effectivePlan as PlanCode | null ?? null}
            hasActivePlan={planState?.hasActivePlan ?? false}
            pathname={currentPath}
          />
        </div>

        <div className={`transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
          <Header
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
            menuOpen={sidebarOpen}
            menuButtonRef={menuButtonRef}
            showMenuButton={isMobile}
            planState={planState}
            commercialData={commercialData}
          />
          <main className="p-4 lg:p-6">
            {(() => {
              if (loadingCommercialData) {
                return (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  </div>
                );
              }
              if (commercialDataError) {
                return <Suspense fallback={null}><OnboardingErrorState onRetry={loadCommercialData} /></Suspense>;
              }
              if (commercialData && !onboardingCompleted) {
                // Redirigiendo a /commercial-onboarding (ver efecto arriba).
                return (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  </div>
                );
              }
              if (loadingPlan) {
                return (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  </div>
                );
              }
              const access = getRouteAccess(currentPath, planState);
              if (!access.ok) return <Suspense fallback={null}><LockedPage requiredPlans={access.requiredPlans!} /></Suspense>;
              // No repetir el aviso dentro del propio flujo de recarga.
              const showBudgetBanner = !currentPath.startsWith('/commercial/balance');
              return (
                <>
                  {showBudgetBanner && isBudgetDormant(planState) && (
                    <div className="mb-4"><Suspense fallback={null}><WalletDormantBanner /></Suspense></div>
                  )}
                  {showBudgetBanner && isWalletExhausted(planState) && !isBudgetDormant(planState) && (
                    <div className="mb-4"><Suspense fallback={null}><WalletExhaustedBanner /></Suspense></div>
                  )}
                  {children}
                </>
              );
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
  '/commercial/dashboard': 'Inicio',
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