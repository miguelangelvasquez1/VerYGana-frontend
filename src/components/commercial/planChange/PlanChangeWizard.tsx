'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRightLeft, CheckCircle2, Clock3, CreditCard, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { usePlanState } from '../layout/DashboardLayout';
import {
  getCurrentPlanChangeRequest,
  approvePlanChangeContract,
  cancelPlanChangeRequest,
  acknowledgePlanChangeRejection,
  topUpCheckout,
} from '@/services/planChangeService';
import { getPaymentStatus } from '@/services/planService';
import { PlanChangeRequestResponseDTO } from '@/types/finance/plans/PlanChange.types';
import { formatBudget, formatCents } from '@/utils/currency';
import { WizardActionButton, WizardConfirmModal } from '../balance/balance.shared';
import {
  PLANCHANGE_TOPUP_REFERENCE_KEY,
  PLAN_CHANGE_LABELS,
  extractApiError,
} from './planChange.shared';

type Step =
  | 'loading'
  | 'empty'
  | 'review'
  | 'awaiting_verygana'
  | 'top_up'
  | 'applying'
  | 'confirming_payment'
  | 'success'
  | 'rejected'
  | 'cancelled';

const PAYMENT_MAX_POLLS = 8;
const PAYMENT_POLL_INTERVAL_MS = 2500;

function deriveStep(r: PlanChangeRequestResponseDTO): Step {
  if (r.status === 'APPLIED') return 'success';
  if (r.status === 'REJECTED' || r.contractStatus === 'REJECTED') return 'rejected';
  if (r.status === 'CANCELLED') return 'cancelled';
  if (r.contractStatus === 'SIGNED') {
    if (r.status === 'PAYMENT_PENDING' && r.requiredTopUpAmountCents && r.requiredTopUpAmountCents > 0) return 'top_up';
    return 'applying';
  }
  if (r.contractStatus === 'PENDING_BUSINESS_REVIEW' || r.contractStatus == null) return 'review';
  // PENDING_VERYGANA_REVIEW | APPROVED | PENDING_SIGNATURE
  return 'awaiting_verygana';
}

export function PlanChangeWizard() {
  const { refreshPlanState } = usePlanState();
  const [step, setStep] = useState<Step>('loading');
  const [request, setRequest] = useState<PlanChangeRequestResponseDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadingDoc, setReloadingDoc] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const hasInitRef = useRef(false);

  const loadCurrent = async () => {
    const current = await getCurrentPlanChangeRequest();
    if (!current) {
      setRequest(null);
      setStep('empty');
      return null;
    }
    setRequest(current);
    setStep(deriveStep(current));
    return current;
  };

  // El otrosí (contractDownloadUrl) tiene TTL corto — no se cachea; se
  // re-obtiene con GET /current al abrir la vista o al pulsar "Recargar".
  const contractDownloadUrl = request?.contractDownloadUrl ?? null;

  const handleReloadDoc = async () => {
    if (reloadingDoc) return;
    setReloadingDoc(true);
    try {
      await loadCurrent();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setReloadingDoc(false);
    }
  };

  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    // Si volvimos de Wompi (abono de cambio de plan pagado), primero hay
    // que confirmar el pago antes de mostrar cualquier otro paso.
    const topUpReference = sessionStorage.getItem(PLANCHANGE_TOPUP_REFERENCE_KEY);
    if (topUpReference) {
      setStep('confirming_payment');
      return;
    }

    loadCurrent().catch((err) => {
      const { message } = extractApiError(err);
      toast.error(message);
      setStep('empty');
    });
  }, []);

  // Mientras VerYGana revisa el otrosí no hacemos polling automático — el
  // comercial actualiza el estado manualmente con "Verificar estado".

  // ── El cambio no requiere abono: el backend lo aplica solo apenas firma
  // — esperamos brevemente a que status pase a APPLIED.
  useEffect(() => {
    if (step !== 'applying') return;
    let cancelled = false;
    let tries = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const current = await getCurrentPlanChangeRequest();
        if (cancelled) return;
        if (current) {
          setRequest(current);
          if (current.status === 'APPLIED') {
            refreshPlanState();
            setStep('success');
            return;
          }
        }
      } catch {
        /* reintentamos hasta agotar los intentos */
      }
      tries += 1;
      if (tries >= PAYMENT_MAX_POLLS) return;
      if (!cancelled) setTimeout(poll, PAYMENT_POLL_INTERVAL_MS);
    };

    const timer = setTimeout(poll, PAYMENT_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Confirmando el pago del abono tras volver de Wompi.
  useEffect(() => {
    if (step !== 'confirming_payment') return;
    const reference = sessionStorage.getItem(PLANCHANGE_TOPUP_REFERENCE_KEY);
    if (!reference) {
      loadCurrent().catch(() => setStep('empty'));
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
          sessionStorage.removeItem(PLANCHANGE_TOPUP_REFERENCE_KEY);
          setPaymentMessage(result.message);
          setStep('applying');
          return;
        }
        if (result.wompiStatus === 'DECLINED' || result.wompiStatus === 'ERROR') {
          setPaymentMessage(result.message);
          setStep('top_up');
          sessionStorage.removeItem(PLANCHANGE_TOPUP_REFERENCE_KEY);
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
  }, [step]);

  // Cada solicitud nueva exige volver a leer el otrosí antes de aprobar.
  useEffect(() => {
    setReviewed(false);
  }, [request?.id]);

  const handleApprove = () => {
    if (!request?.contractId || !reviewed || submitting) return;
    setShowApproveConfirm(true);
  };

  const confirmApprove = async () => {
    if (!request?.contractId) return;
    setSubmitting(true);
    try {
      await approvePlanChangeContract(request.contractId);
      await loadCurrent();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!request || submitting) return;
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      const cancelled = await cancelPlanChangeRequest(request.id);
      setRequest(cancelled);
      setStep(deriveStep(cancelled));
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledgeRejection = async () => {
    if (!request || submitting) return;
    setSubmitting(true);
    try {
      await acknowledgePlanChangeRejection(request.id);
      // /current ahora devuelve null -> loadCurrent deja el paso en 'empty'
      // y el comercial puede iniciar una solicitud nueva desde cero.
      await loadCurrent();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshAwait = async () => {
    setSubmitting(true);
    try {
      await loadCurrent();
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopUpPay = async () => {
    if (!request || submitting) return;
    setSubmitting(true);
    try {
      const checkout = await topUpCheckout(request.id);
      sessionStorage.setItem(PLANCHANGE_TOPUP_REFERENCE_KEY, checkout.reference);
      window.location.href = checkout.checkoutUrl;
    } catch (err) {
      const { message } = extractApiError(err);
      toast.error(message);
      setSubmitting(false);
    }
  };

  if (step === 'loading' || step === 'confirming_payment') {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-[#03548C] mx-auto" />
        {step === 'confirming_payment' && <p className="text-sm text-gray-600">Estamos verificando tu pago con Wompi...</p>}
      </div>
    );
  }

  if (step === 'empty') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-gray-900">No tienes una solicitud de cambio de plan en curso</h2>
          <p className="text-sm text-gray-500">Puedes pedir un cambio de plan desde la página de planes.</p>
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

  if (!request) return null;

  const targetLabel = PLAN_CHANGE_LABELS[request.toPlanCode];
  const canCancel = request.contractStatus !== 'SIGNED' && (step === 'review' || step === 'awaiting_verygana');

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-14">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cambio de plan</h2>
        <p className="text-sm text-gray-500">
          {request.fromPlanCode ? `${PLAN_CHANGE_LABELS[request.fromPlanCode]} → ` : ''}
          {targetLabel}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
        {step === 'review' && (
          <div className="space-y-6 py-2">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <ArrowRightLeft className="w-8 h-8 text-[#03548C]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Revisa y aprueba el otrosí</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Lee el otrosí de tu cambio de plan. Al aprobarlo lo enviamos a revisión de VerYGana.
                </p>
              </div>
            </div>

            <dl className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-gray-500">Plan actual</dt>
                <dd className="font-semibold text-gray-900">
                  {request.fromPlanCode ? PLAN_CHANGE_LABELS[request.fromPlanCode] : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-gray-500">Plan nuevo</dt>
                <dd className="font-semibold text-gray-900">{targetLabel}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <dt className="text-gray-500">Abono a pagar</dt>
                <dd className="font-semibold text-gray-900">
                  {request.requiredTopUpAmountCents && request.requiredTopUpAmountCents > 0
                    ? formatBudget(formatCents(request.requiredTopUpAmountCents))
                    : 'Sin abono'}
                </dd>
              </div>
            </dl>

            {contractDownloadUrl ? (
              <div className="space-y-2">
                <iframe
                  src={contractDownloadUrl}
                  title="Otrosí del cambio de plan"
                  className="w-full h-96 rounded-xl border border-gray-200 bg-gray-50"
                />
                <div className="flex items-center justify-between text-xs">
                  <a
                    href={contractDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#03548C] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir en una pestaña nueva
                  </a>
                  <button
                    type="button"
                    onClick={handleReloadDoc}
                    disabled={reloadingDoc}
                    className="inline-flex items-center gap-1.5 font-semibold text-gray-500 hover:text-gray-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {reloadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Recargar documento
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  El enlace del documento caduca a los pocos minutos. Si no carga, pulsa &ldquo;Recargar documento&rdquo;.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center space-y-3">
                <p className="text-sm text-gray-600">El otrosí todavía se está generando.</p>
                <button
                  type="button"
                  onClick={handleReloadDoc}
                  disabled={reloadingDoc}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-white transition disabled:opacity-50 cursor-pointer"
                >
                  {reloadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Recargar
                </button>
              </div>
            )}

            <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={reviewed}
                disabled={!contractDownloadUrl}
                onChange={(e) => setReviewed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#03548C] disabled:opacity-50"
              />
              <span>He revisado el otrosí de mi cambio de plan y estoy de acuerdo con sus términos.</span>
            </label>

            <div className="space-y-2">
              <WizardActionButton
                submitting={submitting}
                onClick={handleApprove}
                label="Aprobar otrosí"
                disabled={!contractDownloadUrl || !reviewed}
              />
              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:underline transition disabled:opacity-50 cursor-pointer"
                >
                  Cancelar solicitud
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'awaiting_verygana' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Clock3 className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Otrosí en revisión</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Aprobaste el otrosí — ahora el equipo de VERyGANA lo está revisando y la firma se dispara automáticamente
                una vez aprobado. Te notificaremos por correo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshAwait}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Verificar estado
            </button>
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="block w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:underline transition disabled:opacity-50 cursor-pointer"
              >
                Cancelar solicitud
              </button>
            )}
          </div>
        )}

        {step === 'top_up' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Otrosí firmado — falta el abono</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tu cambio a {targetLabel} requiere un abono de{' '}
                {formatBudget(formatCents(request.requiredTopUpAmountCents ?? 0))}. Realiza el pago para que el cambio se
                aplique.
              </p>
              {paymentMessage && <p className="text-xs text-red-500 mt-2">{paymentMessage}</p>}
            </div>
            <WizardActionButton submitting={submitting} onClick={handleTopUpPay} label="Pagar ahora" />
          </div>
        )}

        {step === 'applying' && (
          <div className="space-y-6 text-center py-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#03548C] mx-auto" />
            <p className="text-sm text-gray-600">Estamos aplicando tu cambio de plan...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¡Tu cambio de plan fue aplicado!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ahora tienes el plan {targetLabel}.</p>
            </div>
            <Link
              href="/commercial/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
            >
              Volver al panel
            </Link>
          </div>
        )}

        {step === 'rejected' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tu solicitud fue rechazada</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nuestro equipo de VERyGANA revisó tu solicitud de cambio de plan a {targetLabel} y no fue aprobada.
              </p>
            </div>

            {request.rejectionReason && (
              <div className="text-left bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Motivo</p>
                <p className="text-sm text-red-800 leading-relaxed whitespace-pre-line">{request.rejectionReason}</p>
              </div>
            )}

            {request.status === 'REJECTED' ? (
              <>
                <WizardActionButton
                  submitting={submitting}
                  onClick={handleAcknowledgeRejection}
                  label="Entendido"
                />
                <p className="text-xs text-gray-400">
                  Al confirmar podrás iniciar una nueva solicitud de cambio de plan desde la página de planes.
                </p>
              </>
            ) : (
              <Link
                href="/plans"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
              >
                Ver planes
              </Link>
            )}
          </div>
        )}

        {step === 'cancelled' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Solicitud cancelada</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Puedes iniciar una nueva solicitud cuando quieras.</p>
            </div>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
            >
              Ver planes
            </Link>
          </div>
        )}
      </div>

      <WizardConfirmModal
        isOpen={showApproveConfirm}
        title="Aprobar el otrosí"
        description={`Al aprobar, tu cambio a ${targetLabel} pasa a revisión de VerYGana y ya no podrás cancelar la solicitud. Asegúrate de que los datos del cambio son correctos.`}
        confirmLabel="Aprobar cambio"
        cancelLabel="Revisar de nuevo"
        tone="primary"
        onConfirm={confirmApprove}
        onClose={() => setShowApproveConfirm(false)}
      />

      <WizardConfirmModal
        isOpen={showCancelConfirm}
        title="Cancelar la solicitud de cambio de plan"
        description={`Se anulará tu solicitud de cambio a ${targetLabel}. Si cambias de opinión tendrás que iniciar una nueva desde la página de planes.`}
        confirmLabel="Cancelar solicitud"
        cancelLabel="Volver"
        tone="danger"
        onConfirm={confirmCancel}
        onClose={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
