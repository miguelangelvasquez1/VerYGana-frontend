'use client';

import React from 'react';
import { Loader2, BarChart2 } from 'lucide-react';
import type { BrandingGame } from '@/services/BrandingRequestService';
import type { Step1Form } from '../branding.types';

const formatCOP = (cents: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);

interface Props {
  selectedGame: BrandingGame;
  step1Form: Step1Form;
  confirmedCount: number;
  submitting: boolean;
  estimatedSessions: number | null;
  averageRewardPerSessionCents: number | null;
  scoreRewardFactor: number | null;
  onBack: () => void;
  onSubmit: () => void;
}

export const Step4Submit: React.FC<Props> = ({
  selectedGame,
  step1Form,
  confirmedCount,
  submitting,
  estimatedSessions,
  averageRewardPerSessionCents,
  scoreRewardFactor,
  onBack,
  onSubmit,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
    <h3 className="font-medium text-gray-900">Revisar y enviar</h3>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
      <p className="font-medium">¿Todo listo?</p>
      <p className="mt-1">
        Al enviar, tu solicitud pasará a estado <strong>En revisión</strong>. El equipo de
        administración la revisará y te asignará un diseñador. Después de enviar no podrás editar
        la información de marca ni subir más recursos corporativos.
      </p>
    </div>

    <div className="border border-gray-100 rounded-lg p-4 space-y-2 text-sm">
      <div className="flex gap-2">
        <span className="text-gray-500 w-36 shrink-0">Juego:</span>
        <span className="font-medium">{selectedGame.title}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-gray-500 w-36 shrink-0">Marca:</span>
        <span className="font-medium">{step1Form.brandName}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-gray-500 w-36 shrink-0">Presupuesto:</span>
        <span className="font-medium">
          {Number(step1Form.budgetPesos).toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
          })}
        </span>
      </div>
      <div className="flex gap-2">
        <span className="text-gray-500 w-36 shrink-0">Recursos subidos:</span>
        <span className="font-medium">{confirmedCount} archivo(s)</span>
      </div>
    </div>

    {estimatedSessions != null && (
      <div className="border border-gray-100 rounded-lg p-4 space-y-2.5 bg-gray-50">
        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 uppercase tracking-wide">
          <BarChart2 size={13} className="text-gray-400" />
          Estimación basada en el juego seleccionado
        </p>
        <div className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-40 shrink-0">Sesiones estimadas:</span>
            <span className="font-medium">~{estimatedSessions.toLocaleString('es-CO')} sesiones</span>
          </div>
          {averageRewardPerSessionCents != null && (
            <div className="flex gap-2">
              <span className="text-gray-500 w-40 shrink-0">Costo por sesión:</span>
              <span className="font-medium">{formatCOP(averageRewardPerSessionCents)}</span>
            </div>
          )}
          {scoreRewardFactor != null && (
            <div className="flex gap-2">
              <span className="text-gray-500 w-40 shrink-0">Factor de puntaje:</span>
              <span className="font-medium">×{scoreRewardFactor}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 leading-snug">
          Estimación orientativa sujeta a la participación real de usuarios.
        </p>
      </div>
    )}

    <div className="flex justify-between pt-2">
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
      >
        Atrás
      </button>
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        Enviar solicitud
      </button>
    </div>
  </div>
);
