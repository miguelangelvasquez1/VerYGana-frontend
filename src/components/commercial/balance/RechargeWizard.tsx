'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, Mail, RefreshCw, CheckCircle2, XCircle, Lock, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { usePlanState } from '../layout/DashboardLayout';
import {
  previewRecharge,
  requestRecharge,
  getRechargeContract,
  rechargeCheckout,
  cancelRecharge,
} from '@/services/planRechargeService';
import { getPaymentStatus } from '@/services/planService';
import { getCurrentPlanChangeRequest, cancelPlanChangeRequest } from '@/services/planChangeService';
import { ContractSummaryResponseDTO, ContractStatus } from '@/types/finance/plans/Contract.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { RechargePreviewResponseDTO } from '@/types/finance/plans/PlanRecharge.types';
import { PlanChangeRequestResponseDTO } from '@/types/finance/plans/PlanChange.types';
import { formatBudget, formatCents } from '@/utils/currency';
import { PLAN_CHANGE_LABELS, isActivePlanChangeRequest, ChangePlanButton } from '../planChange/planChange.shared';
import {
  RECHARGE_CONTRACT_ID_KEY,
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
  | 'plan_change_conflict'
  | 'signature'
  | 'payment'
  | 'confirming'
  | 'success'
  | 'declined'
  | 'cancelled';

// El comercial solo puede autocancelar la recarga mientras el contrato siga
// en un estado firmable/firmado y todavía no haya generado el pago. El backend
// es la fuente de verdad (devuelve un message legible si ya no aplica); esto
// solo decide si mostramos el botón.
const RECHARGE_CANCELABLE_STATUSES: ContractStatus[] = ['APPROVED', 'PENDING_SIGNATURE', 'SIGNED'];

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

  // ── Recuperación inicial: sessionStorage puede tener una referencia de
  // pago (volvimos de Wompi) o un contractId (refresh a mitad del flujo).
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

    const contractId = sessionStorage.getItem(RECHARGE_CONTRACT_ID_KEY);
    if (contractId) {
      getRechargeContract(Number(contractId))
        .then((c) => {
          setContract(c);
          if (c.status === 'SIGNED') setStep('payment');
          else if (c.status === 'REJECTED') {
            sessionStorage.removeItem(RECHARGE_CONTRACT_ID_KEY);
            setStep('amount');
          } else setStep('signature');
        })
        .catch(() => {
          sessionStorage.removeItem(RECHARGE_CONTRACT_ID_KEY);
          setStep('amount');
        });
      return;
    }

    setStep('amount');
  }, [loadingPlan, effectivePlan]);

  // ── Paso "confirmando pago": mismo patrón que la página de resultado de
  // /plans/checkout — poll de getPaymentStatus tras volver de Wompi.
  useEffect(() => {
    if (step !== 'confirming') return;
    const reference = sessionStorage.getItem(RECHARGE_PAYMENT_REFERENCE_KEY);
    if (!reference) {
      setStep('amount');
      return;
    }
    let cancelled = false;
    let tries = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const result = await getPaymentStatus(reference);
        if (cancelled) return;
        if (result.wompiStatus === 'APPROVED') {
          sessionStorage.removeItem(RECHARGE_PAYMENT_REFERENCE_KEY);
          sessionStorage.removeItem(RECHARGE_CONTRACT_ID_KEY);
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
          setPaymentMessage(result.message);
          setStep('declined');
          return;
        }
      } catch {
        /* seguimos reintentando hasta agotar los intentos */
      }
      tries += 1;
      if (tries >= PAYMENT_MAX_POLLS) return;
      if (!cancelled) setTimeout(poll, PAYMENT_POLL_INTERVAL_MS);
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
        .then(setPreview)
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
      sessionStorage.setItem(RECHARGE_CONTRACT_ID_KEY, String(result.contractId));
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
        sessionStorage.removeItem(RECHARGE_CONTRACT_ID_KEY);
        toast.error('Tu solicitud de recarga fue rechazada.');
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

  const handlePay = async () => {
    if (!contract || submitting) return;
    setSubmitting(true);
    try {
      const checkout = await rechargeCheckout(contract.contractId);
      sessionStorage.setItem(RECHARGE_PAYMENT_REFERENCE_KEY, checkout.reference);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
      setSubmitting(false);
    }
  };

  // Autocancelación de la recarga en curso — desbloquea al comercial que dejó
  // una recarga a medias y quiere en su lugar pedir un cambio de plan.
  const canCancelRecharge =
    !!contract &&
    (step === 'signature' || step === 'payment') &&
    RECHARGE_CANCELABLE_STATUSES.includes(contract.status);

  const handleCancelRecharge = () => {
    if (!contract || cancelling || submitting) return;
    setShowCancelConfirm(true);
  };

  const confirmCancelRecharge = async () => {
    if (!contract) return;
    setCancelling(true);
    try {
      await cancelRecharge(contract.contractId);
      sessionStorage.removeItem(RECHARGE_CONTRACT_ID_KEY);
      sessionStorage.removeItem(RECHARGE_PAYMENT_REFERENCE_KEY);
      setContract(null);
      setInputValue('');
      setPreview(null);
      refreshPlanState();
      toast.success('Recarga cancelada');
      setStep('cancelled');
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  const cancelRechargeButton = canCancelRecharge ? (
    <button
      type="button"
      onClick={handleCancelRecharge}
      disabled={cancelling || submitting || checking}
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
                  <div className="text-xs opacity-80 space-y-0.5">
                    <p>
                      Pagas {formatBudget(preview.requestedAmountPesos)}, se acreditan{' '}
                      {formatBudget(preview.estimatedCreditedAmountPesos)} a tu saldo publicitario.
                    </p>
                    <p>Saldo resultante: {formatBudget(preview.resultingWalletBalancePesos)}</p>
                  </div>
                )}
              </div>
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

        {step === 'cancelled' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Recarga cancelada</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cancelamos tu contrato de recarga. Puedes solicitar una recarga nueva cuando quieras o pedir un cambio de
                plan.
              </p>
            </div>
            <WizardActionButton
              submitting={false}
              onClick={() => {
                setAmountError('');
                setStep('amount');
              }}
              label="Solicitar nueva recarga"
            />
          </div>
        )}

        {step === 'declined' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pago rechazado</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {paymentMessage || 'Tu banco o Wompi rechazó el pago. No se realizó ningún cargo.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(RECHARGE_PAYMENT_REFERENCE_KEY);
                setStep('payment');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors cursor-pointer"
            >
              Intentar de nuevo
            </button>
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
