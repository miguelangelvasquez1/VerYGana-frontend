'use client';

/**
 * Página de resultado del pago.
 * Ruta: /plans/resultado
 *
 * Wompi redirige aquí después de que el usuario completa o cancela el pago.
 * Esta página hace polling al backend para saber el resultado real
 * (el webhook de Wompi puede llegar unos segundos antes o después).
 *
 * Parámetros de URL que envía Wompi:
 *   ?id=wompi_transaction_id&status=APPROVED|DECLINED&...
 * Los ignoramos — confiamos en el backend, no en los params de URL.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { getPaymentStatus } from '@/services/planService';
import { PlanPaymentStatusResponseDTO } from '@/types/finance/plans/Plan.types';

const MAX_POLLS   = 8;
const POLL_INTERVAL_MS = 2500;

type ResultState = 'polling' | 'approved' | 'declined' | 'error' | 'timeout';

export default function PaymentResultPage() {
  const [state, setState]   = useState<ResultState>('polling');
  const [status, setStatus] = useState<PlanPaymentStatusResponseDTO | null>(null);
  const [polls, setPolls]   = useState(0);
  const router = useRouter();

  useEffect(() => {
    const reference = sessionStorage.getItem('vg_payment_reference');

    if (!reference) {
      setState('error');
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const result = await getPaymentStatus(reference);
        if (cancelled) return;

        setStatus(result);

        if (result.wompiStatus === 'APPROVED') {
          setState('approved');
          sessionStorage.removeItem('vg_payment_reference');
          sessionStorage.removeItem('vg_payment_plan');
          return;
        }

        if (result.wompiStatus === 'DECLINED' || result.wompiStatus === 'ERROR') {
          setState('declined');
          return;
        }

        // Aún PENDING — seguir polling
        setPolls(prev => {
          const next = prev + 1;
          if (next >= MAX_POLLS) {
            setState('timeout');
          } else {
            setTimeout(poll, POLL_INTERVAL_MS);
          }
          return next;
        });

      } catch {
        if (!cancelled) setState('error');
      }
    };

    // Primer poll después de 1.5s para darle tiempo al webhook de procesarse
    const initial = setTimeout(poll, 1500);
    return () => { cancelled = true; clearTimeout(initial); };
  }, []);

  // ── Approved ──────────────────────────────────────────────────────────────
  if (state === 'approved') return (
    <ResultScreen
      icon={<CheckCircle2 className="w-16 h-16 text-emerald-400" />}
      glow="emerald"
      title="¡Pago exitoso!"
      subtitle={status?.message || 'Tu plan fue activado correctamente.'}
      detail={`Referencia: ${status?.reference}`}
      cta={{ label: 'Ir a mi panel', action: () => router.push('/commercial/dashboard') }}
    />
  );

  // ── Declined ──────────────────────────────────────────────────────────────
  if (state === 'declined') return (
    <ResultScreen
      icon={<XCircle className="w-16 h-16 text-red-400" />}
      glow="red"
      title="Pago rechazado"
      subtitle="Tu banco o Wompi rechazó el pago. No se realizó ningún cargo."
      detail="Puedes intentarlo de nuevo con otro método de pago."
      cta={{ label: 'Intentar de nuevo', action: () => router.push('/plans') }}
      secondary={{ label: 'Ir al panel', action: () => router.push('/commercial/dashboard') }}
    />
  );

  // ── Timeout ───────────────────────────────────────────────────────────────
  if (state === 'timeout') return (
    <ResultScreen
      icon={<Clock className="w-16 h-16 text-yellow-400" />}
      glow="yellow"
      title="Procesando tu pago"
      subtitle="Tu pago está siendo confirmado. Esto puede tardar unos minutos."
      detail="Te notificaremos por email cuando se confirme. No necesitas hacer nada."
      cta={{ label: 'Ir a mi panel', action: () => router.push('/commercial/dashboard') }}
      secondary={{ label: 'Verificar estado', action: () => window.location.reload() }}
    />
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state === 'error') return (
    <ResultScreen
      icon={<XCircle className="w-16 h-16 text-red-400" />}
      glow="red"
      title="Algo salió mal"
      subtitle="No pudimos verificar el estado de tu pago."
      detail="Si realizaste el pago, tu plan será activado automáticamente. Revisa tu email."
      cta={{ label: 'Ir a mi panel', action: () => router.push('/commercial/dashboard') }}
    />
  );

  // ── Polling ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-700/10 blur-[120px]" />
      </div>
      <div className="relative text-center">
        <div className="relative inline-flex mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Confirmando tu pago</h2>
        <p className="text-slate-400 text-sm mb-1">Estamos verificando con Wompi...</p>
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: MAX_POLLS }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              i < polls ? 'bg-blue-400' : 'bg-white/10'
            }`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Result screen component ──────────────────────────────────────────────────

interface ResultScreenProps {
  icon: React.ReactNode;
  glow: 'emerald' | 'red' | 'yellow';
  title: string;
  subtitle: string;
  detail?: string;
  cta: { label: string; action: () => void };
  secondary?: { label: string; action: () => void };
}

function ResultScreen({ icon, glow, title, subtitle, detail, cta, secondary }: ResultScreenProps) {
  const glowColors = {
    emerald: 'bg-emerald-700/15',
    red:     'bg-red-700/15',
    yellow:  'bg-yellow-700/15',
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full ${glowColors[glow]} blur-[120px]`} />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex mb-6">{icon}</div>
        <h1 className="text-white text-3xl font-black mb-3">{title}</h1>
        <p className="text-slate-300 text-base mb-2">{subtitle}</p>
        {detail && <p className="text-slate-500 text-sm mb-8">{detail}</p>}

        <div className="flex flex-col gap-3">
          <button onClick={cta.action}
            className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-bold text-sm
              flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors active:scale-[0.98]">
            {cta.label} <ArrowRight className="w-4 h-4" />
          </button>
          {secondary && (
            <button onClick={secondary.action}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10
                rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors">
              <RefreshCw className="w-4 h-4" /> {secondary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}