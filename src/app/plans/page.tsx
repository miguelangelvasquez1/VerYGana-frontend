'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Check, X, Zap, Rocket, Star, ArrowRight, Sparkles,
  Package, Megaphone, Gamepad2, Boxes, TrendingUp,
  PawPrint, ClipboardList, BadgePercent, Loader2,
  AlertCircle, ArrowLeft
} from 'lucide-react';
import { initiatePayment, getPlanCatalog } from '@/services/planService';
import { previewPlanChange, requestPlanChange, getCurrentPlanChangeRequest } from '@/services/planChangeService';
import { getRechargeContract } from '@/services/planRechargeService';
import { PlanCode, PlanPaymentRequestDTO } from '@/types/finance/plans/Plan.types';
import { PlanCatalogOption, PlanCatalogResponseDTO } from '@/types/finance/plans/PlanCatalog.types';
import { PlanChangePreviewResponseDTO } from '@/types/finance/plans/PlanChange.types';
import { WompiCheckoutResponseDTO } from '@/types/finance/wompi/Wompi.types';
import { RECHARGE_CONTRACT_ID_KEY, isActiveRechargeContract } from '@/components/commercial/balance/balance.shared';

function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
  return data?.message || fallback;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const parseCOP = (raw: string) => parseInt(raw.replace(/\D/g, ''), 10) || 0;

const formatInput = (raw: string) => {
  const num = parseCOP(raw);
  if (!num) return '';
  return new Intl.NumberFormat('es-CO').format(num);
};

const limitOrUnlimited = (n: number) => (n === -1 ? 'Ilimitado' : `${n}`);
const pctOrUnlimited = (n: number) => (n === -1 ? 'Ilimitado' : `hasta ${n}%`);

// Combina el flag de capacidad (canAdvertise/canUseGames/canUseSurveys) con su
// tope máximo: false oculta la fila en tarjetas y muestra la X en la tabla;
// habilitado sin tope numérico útil cae en un simple check.
const capacityLabel = (enabled: boolean, max: number): string | boolean => {
  if (!enabled) return false;
  if (max === -1) return 'Ilimitado';
  if (max > 0) return `hasta ${max}`;
  return true;
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanFeatureRow {
  label: string;
  icon: React.ReactNode;
  basic: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

// Modelo de plan para la UI: combina lo que llega de GET /plans/catalog con
// metadata puramente visual (ícono, si se resalta como "más popular", el
// texto de la sección de features) que la API no expone y no varía.
interface UIPlan {
  key: PlanCode;
  name: string;
  description: string;
  icon: React.ReactNode;
  highlight: boolean;
  currentPlan: boolean;
  featuresLabel: string;
  priceLabel: string;
  unit: string;
  billing: string;
  monthlyFeeCents: number | null;
  minInvestmentCents: number | null;
  maxInvestmentCents: number | null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLAN_ORDER: PlanCode[] = [PlanCode.BASIC, PlanCode.STANDARD, PlanCode.PREMIUM];

const PLAN_UI_META: Record<PlanCode, { icon: React.ReactNode; highlight: boolean; featuresLabel: string }> = {
  [PlanCode.BASIC]: { icon: <Star className="w-8 h-8" />, highlight: false, featuresLabel: 'Incluye:' },
  [PlanCode.STANDARD]: { icon: <Zap className="w-8 h-8" />, highlight: true, featuresLabel: 'Todo lo de Personal, más:' },
  [PlanCode.PREMIUM]: { icon: <Rocket className="w-8 h-8" />, highlight: false, featuresLabel: 'Todo lo de Estándar, más:' },
};

function buildUIPlans(catalog: PlanCatalogResponseDTO): UIPlan[] {
  return PLAN_ORDER
    .map(code => catalog.plans.find(p => p.planCode === code))
    .filter((p): p is PlanCatalogOption => !!p)
    .map(p => {
      const meta = PLAN_UI_META[p.planCode];
      const isMonthly = p.monthlyFeeCents != null;
      const priceCents = isMonthly ? p.monthlyFeeCents! : (p.minInvestmentCents ?? 0);
      return {
        key: p.planCode,
        name: p.planName,
        description: p.description,
        icon: meta.icon,
        highlight: meta.highlight,
        currentPlan: p.currentPlan,
        featuresLabel: meta.featuresLabel,
        priceLabel: new Intl.NumberFormat('es-CO').format(priceCents / 100),
        unit: isMonthly ? 'COP / mes' : 'COP mín.',
        billing: isMonthly ? 'cobro mensual' : 'inversión única',
        monthlyFeeCents: p.monthlyFeeCents,
        minInvestmentCents: p.minInvestmentCents,
        maxInvestmentCents: p.maxInvestmentCents,
      };
    });
}

function buildFeatureRows(catalog: PlanCatalogResponseDTO): PlanFeatureRow[] {
  const byCode = new Map(catalog.plans.map(p => [p.planCode, p]));
  const b = byCode.get(PlanCode.BASIC);
  const s = byCode.get(PlanCode.STANDARD);
  const p = byCode.get(PlanCode.PREMIUM);
  if (!b || !s || !p) return [];

  return [
    {
      label: 'Venta de productos', icon: <Package className="w-4 h-4" />,
      basic: `comisión ${b.saleCommissionPct}%`, standard: `comisión ${s.saleCommissionPct}%`, premium: `comisión ${p.saleCommissionPct}%`,
    },
    {
      label: 'Pago con llaves', icon: <BadgePercent className="w-4 h-4" />,
      basic: pctOrUnlimited(b.maxKeysPct), standard: pctOrUnlimited(s.maxKeysPct), premium: pctOrUnlimited(p.maxKeysPct),
    },
    {
      label: 'Productos publicables', icon: <Boxes className="w-4 h-4" />,
      basic: limitOrUnlimited(b.maxProducts), standard: limitOrUnlimited(s.maxProducts), premium: limitOrUnlimited(p.maxProducts),
    },
    {
      label: 'Juegos branded', icon: <Gamepad2 className="w-4 h-4" />,
      basic: capacityLabel(b.canUseGames, b.maxBrandedGames),
      standard: capacityLabel(s.canUseGames, s.maxBrandedGames),
      premium: capacityLabel(p.canUseGames, p.maxBrandedGames),
    },
    {
      label: 'Publicar anuncios', icon: <Megaphone className="w-4 h-4" />,
      basic: capacityLabel(b.canAdvertise, b.maxAds),
      standard: capacityLabel(s.canAdvertise, s.maxAds),
      premium: capacityLabel(p.canAdvertise, p.maxAds),
    },
    {
      label: 'Encuestas personalizadas', icon: <ClipboardList className="w-4 h-4" />,
      basic: capacityLabel(b.canUseSurveys, b.maxSurveys),
      standard: capacityLabel(s.canUseSurveys, s.maxSurveys),
      premium: capacityLabel(p.canUseSurveys, p.maxSurveys),
    },
    {
      label: 'Sección de mascotas', icon: <PawPrint className="w-4 h-4" />,
      basic: b.canHavePets, standard: s.canHavePets, premium: p.canHavePets,
    },
    {
      label: 'Aumento de visibilidad', icon: <TrendingUp className="w-4 h-4" />,
      basic: b.visibilityBoostPct > 0 ? `+${b.visibilityBoostPct}%` : false,
      standard: s.visibilityBoostPct > 0 ? `+${s.visibilityBoostPct}%` : false,
      premium: p.visibilityBoostPct > 0 ? `+${p.visibilityBoostPct}%` : false,
    },
  ];
}

// ─── Plan Change Modal ──────────────────────────────────────────────────────────
// Cubre tanto el cambio a STANDARD/PREMIUM (con monto de inversión) como la
// bajada a BASIC (sin monto) — ambos casos pasan por el preview antes de
// habilitar el botón de confirmar.

interface PlanChangeModalProps {
  plan: UIPlan;
  onConfirm: (amountCents?: number) => void;
  onClose: () => void;
  loading: boolean;
}

function PlanChangeModal({ plan, onConfirm, onClose, loading }: PlanChangeModalProps) {
  const isBasic = plan.key === PlanCode.BASIC;
  const minCOP = plan.minInvestmentCents != null ? plan.minInvestmentCents / 100 : 0;
  const maxCOP = plan.maxInvestmentCents != null ? plan.maxInvestmentCents / 100 : null;
  const rangeLabel = maxCOP != null
    ? `${formatCOP(minCOP)} – ${formatCOP(maxCOP)} COP`
    : `Mínimo ${formatCOP(minCOP)} COP`;
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PlanChangePreviewResponseDTO | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const amount = parseCOP(inputValue);

  // El backend acota el abono al rango [min, max] del plan destino. Validamos
  // contra el preview (fuente de verdad); si aún no cargó, caemos al catálogo.
  const effMin = preview?.targetMinInvestmentPesos ?? minCOP;
  const effMax = preview?.targetMaxInvestmentPesos ?? maxCOP;

  useEffect(() => {
    if (!isBasic && !amount) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      previewPlanChange(plan.key, isBasic ? undefined : amount * 100)
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, isBasic ? 0 : 500);
    return () => clearTimeout(timer);
  }, [amount, isBasic, plan.key]);

  const validate = () => {
    if (isBasic) return '';
    if (!amount) return 'Ingresa un monto';
    if (amount < effMin) return `El monto mínimo es ${formatCOP(effMin)}`;
    if (effMax != null && amount > effMax) return `El monto máximo es ${formatCOP(effMax)}`;
    return '';
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    if (!preview?.eligible) return;
    onConfirm(isBasic ? undefined : amount * 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(formatInput(e.target.value));
    setError('');
  };

  const confirmDisabled = loading || previewLoading || !preview?.eligible || (!isBasic && amount === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#13151f] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            plan.key === PlanCode.PREMIUM ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {plan.icon}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Plan {plan.name}</h3>
            <p className="text-slate-400 text-sm">{isBasic ? `${plan.priceLabel} COP/mes` : rangeLabel}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isBasic && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">¿Cuánto quieres invertir?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                placeholder={`Ej: ${plan.key === PlanCode.STANDARD ? '2.500.000' : '15.000.000'}`}
                className={`w-full bg-white/5 border rounded-xl py-3 pl-8 pr-16 text-white text-lg font-bold
                  placeholder:text-slate-600 outline-none transition-all
                  ${error ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-blue-500/60'}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">COP</span>
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-red-400 text-sm mt-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
            {amount > 0 && !error && (
              <p className="text-slate-400 text-sm mt-2">
                Inviertes: <span className="text-white font-semibold">{formatCOP(amount)}</span>
              </p>
            )}
          </div>
        )}

        <div
          className={`rounded-xl border p-3 mb-4 space-y-2 text-sm ${
            preview && !preview.eligible
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-white/3 border-white/6 text-slate-400'
          }`}
        >
          {previewLoading && (
            <p className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Calculando...
            </p>
          )}
          {!previewLoading && preview && (
            <>
              <p className="leading-relaxed">{preview.message}</p>
              {preview.eligible && (
                <ul className="text-xs opacity-80 space-y-1">
                  {isBasic && preview.targetMonthlyPricePesos != null && (
                    <li>Tarifa mensual: <span className="text-white">{formatCOP(preview.targetMonthlyPricePesos)}</span></li>
                  )}
                  {!isBasic && preview.targetMinInvestmentPesos != null && (
                    <li>
                      Rango de inversión:{' '}
                      <span className="text-white">
                        {formatCOP(preview.targetMinInvestmentPesos)}
                        {preview.targetMaxInvestmentPesos ? ` – ${formatCOP(preview.targetMaxInvestmentPesos)}` : ' o más'}
                      </span>
                    </li>
                  )}
                  <li>Comisión por venta: <span className="text-white">{preview.targetSaleCommissionPct}%</span></li>
                  {!isBasic && (
                    <li>
                      Abono a pagar:{' '}
                      <span className="text-white font-semibold">
                        {formatCOP(preview.requiredTopUpAmountPesos ?? amount)}
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </>
          )}
          {!previewLoading && !preview && !isBasic && (
            <p className="leading-relaxed">Ingresa un monto para ver el resumen del cambio de plan.</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={confirmDisabled}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
            ${plan.key === PlanCode.PREMIUM
              ? 'bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white'
              : 'bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white'
            }`}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando solicitud...</>
            : <>Solicitar cambio de plan <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Recharge Conflict Modal ────────────────────────────────────────────────────
// Se muestra cuando el backend rechaza una nueva solicitud de cambio de plan
// porque hay una recarga en curso (contractId guardado en sessionStorage
// desde /commercial/balance) que la bloquea. Solo informa — el comercial
// decide si cancela la recarga manualmente desde su pantalla de recarga.

interface RechargeConflictModalProps {
  onGoToRecharge: () => void;
  onClose: () => void;
}

function RechargeConflictModal({ onGoToRecharge, onClose }: RechargeConflictModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#13151f] border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-white font-bold text-base mb-2">Tienes una recarga en curso</h3>
        <p className="text-slate-400 text-sm mb-5 leading-relaxed">
          No puedes solicitar un cambio de plan mientras tengas una recarga de saldo en curso. Si quieres continuar,
          cancélala tú mismo desde tu pantalla de recarga y vuelve a intentarlo.
        </p>
        <button
          onClick={onGoToRecharge}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-2
            bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white
            transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          Ir a mi recarga
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

// ─── Main Plans Page ──────────────────────────────────────────────────────────

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');
  const [modalPlan, setModalPlan] = useState<UIPlan | null>(null);
  const [loading, setLoading] = useState<PlanCode | null>(null);
  const [mounted, setMounted] = useState(false);
  const [catalog, setCatalog] = useState<PlanCatalogResponseDTO | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [rechargeConflict, setRechargeConflict] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    getPlanCatalog()
      .then(setCatalog)
      .catch(() => setCatalogError(true))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const uiPlans = useMemo(() => (catalog ? buildUIPlans(catalog) : []), [catalog]);
  const featureRows = useMemo(() => (catalog ? buildFeatureRows(catalog) : []), [catalog]);

  // Renovar el plan que ya se tiene: BASIC sigue usando /plans/checkout,
  // STANDARD/PREMIUM ahora requiere el flujo de recarga con contrato.
  const handleRenewCurrentPlan = useCallback(async (plan: UIPlan) => {
    if (plan.key !== PlanCode.BASIC) {
      router.push('/commercial/balance');
      return;
    }
    if (plan.monthlyFeeCents == null) {
      toast.error('No se pudo determinar la tarifa del plan. Intenta de nuevo.');
      return;
    }
    setLoading(PlanCode.BASIC);
    try {
      const request: PlanPaymentRequestDTO = { planCode: PlanCode.BASIC, amountCents: plan.monthlyFeeCents };
      const checkout: WompiCheckoutResponseDTO = await initiatePayment(request);
      sessionStorage.setItem('vg_payment_reference', checkout.reference);
      sessionStorage.setItem('vg_payment_plan', PlanCode.BASIC);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo iniciar el pago. Intenta de nuevo.'));
      setLoading(null);
    }
  }, [router]);

  // Intenta crear la solicitud de cambio de plan. Si el backend responde 422,
  // puede ser porque hay una recarga en curso (guardada en sessionStorage
  // desde el flujo de /commercial/balance) que bloquea el cambio — en ese
  // caso se muestra ese contrato con opción de cancelarlo y reintentar
  // (rate limit u otro 422 sin recarga guardada cae al toast genérico).
  const attemptRequestPlanChange = useCallback(async (
    targetPlanCode: PlanCode,
    amountCents?: number
  ): Promise<'success' | 'conflict' | 'error'> => {
    // Si la última solicitud fue rechazada y el comercial aún no dio por
    // leído el motivo, /current la sigue devolviendo con status REJECTED.
    // El back aceptaría una solicitud nueva, pero por UX primero lo
    // mandamos a leer el motivo del rechazo.
    try {
      const current = await getCurrentPlanChangeRequest();
      if (current?.status === 'REJECTED') {
        toast.error('Primero revisa por qué se rechazó tu solicitud anterior.');
        setModalPlan(null);
        router.push('/commercial/plan-change');
        return 'error';
      }
    } catch {
      /* si /current falla seguimos con el flujo normal de creación */
    }
    try {
      // El otrosí (contractDownloadUrl) llega en esta respuesta y también en
      // GET /current, que es lo que consulta la vista de /commercial/plan-change.
      await requestPlanChange({
        targetPlanCode,
        intendedInvestmentAmountCents: amountCents,
      });
      router.push('/commercial/plan-change');
      return 'success';
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        const contractId = sessionStorage.getItem(RECHARGE_CONTRACT_ID_KEY);
        if (contractId) {
          try {
            const contract = await getRechargeContract(Number(contractId));
            if (isActiveRechargeContract(contract)) {
              setModalPlan(null);
              setRechargeConflict(true);
              return 'conflict';
            }
          } catch {
            /* no se pudo confirmar el conflicto — cae al toast genérico */
          }
        }
      }
      toast.error(apiErrorMessage(err, 'No se pudo crear la solicitud de cambio de plan.'));
      setModalPlan(null);
      return 'error';
    }
  }, [router]);

  // Cambiar a un plan distinto al actual (incluye bajar a BASIC) — pasa por
  // el pipeline de solicitud de cambio de plan, no por /plans/checkout.
  const handleRequestPlanChange = useCallback(async (targetPlanCode: PlanCode, amountCents?: number) => {
    setLoading(targetPlanCode);
    await attemptRequestPlanChange(targetPlanCode, amountCents);
    setLoading(null);
  }, [attemptRequestPlanChange]);

  // plan.currentPlan viene directo del catálogo — es el plan activo del
  // comercial, así que su acción es recargar en vez de solicitar un cambio.
  const handlePlanClick = useCallback((plan: UIPlan) => {
    if (loadingCatalog) return;

    if (plan.currentPlan) {
      handleRenewCurrentPlan(plan);
      return;
    }

    // Cualquier cambio de plan (incluida la bajada a BASIC) pasa por el
    // preview del modal — bajar a BASIC con saldo publicitario > 0 no es
    // elegible y el backend lo rechaza, así que no se salta la validación.
    setModalPlan(plan);
  }, [loadingCatalog, handleRenewCurrentPlan]);

  const handlePlanChangeConfirm = useCallback((amountCents?: number) => {
    if (!modalPlan) return;
    handleRequestPlanChange(modalPlan.key, amountCents);
  }, [modalPlan, handleRequestPlanChange]);

  return (
    <div className="h-screen overflow-hidden bg-[#111318] text-white font-sans flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[15%] w-125 h-125 rounded-full bg-blue-700/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-100 h-100 rounded-full bg-purple-700/8 blur-[120px]" />
      </div>

      {/* Back button — fixed top left */}
      <div className="relative px-6 pt-5 pb-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      <div
        className="relative flex-1 flex flex-col justify-center max-w-4xl w-full mx-auto px-6"
        style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-400 mb-2 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Escoge el plan que impulse tu negocio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
            <span className="text-white">Planes y </span>
            <span className="bg-linear-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Precios</span>
          </h1>
          <p className="text-slate-400 text-xs max-w-md mx-auto mt-1.5">
            Desde tu primera venta hasta escalar con anuncios y experiencias gamificadas.
          </p>
        </div>

        {loadingCatalog ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : catalogError || uiPlans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-400" />
            <p className="text-slate-400 text-sm">No se pudo cargar la información de planes. Intenta de nuevo más tarde.</p>
          </div>
        ) : (
          <>
            {/* Tab toggle */}
            <div className="flex justify-center mb-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1">
                {(['cards', 'table'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}>
                    {tab === 'cards' ? 'Vista tarjetas' : 'Comparar planes'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Cards view ── */}
            {activeTab === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                {uiPlans.map((plan, i) => {
                  const planFeatures = featureRows.filter(f => {
                    const val = f[plan.key.toLowerCase() as keyof typeof f];
                    return val !== false;
                  });

                  return (
                    <div
                      key={plan.key}
                      className={`relative rounded-xl border overflow-hidden transition-all duration-300
                        ${plan.highlight
                          ? 'border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.10)]'
                          : 'border-white/10 hover:border-white/20'
                        }`}
                      style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` }}
                    >
                      {plan.highlight && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 via-purple-500 to-blue-500" />
                      )}

                      {/* Top section */}
                      <div className={`p-4 ${plan.highlight ? 'bg-[#161a2e]' : 'bg-[#16181f]'}`}>
                        {plan.highlight && (
                          <div className="inline-flex items-center bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2">
                            MÁS POPULAR
                          </div>
                        )}

                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                          plan.highlight ? 'bg-blue-500/15 text-blue-400' : 'bg-white/5 text-slate-300'
                        }`}>
                          {plan.icon}
                        </div>

                        <h2 className="text-sm font-bold text-white leading-tight">{plan.name}</h2>
                        <p className="text-slate-400 text-xs mb-3">{plan.description}</p>

                        {/* Price */}
                        <div className="mb-3">
                          <span className="text-2xl font-black text-white">${plan.priceLabel}</span>
                          <span className="text-slate-400 text-xs font-medium ml-1.5">{plan.unit}</span>
                          <span className="text-slate-600 text-xs ml-1">· {plan.billing}</span>
                        </div>

                        {/* CTA */}
                        <button
                          onClick={() => handlePlanClick(plan)}
                          disabled={loading === plan.key}
                          className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2
                            transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                            ${plan.highlight
                              ? 'bg-white text-slate-900 hover:bg-slate-100'
                              : 'bg-white/8 hover:bg-white/14 text-white border border-white/15'
                            }`}
                        >
                          {loading === plan.key
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                            : <>{plan.currentPlan ? 'Recargar' : 'Cambiar de plan'} <ArrowRight className="w-3.5 h-3.5" /></>
                          }
                        </button>
                      </div>

                      {/* Features section */}
                      <div className="px-4 py-3 bg-[#13151b] border-t border-white/6">
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-2">
                          {plan.featuresLabel}
                        </p>
                        <ul className="space-y-1.5">
                          {planFeatures.map(f => {
                            const val = f[plan.key.toLowerCase() as keyof typeof f] as string | boolean;
                            return (
                              <li key={f.label} className="flex items-center gap-2 text-xs text-slate-300">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} />
                                <span>
                                  {f.label}
                                  {typeof val === 'string' && (
                                    <span className="text-slate-500 ml-1">({val})</span>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Table view ── */}
            {activeTab === 'table' && (
              <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s' }}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2">
                      <th className="text-left px-5 py-4 text-slate-400 font-medium text-sm w-[38%]">Funcionalidad</th>
                      {uiPlans.map(p => (
                        <th key={p.key} className={`px-5 py-4 text-center ${p.highlight ? 'bg-blue-600/8' : ''}`}>
                          <div className="font-bold text-white text-base">{p.name}</div>
                          <div className={`text-sm font-black mt-0.5 ${p.highlight ? 'text-blue-400' : 'text-slate-400'}`}>
                            ${p.priceLabel}
                          </div>
                          <div className="text-xs text-slate-500">{p.unit}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map((row, i) => (
                      <tr key={row.label}
                        className={`border-b border-white/6 transition-colors hover:bg-white/2 ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                        <td className="px-5 py-3 text-slate-300">
                          <div className="flex items-center gap-2.5 text-sm">
                            <span className="text-slate-500">{row.icon}</span>
                            {row.label}
                          </div>
                        </td>
                        {(['basic', 'standard', 'premium'] as const).map((key, ci) => {
                          const val = row[key];
                          return (
                            <td key={key} className={`px-5 py-3 text-center ${ci === 1 ? 'bg-blue-600/5' : ''}`}>
                              {val === true
                                ? <Check className="w-4 h-4 text-emerald-500 mx-auto" strokeWidth={2.5} />
                                : val === false
                                  ? <X className="w-4 h-4 text-slate-600 mx-auto" strokeWidth={2} />
                                  : <span className="text-sm text-slate-300 font-medium">{val as string}</span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-white/2">
                      <td className="px-5 py-4" />
                      {uiPlans.map((p, ci) => (
                        <td key={p.key} className={`px-5 py-4 text-center ${ci === 1 ? 'bg-blue-600/5' : ''}`}>
                          <button
                            onClick={() => handlePlanClick(p)}
                            disabled={loading === p.key}
                            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95
                              cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                              ${p.highlight
                                ? 'bg-white text-slate-900 hover:bg-slate-100'
                                : 'bg-white/8 hover:bg-white/15 text-white border border-white/15'
                              }`}
                          >
                            {loading === p.key ? 'Procesando...' : (p.currentPlan ? 'Recargar' : 'Cambiar de plan')}
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-center text-slate-600 text-xs mt-3">
              Los planes Estándar y Premium se activan por inversión, no son suscripciones recurrentes.
            </p>
          </>
        )}
      </div>

      {/* Plan Change Modal */}
      {rechargeConflict ? (
        <RechargeConflictModal
          onGoToRecharge={() => router.push('/commercial/balance')}
          onClose={() => { setRechargeConflict(false); setLoading(null); }}
        />
      ) : modalPlan && (
        <PlanChangeModal
          plan={modalPlan}
          onConfirm={handlePlanChangeConfirm}
          onClose={() => { setModalPlan(null); setLoading(null); }}
          loading={loading === modalPlan.key}
        />
      )}
    </div>
  );
}
