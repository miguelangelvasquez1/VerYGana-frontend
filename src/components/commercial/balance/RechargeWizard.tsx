'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, Mail, RefreshCw, CheckCircle2, XCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { usePlanState } from '../layout/DashboardLayout';
import { requestRecharge, getRechargeContract, rechargeCheckout } from '@/services/planRechargeService';
import { getPaymentStatus } from '@/services/planService';
import { ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { formatBudget, formatCents } from '@/utils/currency';
import {
  RECHARGE_CONTRACT_ID_KEY,
  RECHARGE_PAYMENT_REFERENCE_KEY,
  RECHARGE_RANGES,
  extractApiError,
  WizardActionButton,
} from './balance.shared';

type Step = 'loading' | 'ineligible' | 'amount' | 'signature' | 'payment' | 'confirming' | 'success' | 'declined';

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
  const { planState, loadingPlan, refreshPlanState } = usePlanState();
  const [step, setStep] = useState<Step>('loading');
  const [contract, setContract] = useState<ContractSummaryResponseDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [amountError, setAmountError] = useState('');
  const [checking, setChecking] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

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
          refreshPlanState();
          setStep('success');
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

  const handleSubmitAmount = async () => {
    if (submitting) return;
    const amount = parseCOP(inputValue);
    if (!amount) {
      setAmountError('Ingresa un monto');
      return;
    }
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
    setSubmitting(true);
    try {
      const result = await requestRecharge(amount * 100);
      setContract(result);
      sessionStorage.setItem(RECHARGE_CONTRACT_ID_KEY, String(result.contractId));
      setStep('signature');
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
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <CreditCard className="w-5 h-5 text-[#03548C] shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 leading-relaxed">
                Generaremos un contrato de recarga por este monto. Deberás firmarlo electrónicamente antes de poder pagar.
              </p>
            </div>
            <WizardActionButton submitting={submitting} onClick={handleSubmitAmount} label="Generar contrato de recarga" />
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
            <Link
              href="/commercial/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#03548C] text-white text-sm font-semibold rounded-xl hover:bg-[#0b1440] transition-colors"
            >
              Volver al panel
            </Link>
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
    </div>
  );
}
