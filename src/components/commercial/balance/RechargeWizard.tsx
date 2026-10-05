'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, Mail, RefreshCw, CheckCircle2, XCircle, Lock, ArrowRightLeft, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { usePlanState } from '../layout/DashboardLayout';
import {
  previewRecharge,
  requestRecharge,
  getRechargeContract,
  rechargeCheckout,
  cancelRecharge,
  getCurrentRecharge,
  reconcileRecharge,
} from '@/services/planRechargeService';
import { getPaymentStatus } from '@/services/planService';
import { getCurrentPlanChangeRequest, cancelPlanChangeRequest } from '@/services/planChangeService';
import { ContractSummaryResponseDTO, ContractStatus } from '@/types/finance/plans/Contract.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import {
  OpenRechargeResponseDTO,
  RechargeNextAction,
  RechargePreviewResponseDTO,
} from '@/types/finance/plans/PlanRecharge.types';
import { PlanChangeRequestResponseDTO } from '@/types/finance/plans/PlanChange.types';
import { formatBudget, formatCents } from '@/utils/currency';
import { isProsperityVisible } from '@/utils/prosperity';
import { useProsperitySummary } from '@/hooks/prosperity/useProsperity';
import { ProsperityThresholdPreview } from '@/components/prosperity/ProsperityThresholdPreview';
import { PLAN_CHANGE_LABELS, isActivePlanChangeRequest, ChangePlanButton } from '../planChange/planChange.shared';
import {
  RECHARGE_PAYMENT_REFERENCE_KEY,
  RECHARGE_RANGES,
  extractApiError,
  WizardActionButton,
  WizardConfirmModal,
} from './balance.shared';

type Step =
  | 'loading'
  | 'ineligible'
  | 'amount'
  | 'open_recharge'
  | 'plan_change_conflict'
  | 'signature'
  | 'payment'
  | 'confirming'
  | 'success';

// El comercial solo puede autocancelar la recarga mientras el contrato siga
// en un estado firmable/firmado. El backend es la fuente de verdad (devuelve
// un message legible si ya no aplica); esto solo decide si mostramos el botón.
const RECHARGE_CANCELABLE_STATUSES: ContractStatus[] = ['APPROVED', 'PENDING_SIGNATURE', 'SIGNED'];

// Botón principal de la tarjeta "Recarga en curso" según `nextAction`.
// WAIT_PAYMENT no tiene acción principal: solo se puede actualizar.
const OPEN_RECHARGE_ACTION_LABELS: Partial<Record<RechargeNextAction, string>> = {
  SIGN: 'Continuar firma',
  PAY: 'Continuar pago',
  RETRY_PAYMENT: 'Reintentar pago',
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
}

const PAYMENT_MAX_POLLS = 8;
const PAYMENT_POLL_INTERVAL_MS = 2500;

const PLAN_LABELS: Record<PlanCode, string> = {
  [PlanCode.BASIC]: 'Personal',
  [PlanCode.STANDARD]: 'Estándar',
  [PlanCode.PREMIUM]: 'Premium',
};

function parseCOP(raw: string) {
  return parseInt(raw.replace(/\D/g, ''), 10) || 0;
}
function formatInput(raw: string) {
  const num = parseCOP(raw);
  if (!num) return '';
  return new Intl.NumberFormat('es-CO').format(num);
}

export function RechargeWizard() {
  const { planState, loadingPlan, refreshPlanState, pollPlanStateAfterRecharge } = usePlanState();
  const [reactivating, setReactivating] = useState(false);
  const [step, setStep] = useState<Step>('loading');
  const [contract, setContract] = useState<ContractSummaryResponseDTO | null>(null);
  const [openRecharge, setOpenRecharge] = useState<OpenRechargeResponseDTO | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showRechargeConfirm, setShowRechargeConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [amountError, setAmountError] = useState('');
  const [checking, setChecking] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<RechargePreviewResponseDTO | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [planChangeConflict, setPlanChangeConflict] = useState<PlanChangeRequestResponseDTO | null>(null);

  // Evita el doble llamado de React Strict Mode en dev — solo debe correr
  // una vez por montaje real.
  const hasInitRef = useRef(false);

  const effectivePlan = planState?.effectivePlan as PlanCode | null | undefined;
  const range = effectivePlan ? RECHARGE_RANGES[effectivePlan] : undefined;

  // Umbral de Prosperidad (solo STANDARD): se calcula sobre el valor NETO de
  // la recarga (requestedAmountPesos), nunca sobre el total con IVA. Mientras
  // el preview se recalcula usamos el monto tecleado para que se actualice en
  // vivo (es el mismo valor neto).
  const isStandardRecharge = (preview?.planCode ?? effectivePlan) === PlanCode.STANDARD;
  const rechargeNetPesos =
    preview && !previewLoading ? preview.requestedAmountPesos : parseCOP(inputValue);
  const { data: prosperity } = useProsperitySummary(effectivePlan === PlanCode.STANDARD);
  const prosperityBalanceCents = isProsperityVisible(prosperity?.status) ? prosperity?.balanceCents : undefined;

  // Fuente de verdad de la recarga en curso: GET /plans/recharge/current.
  // Con recarga → tarjeta "Recarga en curso"; sin recarga → formulario normal.
  // `creditedIfNone`: venimos de un intento de pago o de un 422, así que si ya
  // no hay recarga en curso es porque quedó pagada → refrescamos el saldo.
  const loadCurrentRecharge = async (creditedIfNone = false) => {
    try {
      const current = await getCurrentRecharge();
      if (current) {
        setOpenRecharge(current);
        setStep('open_recharge');
        return;
      }
      if (creditedIfNone) refreshPlanState();
    } catch (err) {
      // Si /current falla caemos al formulario: el preview también trae
      // `openRecharge` y nos devuelve a la tarjeta si hay una en curso.
      console.error('Error consultando la recarga en curso:', err);
    }
    setOpenRecharge(null);
    setContract(null);
    setStep('amount');
  };

  // Errores de /checkout, /cancel y /reconcile: siempre se muestra el
  // `message` del backend. Un 422 significa que el estado cambió (ya estaba
  // pagada, hay un pago en proceso, no se pudo verificar) → re-consultamos.
  const handleRechargeActionError = async (err: unknown) => {
    const { message } = extractApiError(err);
    toast.error(message);
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 422) await loadCurrentRecharge(true);
  };

  // ── Recuperación inicial: si sessionStorage tiene una referencia de pago
  // volvimos de Wompi y hay que verificarlo; si no, se consulta la recarga
  // en curso al backend.
  useEffect(() => {
    if (loadingPlan) return;
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    if (!effectivePlan || effectivePlan === PlanCode.BASIC) {
      setStep('ineligible');
      return;
    }

    const reference = sessionStorage.getItem(RECHARGE_PAYMENT_REFERENCE_KEY);
    if (reference) {
      setStep('confirming');
      return;
    }

    loadCurrentRecharge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPlan, effectivePlan]);

  // ── Paso "confirmando pago": mismo patrón que la página de resultado de
  // /plans/checkout — poll de getPaymentStatus tras volver de Wompi.
  useEffect(() => {
    if (step !== 'confirming') return;
    const reference = sessionStorage.getItem(RECHARGE_PAYMENT_REFERENCE_KEY);
    if (!reference) {
      loadCurrentRecharge();
      return;
    }
    let cancelled = false;
    let tries = 0;

    // Sin pago confirmado (rechazado, checkout cerrado, o sigue pendiente):
    // no nos quedamos bloqueados aquí — volvemos a la recarga en curso, que
    // ofrece continuar/reintentar el pago, cancelar o reconciliar.
    const fallBackToCurrent = () => {
      sessionStorage.removeItem(RECHARGE_PAYMENT_REFERENCE_KEY);
      loadCurrentRecharge(true);
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await getPaymentStatus(reference);
        if (cancelled) return;
        if (result.wompiStatus === 'APPROVED') {
          sessionStorage.removeItem(RECHARGE_PAYMENT_REFERENCE_KEY);
          setPaymentMessage(result.message);
          setStep('success');
          // El backend levanta la suspensión del presupuesto cuando el
          // webhook de pago confirma — puede tardar unos segundos. Hacemos
          // polling corto del estado del plan hasta que el saldo deje de
          // estar agotado, para que banner/badge/bloqueos se quiten solos.
          setReactivating(true);
          pollPlanStateAfterRecharge().finally(() => setReactivating(false));
          return;
        }
        if (result.wompiStatus === 'DECLINED' || result.wompiStatus === 'ERROR') {
          if (result.message) toast.error(result.message);
          fallBackToCurrent();
          return;
        }
      } catch {
        /* seguimos reintentando hasta agotar los intentos */
      }
      tries += 1;
      if (cancelled) return;
      if (tries >= PAYMENT_MAX_POLLS) {
        fallBackToCurrent();
        return;
      }
      setTimeout(poll, PAYMENT_POLL_INTERVAL_MS);
    };

    const initial = setTimeout(poll, 1200);
    return () => {
      cancelled = true;
      clearTimeout(initial);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Preview de la recarga — se recalcula en cada cambio de monto
  // (debounce) y decide si el botón de confirmar queda habilitado.
  useEffect(() => {
    if (step !== 'amount') return;
    const amount = parseCOP(inputValue);
    if (!amount) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      previewRecharge(amount * 100)
        .then((result) => {
          // Hay una recarga en curso que /current no alcanzó a reportar:
          // mostramos la tarjeta en vez de un aviso sin acciones.
          if (result.openRecharge) {
            setOpenRecharge(result.openRecharge);
            setStep('open_recharge');
            return;
          }
          setPreview(result);
        })
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, step]);

  // Intenta crear el contrato de recarga. Si el backend responde 422, puede
  // ser porque hay un cambio de plan en curso que bloquea la recarga — en
  // ese caso mostramos esa solicitud con opción de cancelarla y reintentar
  // en vez de solo mostrar el error (rate limit u otro 422 cae al toast).
  const attemptRequestRecharge = async (amountCents: number): Promise<'success' | 'conflict' | 'error'> => {
    try {
      const result = await requestRecharge(amountCents);
      setContract(result);
      setStep('signature');
      return 'success';
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        try {
          const current = await getCurrentPlanChangeRequest();
          if (isActivePlanChangeRequest(current)) {
            setPlanChangeConflict(current);
            setStep('plan_change_conflict');
            return 'conflict';
          }
        } catch {
          /* no se pudo confirmar el conflicto — cae al toast genérico */
        }
      }
      const { message } = extractApiError(err);
      toast.error(message);
      return 'error';
    }
  };

  // Valida el monto y abre el modal de confirmación — generar el contrato es
  // una acción que el comercial solo puede hacer una vez al día.
  const handleSubmitAmount = () => {
    if (submitting) return;
    const amount = parseCOP(inputValue);
    if (!amount) {
      setAmountError('Ingresa un monto');
      return;
    }
    if (!preview?.eligible) return;
    if (range) {
      if (amount < range.min) {
        setAmountError(`El monto mínimo es ${formatBudget(range.min)}`);
        return;
      }
      if (range.max && amount > range.max) {
        setAmountError(`El monto máximo es ${formatBudget(range.max)}`);
        return;
      }
    }
    setAmountError('');
    setShowRechargeConfirm(true);
  };

  const confirmGenerateRecharge = async () => {
    const amount = parseCOP(inputValue);
    if (!amount) return;
    setSubmitting(true);
    try {
      await attemptRequestRecharge(amount * 100);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPlanChangeAndRetry = async () => {
    if (!planChangeConflict || submitting) return;
    setSubmitting(true);
    try {
      await cancelPlanChangeRequest(planChangeConflict.id);
      setPlanChangeConflict(null);
      const outcome = await attemptRequestRecharge(parseCOP(inputValue) * 100);
      if (outcome === 'error') setStep('amount');
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckSignature = async () => {
    if (!contract || checking) return;
    setChecking(true);
    try {
      const fresh = await getRechargeContract(contract.contractId);
      setContract(fresh);
      if (fresh.status === 'SIGNED') {
        setStep('payment');
      } else if (fresh.status === 'REJECTED') {
        toast.error('Tu solicitud de recarga fue rechazada.');
        setOpenRecharge(null);
        setContract(null);
        setStep('amount');
      } else {
        toast('Tu contrato de recarga todavía no ha sido firmado.');
      }
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setChecking(false);
    }
  };

  // La recarga sobre la que actúan pagar/cancelar/reconciliar: la tarjeta
  // "Recarga en curso" o el contrato del flujo nuevo (misma recarga si se
  // retomó la firma desde la tarjeta).
  const activeContractId = openRecharge?.contractId ?? contract?.contractId;

  // Sirve tanto para el primer pago como para retomarlo o reintentarlo: el
  // backend genera un checkout nuevo cada vez.
  const handlePay = async () => {
    if (activeContractId == null || submitting) return;
    setSubmitting(true);
    try {
      const checkout = await rechargeCheckout(activeContractId);
      sessionStorage.setItem(RECHARGE_PAYMENT_REFERENCE_KEY, checkout.reference);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      await handleRechargeActionError(err);
      setSubmitting(false);
    }
  };

  // "Continuar firma" desde la tarjeta: reutiliza el paso de firma del flujo
  // normal con el contrato de la recarga en curso.
  const handleContinueSignature = async () => {
    if (!openRecharge || submitting) return;
    setSubmitting(true);
    try {
      const fresh = await getRechargeContract(openRecharge.contractId);
      setContract(fresh);
      setStep(fresh.status === 'SIGNED' ? 'payment' : 'signature');
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // "Ya pagué y no se refleja" / "Actualizar": verifica el pago contra Wompi.
  const handleReconcile = async () => {
    if (!openRecharge || reconciling) return;
    setReconciling(true);
    try {
      const updated = await reconcileRecharge(openRecharge.contractId);
      if (updated) {
        setOpenRecharge(updated);
        return;
      }
      // 204: la recarga quedó pagada.
      sessionStorage.removeItem(RECHARGE_PAYMENT_REFERENCE_KEY);
      setOpenRecharge(null);
      setContract(null);
      setPaymentMessage(null);
      setStep('success');
      setReactivating(true);
      pollPlanStateAfterRecharge().finally(() => setReactivating(false));
    } catch (err) {
      await handleRechargeActionError(err);
    } finally {
      setReconciling(false);
    }
  };

  // Autocancelación de la recarga en curso — desbloquea al comercial que dejó
  // una recarga a medias y quiere pedir otra o un cambio de plan.
  const canCancelRecharge =
    (step === 'open_recharge' && !!openRecharge && openRecharge.nextAction !== 'WAIT_PAYMENT') ||
    (!!contract &&
      (step === 'signature' || step === 'payment') &&
      RECHARGE_CANCELABLE_STATUSES.includes(contract.status));

  const handleCancelRecharge = () => {
    if (activeContractId == null || cancelling || submitting) return;
    setShowCancelConfirm(true);
  };

  const confirmCancelRecharge = async () => {
    if (activeContractId == null) return;
    setCancelling(true);
    try {
      await cancelRecharge(activeContractId);
      sessionStorage.removeItem(RECHARGE_PAYMENT_REFERENCE_KEY);
      setContract(null);
      setOpenRecharge(null);
      setInputValue('');
      setPreview(null);
      setAmountError('');
      refreshPlanState();
      toast.success('Recarga cancelada');
      setStep('amount');
    } catch (err) {
      await handleRechargeActionError(err);
    } finally {
      setCancelling(false);
    }
  };

  const openRechargeActionLabel = openRecharge ? OPEN_RECHARGE_ACTION_LABELS[openRecharge.nextAction] : undefined;

  const cancelRechargeButton = canCancelRecharge ? (
    <button
      type="button"
      onClick={handleCancelRecharge}
      disabled={cancelling || submitting || checking || reconciling}
      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
    >
      {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
      {cancelling ? 'Cancelando recarga...' : 'Cancelar recarga'}
    </button>
  ) : null;

  if (step === 'loading' || loadingPlan) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (step === 'ineligible') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Recarga no disponible</h2>
          <p className="text-sm text-gray-500">
            La recarga con contrato aplica solo para los planes Estándar y Premium. Si tienes el plan Personal, renuévalo
            desde la página de planes.
          </p>
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-14">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Recargar saldo publicitario</h2>
        <p className="text-sm text-gray-500">
          Plan {effectivePlan ? PLAN_LABELS[effectivePlan] : ''} · Saldo actual{' '}
          {formatBudget(formatCents(planState?.remainingBudgetCents ?? 0))}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
        {step === 'amount' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">¿Cuánto quieres recargar?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(formatInput(e.target.value));
                    setAmountError('');
                  }}
                  placeholder="Ej: 2.500.000"
                  className={`w-full border rounded-xl py-3 pl-8 pr-16 text-lg font-bold outline-none transition-all
                    ${
                      amountError
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-[#03548C]/30 focus:border-[#03548C]'
                    }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">COP</span>
              </div>
              {amountError && <p className="text-xs text-red-500 mt-1.5">{amountError}</p>}
            </div>

            {previewLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Calculando...
              </div>
            )}

            {!previewLoading && preview && (
              <div
                className={`rounded-xl border p-4 space-y-1.5 text-sm ${
                  preview.eligible
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <p className="font-medium">{preview.message}</p>
                {preview.eligible && (
                  <div className="text-xs space-y-2 pt-1">
                    <div className="space-y-0.5 opacity-80">
                      <div className="flex justify-between gap-4">
                        <span>Monto de la recarga</span>
                        <span>{formatBudget(preview.requestedAmountPesos)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>IVA</span>
                        <span>{formatBudget(preview.vatAmountPesos)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-blue-200 pt-1.5 text-sm font-bold">
                      <span>Total a pagar</span>
                      <span>{formatBudget(preview.totalToPayPesos)}</span>
                    </div>
                    <div className="space-y-0.5 opacity-80">
                      <p>
                        Se acreditan {formatBudget(preview.estimatedCreditedAmountPesos)} a tu saldo publicitario.
                      </p>
                      <p>Saldo resultante: {formatBudget(preview.resultingWalletBalancePesos)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isStandardRecharge && rechargeNetPesos > 0 && (
              <ProsperityThresholdPreview
                netPesos={rechargeNetPesos}
                help="Equivale a 4 veces el valor neto de tu inversión (sin IVA). Se suma a tu Saldo de Prosperidad al confirmarse el pago; las ventas cubiertas por ese Saldo no pagan comisión."
                currentBalanceCents={prosperityBalanceCents}
              />
            )}

            {!preview && !previewLoading && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <CreditCard className="w-5 h-5 text-[#03548C] shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  Generaremos un contrato de recarga por este monto. Deberás firmarlo electrónicamente antes de poder pagar.
                </p>
              </div>
            )}

            <WizardActionButton
              submitting={submitting}
              onClick={handleSubmitAmount}
              label="Generar contrato de recarga"
              disabled={!preview?.eligible}
            />
          </div>
        )}

        {step === 'open_recharge' && openRecharge && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Recarga en curso</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{openRecharge.message}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between gap-4">
                <span>Monto de la recarga</span>
                <span>{formatBudget(openRecharge.amountPesos)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>IVA</span>
                <span>{formatBudget(openRecharge.vatAmountPesos)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-1.5 font-bold text-gray-900">
                <span>Total a pagar</span>
                <span>{formatBudget(openRecharge.totalToPayPesos)}</span>
              </div>
              {openRecharge.expiresAt && (
                <p className="text-xs text-gray-500 pt-1.5">
                  Vence el {formatDateTime(openRecharge.expiresAt)}. Si no se paga antes, se cancela automáticamente.
                </p>
              )}
            </div>

            <div className="space-y-2 text-center">
              {openRechargeActionLabel ? (
                <WizardActionButton
                  submitting={submitting}
                  onClick={openRecharge.nextAction === 'SIGN' ? handleContinueSignature : handlePay}
                  label={openRechargeActionLabel}
                  disabled={cancelling || reconciling}
                />
              ) : (
                <button
                  type="button"
                  onClick={handleReconcile}
                  disabled={reconciling}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
                >
                  {reconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Actualizar
                </button>
              )}
              {cancelRechargeButton}
              {openRecharge.paymentAttempted && openRechargeActionLabel && (
                <button
                  type="button"
                  onClick={handleReconcile}
                  disabled={reconciling || submitting || cancelling}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#03548C] hover:underline transition disabled:opacity-50 cursor-pointer"
                >
                  {reconciling && <Loader2 className="w-4 h-4 animate-spin" />}
                  {reconciling ? 'Verificando tu pago...' : 'Ya pagué y no se refleja'}
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'plan_change_conflict' && planChangeConflict && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <ArrowRightLeft className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tienes un cambio de plan en curso</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ya tienes una solicitud para cambiar a {PLAN_CHANGE_LABELS[planChangeConflict.toPlanCode]} en curso.
                Debes cancelarla antes de poder recargar saldo.
              </p>
            </div>
            <WizardActionButton
              submitting={submitting}
              onClick={handleCancelPlanChangeAndRetry}
              label="Cancelar cambio de plan y continuar"
            />
            <Link
              href="/commercial/plan-change"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:underline transition"
            >
              Ver detalle del cambio de plan
            </Link>
          </div>
        )}

        {step === 'signature' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-[#03548C]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Contrato enviado a firma</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Te enviamos un correo con el enlace para firmar electrónicamente tu contrato de recarga. Revisa tu bandeja
                de entrada (y la carpeta de spam) y completa la firma para continuar.
              </p>
              {contract && <p className="text-xs text-gray-400 mt-3">Versión {contract.version}</p>}
            </div>
            <button
              type="button"
              onClick={handleCheckSignature}
              disabled={checking}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Ya firmé, verificar estado
            </button>
            {cancelRechargeButton}
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Contrato firmado — falta el pago</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Realiza el pago para acreditar la recarga en tu saldo publicitario.
              </p>
            </div>
            <WizardActionButton submitting={submitting} onClick={handlePay} label="Pagar ahora" />
            {cancelRechargeButton}
          </div>
        )}

        {step === 'confirming' && (
          <div className="space-y-6 text-center py-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#03548C] mx-auto" />
            <p className="text-sm text-gray-600">Estamos verificando tu pago con Wompi...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¡Recarga exitosa!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{paymentMessage || 'Tu saldo fue actualizado.'}</p>
            </div>
            {reactivating && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando tu recarga… reactivando tus anuncios y campañas.
              </div>
            )}
            <Link
              href="/commercial/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
            >
              Volver al panel
            </Link>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">¿Quieres cambiar de plan?</p>
        <ChangePlanButton />
      </div>

      <WizardConfirmModal
        isOpen={showRechargeConfirm}
        title="Genera tu contrato de recarga"
        description="Solo puedes generar una recarga de saldo una vez al día. Revisa que el monto sea correcto antes de continuar; si te equivocas tendrás que esperar hasta mañana para volver a intentarlo."
        confirmLabel="Generar contrato"
        cancelLabel="Revisar el monto"
        tone="warning"
        onConfirm={confirmGenerateRecharge}
        onClose={() => setShowRechargeConfirm(false)}
      />

      <WizardConfirmModal
        isOpen={showCancelConfirm}
        title="Cancelar esta recarga"
        description="Se anulará el contrato de recarga en curso. Tendrás que volver a solicitarla si cambias de opinión, y recuerda que solo puedes generar una recarga al día."
        confirmLabel="Cancelar recarga"
        cancelLabel="Volver"
        tone="danger"
        onConfirm={confirmCancelRecharge}
        onClose={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
