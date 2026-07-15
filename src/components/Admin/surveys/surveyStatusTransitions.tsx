'use client';

import React from 'react';
import { Play, XCircle, Ban, Loader2 } from 'lucide-react';
import { STATUS_LABELS } from '@/hooks/surveys/surveyUtils';
import type { SurveyStatus } from '@/types/survey.types';

// Estados y transiciones permitidas para el admin, compartidas entre la
// lista y el detalle de encuestas para que ambas vistas se comporten igual.
//
// El admin ya no tiene un selector de estado libre — solo puede suspender
// (moderación), cancelar (definitivo) o quitar una suspensión (que aterriza
// en PAUSED y le devuelve el control al comercial, quien decide si reactiva).
// Publicar / pausar / reactivar "normales" ya no pasan por este endpoint de
// admin, son acciones del propio comercial desde su panel.

export interface Transition {
  label: string;
  next: SurveyStatus;
  icon: React.ReactNode;
  btnClass: string;
  confirmMsg: string;
}

const suspend: Transition = {
  label: 'Suspender',
  next: 'SUSPENDED',
  icon: <Ban className="h-4 w-4" />,
  btnClass: 'bg-purple-600 text-white hover:bg-purple-500',
  confirmMsg:
    'La encuesta se suspende por moderación: deja de mostrarse a los usuarios y el comercial ya no podrá modificarla ni cambiar su estado hasta que un administrador quite la suspensión.',
};

const cancel: Transition = {
  label: 'Cancelar encuesta',
  next: 'CLOSED',
  icon: <XCircle className="h-4 w-4" />,
  btnClass: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  confirmMsg:
    'Esta acción es DEFINITIVA: la encuesta quedará cancelada para siempre, ni tú ni el comercial podrán reactivarla ni recibir más respuestas.',
};

const unsuspend: Transition = {
  label: 'Reactivar / Quitar suspensión',
  next: 'PAUSED',
  icon: <Play className="h-4 w-4" />,
  btnClass: 'bg-emerald-600 text-white hover:bg-emerald-500',
  confirmMsg:
    'Se quita la suspensión y la encuesta queda en pausa. El comercial recupera el control y puede reactivarla (volver a Activa) desde su propio panel cuando quiera.',
};

export const TRANSITIONS: Record<SurveyStatus, Transition[]> = {
  DRAFT:     [suspend, cancel],
  ACTIVE:    [suspend, cancel],
  PAUSED:    [suspend, cancel],
  COMPLETED: [suspend, cancel],
  SUSPENDED: [unsuspend, cancel],
  CLOSED:    [],
};

// ─── Confirm dialog ─────────────────────────────────────────────────────────

export function ConfirmDialog({ from, transition, loading, onConfirm, onCancel }: {
  from: SurveyStatus;
  transition: Transition;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isCritical = transition.next === 'CLOSED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-gray-900">
          {STATUS_LABELS[from]} → {STATUS_LABELS[transition.next]}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          {transition.confirmMsg}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60 ${
              isCritical ? 'bg-red-500 hover:bg-red-400' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
