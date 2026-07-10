'use client';

import React, { useState } from 'react';
import { Loader2, Lightbulb } from 'lucide-react';
import { useCampaignGoals } from '@/hooks/useCampaignGoals';
import type { BrandingGame } from '@/services/BrandingRequestService';
import type { Step1Form } from '../branding.types';

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

const inputCls = (error?: string) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-400' : 'border-gray-300'
  }`;

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const formatThousands = (raw: string): string => {
  const n = Number(raw);
  if (!raw || isNaN(n)) return '';
  return n.toLocaleString('es-CO');
};

const formatExposure = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} horas`;
};

interface Props {
  selectedGame: BrandingGame;
  form: Step1Form;
  errors: Partial<Step1Form>;
  submitting: boolean;
  requestId: number | null;
  onChange: (field: keyof Step1Form, value: string) => void;
  onNext: () => void;
  onChangeGame: () => void;
}

export const Step1BrandInfo: React.FC<Props> = ({
  selectedGame,
  form,
  errors,
  submitting,
  requestId,
  onChange,
  onNext,
  onChangeGame,
}) => {
  const [budgetFocused, setBudgetFocused] = useState(false);
  const [urlLocalError, setUrlLocalError] = useState('');
  const { goals, loading: goalsLoading } = useCampaignGoals();

  const handleUrlChange = (value: string) => {
    onChange('targetUrl', value);
    if (urlLocalError) setUrlLocalError('');
  };

  const handleUrlBlur = () => {
    if (form.targetUrl && !isValidUrl(form.targetUrl.trim())) {
      setUrlLocalError('Ingresa una URL válida (ej: https://www.tumarca.com)');
    } else {
      setUrlLocalError('');
    }
  };

  const handleBudgetChange = (raw: string) => {
    onChange('budgetPesos', raw.replace(/\D/g, ''));
  };

  const urlError = urlLocalError || errors.targetUrl;
  const budgetDisplay = budgetFocused ? form.budgetPesos : formatThousands(form.budgetPesos);

  // Estimation
  const budgetCents = Math.round(Number(form.budgetPesos) * 100);
  const avgReward = selectedGame.averageRewardPerSessionCents;
  const avgDuration = selectedGame.averageDurationSeconds;
  const hasStats = avgReward !== null && avgReward > 0;
  const budgetValid = budgetCents > 0 && !isNaN(budgetCents);
  const estimatedSessions = hasStats && budgetValid ? Math.floor(budgetCents / avgReward!) : null;
  const estimatedMinutes =
    estimatedSessions !== null && avgDuration !== null
      ? Math.floor((estimatedSessions * avgDuration) / 60)
      : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h3 className="font-medium text-gray-900">Información de marca</h3>

      {/* Selected game */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <img
          src={selectedGame.frontPageUrl}
          alt={selectedGame.title}
          className="w-14 h-10 object-cover rounded-md shrink-0"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">{selectedGame.title}</p>
          <p className="text-xs text-blue-600 truncate">{selectedGame.description}</p>
        </div>
        {requestId === null && (
          <button
            onClick={onChangeGame}
            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer shrink-0"
          >
            Cambiar
          </button>
        )}
      </div>

      {requestId !== null && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Solicitud ya creada — al continuar no se generará una nueva.
        </p>
      )}

      {/* Nombre de marca */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de marca <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.brandName}
          onChange={e => onChange('brandName', e.target.value)}
          placeholder="Ej: Coca-Cola Colombia"
          maxLength={200}
          className={inputCls(errors.brandName)}
        />
        <div className="flex justify-between mt-1">
          {errors.brandName && <p className="text-xs text-red-500">{errors.brandName}</p>}
          <span className="text-xs text-gray-400 ml-auto">{form.brandName.length}/200</span>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción de marca <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.brandDescription}
          onChange={e => onChange('brandDescription', e.target.value)}
          placeholder="Describe tu marca, colores, tono de comunicación..."
          rows={4}
          maxLength={1000}
          className={`${inputCls(errors.brandDescription)} resize-none`}
        />
        <div className="flex justify-between mt-1">
          {errors.brandDescription && (
            <p className="text-xs text-red-500">{errors.brandDescription}</p>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {form.brandDescription.length}/1000
          </span>
        </div>
      </div>

      {/* Objetivo de campaña */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objetivo de campaña <span className="text-red-500">*</span>
        </label>
        {goalsLoading ? (
          <div className="flex items-center gap-2 h-9 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Cargando opciones...
          </div>
        ) : (
          <select
            value={form.campaignGoal}
            onChange={e => onChange('campaignGoal', e.target.value)}
            className={inputCls(errors.campaignGoal)}
          >
            <option value="">Selecciona un objetivo</option>
            {goals.map(g => (
              <option key={g} value={g}>
                {GOAL_LABELS[g] ?? g}
              </option>
            ))}
          </select>
        )}
        {errors.campaignGoal && <p className="text-xs text-red-500 mt-1">{errors.campaignGoal}</p>}
      </div>

      {/* URL de destino */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL de destino <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={form.targetUrl}
          onChange={e => handleUrlChange(e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://www.tumarca.com"
          maxLength={500}
          className={inputCls(urlError)}
        />
        {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
        {!urlError && (
          <p className="text-xs text-gray-400 mt-1">Debe comenzar con https:// o http://</p>
        )}
      </div>

      {/* Presupuesto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Presupuesto en COP <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none select-none">
            $
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={budgetDisplay}
            onChange={e => handleBudgetChange(e.target.value)}
            onFocus={() => setBudgetFocused(true)}
            onBlur={() => setBudgetFocused(false)}
            placeholder="0"
            className={`${inputCls(errors.budgetPesos)} pl-7`}
          />
        </div>
        {errors.budgetPesos && (
          <p className="text-xs text-red-500 mt-1">{errors.budgetPesos}</p>
        )}
        {!errors.budgetPesos && form.budgetPesos && !budgetFocused && (
          <p className="text-xs text-gray-400 mt-1">
            ${formatThousands(form.budgetPesos)} COP
          </p>
        )}
      </div>

      {/* Estimation block */}
      {budgetValid && (
        hasStats ? (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-blue-500 shrink-0" />
              <p className="text-sm font-semibold text-blue-800">
                Con ${formatThousands(form.budgetPesos)} COP podrías obtener aproximadamente:
              </p>
            </div>
            <ul className="pl-5 space-y-0.5 list-disc text-sm text-blue-700">
              <li>~{estimatedSessions!.toLocaleString('es-CO')} sesiones de juego</li>
              {estimatedMinutes !== null && (
                <li>~{formatExposure(estimatedMinutes)} de exposición de marca</li>
              )}
            </ul>
            <p className="text-[11px] text-blue-400 leading-snug">
              Estimación aproximada basada en <strong>{selectedGame.title}</strong>, sujeta a la participación real de usuarios.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
            <Lightbulb size={14} className="shrink-0 text-gray-400" />
            Este juego aún no tiene estadísticas disponibles para estimar el alcance.
          </div>
        )
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {requestId !== null ? 'Continuar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};
