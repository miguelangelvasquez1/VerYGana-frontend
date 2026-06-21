'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getCampaignGoals } from '@/services/BrandingRequestService';
import { CampaignTargetingSelector } from '../CampaignTargetingSelector';
import type { Step3Form } from '../branding.types';

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

const fieldCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

interface Props {
  form: Step3Form;
  submitting: boolean;
  onChange: (field: keyof Omit<Step3Form, 'categoryIds' | 'municipalityCodes'>, value: string) => void;
  onChangeCategoryIds: (ids: number[]) => void;
  onChangeMunicipalityCodes: (codes: string[]) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}

export const Step3Config: React.FC<Props> = ({
  form,
  submitting,
  onChange,
  onChangeCategoryIds,
  onChangeMunicipalityCodes,
  onBack,
  onSkip,
  onNext,
}) => {
  const [goals, setGoals] = useState<string[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    getCampaignGoals()
      .then(setGoals)
      .catch(() => {})
      .finally(() => setGoalsLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div>
        <h3 className="font-medium text-gray-900">Configuración de campaña</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Todos los campos son opcionales. Puedes configurarlo más adelante.
        </p>
      </div>

      {/* Objetivo de campaña */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Objetivo de campaña
        </label>
        {goalsLoading ? (
          <div className="flex items-center gap-2 h-9 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Cargando opciones...
          </div>
        ) : (
          <select
            value={form.campaignGoal}
            onChange={e => onChange('campaignGoal', e.target.value)}
            className={fieldCls}
          >
            <option value="">Sin objetivo definido</option>
            {goals.map(g => (
              <option key={g} value={g}>
                {GOAL_LABELS[g] ?? g}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid de campos básicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Género objetivo</label>
          <select
            value={form.targetGender}
            onChange={e => onChange('targetGender', e.target.value)}
            className={fieldCls}
          >
            <option value="ALL">Todos</option>
            <option value="MALE">Hombres</option>
            <option value="FEMALE">Mujeres</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sesiones máx / usuario / día
          </label>
          <input
            type="number"
            min={1}
            value={form.maxSessionsPerUserPerDay}
            onChange={e => onChange('maxSessionsPerUserPerDay', e.target.value)}
            placeholder="Ej: 3"
            className={fieldCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima</label>
          <input
            type="number"
            min={13}
            max={100}
            value={form.minAge}
            onChange={e => onChange('minAge', e.target.value)}
            placeholder="13"
            className={fieldCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Edad máxima</label>
          <input
            type="number"
            min={13}
            max={100}
            value={form.maxAge}
            onChange={e => onChange('maxAge', e.target.value)}
            placeholder="100"
            className={fieldCls}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={e => onChange('startDate', e.target.value)}
            className={fieldCls}
          />
        </div>
      </div>

      {/* Categorías y municipios */}
      <div className="border-t border-gray-100 pt-5">
        <CampaignTargetingSelector
          selectedCategoryIds={form.categoryIds}
          selectedMunicipalityCodes={form.municipalityCodes}
          onChangeCategoryIds={onChangeCategoryIds}
          onChangeMunicipalityCodes={onChangeMunicipalityCodes}
        />
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Atrás
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Omitir
          </button>
          <button
            onClick={onNext}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Guardar y continuar
          </button>
        </div>
      </div>
    </div>
  );
};
