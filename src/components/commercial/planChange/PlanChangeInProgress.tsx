'use client';

// Aviso reutilizable para las pantallas de creación de activos (anuncios,
// productos, encuestas, juegos brandeados) cuando el comercial tiene una
// solicitud de cambio de plan EN CURSO. Mientras esté abierta el backend
// rechaza crear/activar activos nuevos; la vía de escape es resolver o
// cancelar la solicitud.

import React, { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRightLeft, ArrowRight, Loader2 } from 'lucide-react';
import { PlanChangeRequestResponseDTO } from '@/types/finance/plans/PlanChange.types';
import { WizardConfirmModal } from '../balance/balance.shared';
import {
  canCancelPlanChangeRequest,
  useCancelPlanChangeRequest,
} from '@/hooks/planChange/usePlanChangeRequest';
import { extractApiError } from './planChange.shared';

export const PLAN_CHANGE_ROUTE = '/commercial/plan-change';

// Título corto para el `title=""` de un botón "Crear ..." deshabilitado.
export const PLAN_CHANGE_BLOCK_TOOLTIP =
  'Tienes una solicitud de cambio de plan en curso';

// ── Acciones compartidas (ver solicitud + cancelar) ──────────────────────────

function PlanChangeActions({
  request,
  variant = 'banner',
}: {
  request: PlanChangeRequestResponseDTO;
  variant?: 'banner' | 'block';
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const cancelMutation = useCancelPlanChangeRequest();
  const showCancel = canCancelPlanChangeRequest(request);

  const handleConfirmCancel = async () => {
    try {
      await cancelMutation.mutateAsync(request.id);
      toast.success('Solicitud de cambio de plan cancelada. Ya puedes crear activos.');
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const linkClass =
    variant === 'block'
      ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#03548C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b1440]'
      : 'inline-flex items-center gap-1.5 rounded-lg bg-[#03548C] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0b1440]';

  const cancelClass =
    variant === 'block'
      ? 'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50'
      : 'inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 underline transition-colors hover:text-gray-700 disabled:opacity-50';

  return (
    <>
      <div
        className={
          variant === 'block'
            ? 'flex flex-wrap items-center justify-center gap-3'
            : 'flex flex-wrap items-center gap-3'
        }
      >
        <Link href={PLAN_CHANGE_ROUTE} className={linkClass}>
          Ver solicitud de cambio de plan
          {variant === 'block' && <ArrowRight className="h-4 w-4" />}
        </Link>
        {showCancel && (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelMutation.isPending}
            className={`${cancelClass} cursor-pointer`}
          >
            {cancelMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Cancelar solicitud
          </button>
        )}
      </div>

      <WizardConfirmModal
        isOpen={showCancelConfirm}
        title="Cancelar la solicitud de cambio de plan"
        description="Se anulará tu solicitud de cambio de plan y podrás volver a crear activos de inmediato. Si más adelante quieres cambiar de plan tendrás que iniciar una nueva solicitud."
        confirmLabel="Cancelar solicitud"
        cancelLabel="Volver"
        tone="danger"
        onConfirm={handleConfirmCancel}
        onClose={() => setShowCancelConfirm(false)}
      />
    </>
  );
}

// ── Banner en línea (junto al listado / botón de creación) ────────────────────

export function PlanChangeInProgressBanner({
  request,
}: {
  request: PlanChangeRequestResponseDTO;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#03548C]/20 bg-[#03548C]/5 p-4 sm:flex-row sm:items-start">
      <ArrowRightLeft className="mt-0.5 h-5 w-5 shrink-0 text-[#03548C]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm font-semibold text-[#0b1440]">
            Tienes una solicitud de cambio de plan en curso
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            No puedes crear ni activar activos nuevos hasta resolverla o cancelarla. Lo que
            ya creaste sigue funcionando con normalidad.
          </p>
        </div>
        <PlanChangeActions request={request} />
      </div>
    </div>
  );
}

// ── Bloqueo de página completa (rutas de creación abiertas directamente) ──────

export function PlanChangeInProgressBlock({
  request,
  backHref,
  backLabel,
}: {
  request: PlanChangeRequestResponseDTO;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#03548C]/20 bg-linear-to-br from-[#03548C]/5 to-blue-100/30 px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#03548C]/10">
          <ArrowRightLeft className="h-6 w-6 text-[#03548C]" />
        </div>

        <h3 className="mb-2 text-xl font-bold text-slate-900">
          Tienes un cambio de plan en curso
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-700">
          Mientras tu solicitud de cambio de plan esté abierta no puedes crear ni activar
          activos nuevos. Resuélvela o cancélala para continuar.
        </p>

        <PlanChangeActions request={request} variant="block" />

        {backHref && (
          <Link
            href={backHref}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            {backLabel ?? 'Volver'}
          </Link>
        )}
      </div>
    </div>
  );
}
