'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity,
  AlertCircle,
  DollarSign,
  Edit2,
  Loader2,
  RefreshCw,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import {
  PricingConfigDTO,
  PricingType,
  PRICING_TYPE_DESCRIPTIONS,
  PRICING_TYPE_LABELS,
} from '@/types/pricing/PricingConfig.types';
import {
  useActivePricingConfigs,
  useUpdatePricingConfig,
} from '@/hooks/pricing/pricingQueries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<PricingType, React.ReactNode> = {
  [PricingType.SURVEY_REWARD_PER_QUESTION_CENTS]: <Activity size={18} className="text-emerald-600" />,
  [PricingType.GAME_COST_PER_POINT_CENTS]: <Zap size={18} className="text-yellow-600" />,
  [PricingType.GAME_COST_PER_VICTORY_CENTS]: <Shield size={18} className="text-purple-600" />,
  [PricingType.AD_COST_PER_SECOND_CENTS]: <DollarSign size={18} className="text-blue-600" />,
};

const TYPE_ACCENT: Record<PricingType, string> = {
  [PricingType.SURVEY_REWARD_PER_QUESTION_CENTS]: 'border-l-emerald-400 bg-emerald-50/40',
  [PricingType.GAME_COST_PER_POINT_CENTS]: 'border-l-yellow-400 bg-yellow-50/40',
  [PricingType.GAME_COST_PER_VICTORY_CENTS]: 'border-l-purple-400 bg-purple-50/40',
  [PricingType.AD_COST_PER_SECOND_CENTS]: 'border-l-blue-400 bg-blue-50/40',
};

const TYPE_ICON_BG: Record<PricingType, string> = {
  [PricingType.SURVEY_REWARD_PER_QUESTION_CENTS]: 'bg-emerald-100',
  [PricingType.GAME_COST_PER_POINT_CENTS]: 'bg-yellow-100',
  [PricingType.GAME_COST_PER_VICTORY_CENTS]: 'bg-purple-100',
  [PricingType.AD_COST_PER_SECOND_CENTS]: 'bg-blue-100',
};

// ─── Edit modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  config: PricingConfigDTO;
  isPending: boolean;
  onSave: (valueCents: number) => void;
  onClose: () => void;
}

function EditModal({ config, isPending, onSave, onClose }: EditModalProps) {
  // Input is in COP (whole pesos); we store/send in centavos
  const [inputCOP, setInputCOP] = useState(
    String(config.amountInCents / 100)
  );
  const [error, setError] = useState<string | null>(null);

  const parsedCOP = parseFloat(inputCOP) || 0;
  const centavos = Math.round(parsedCOP * 100);
  const unchanged = centavos === config.amountInCents;

  const handleSave = () => {
    setError(null);
    if (!parsedCOP || parsedCOP <= 0) {
      setError('El valor debe ser mayor a $0 COP.');
      return;
    }
    if (unchanged) {
      setError('El nuevo valor es igual al actual.');
      return;
    }
    onSave(centavos);
  };

  const typeLabel = PRICING_TYPE_LABELS[config.type] ?? config.type;
  const iconBg = TYPE_ICON_BG[config.type] ?? 'bg-gray-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={!isPending ? onClose : undefined}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
              <Edit2 size={15} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Editar precio</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{typeLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Current value */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Valor actual
            </span>
            <span className="text-sm font-bold text-gray-800">
              {formatCOP(config.amountInCents)}{' '}
              <span className="text-xs font-normal text-gray-400">
                v{config.version}
              </span>
            </span>
          </div>

          {/* New value input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Nuevo valor <span className="text-gray-400 normal-case font-normal">(en pesos COP)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                $
              </span>
              <input
                autoFocus
                type="number"
                step="0.01"
                min={0.01}
                value={inputCOP}
                onChange={(e) => {
                  setInputCOP(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && !isPending && handleSave()}
                placeholder="0"
                className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {parsedCOP > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                <span className="font-semibold text-gray-600">{formatCOP(centavos)}</span>
                {' · '}{centavos.toLocaleString('es-CO')} centavos
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Guardar cambio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

interface PricingCardProps {
  config: PricingConfigDTO;
  onEdit: (config: PricingConfigDTO) => void;
}

function PricingCard({ config, onEdit }: PricingCardProps) {
  const accent = TYPE_ACCENT[config.type] ?? 'border-l-gray-300 bg-gray-50/40';
  const iconBg = TYPE_ICON_BG[config.type] ?? 'bg-gray-100';
  const icon = TYPE_ICON[config.type] ?? <DollarSign size={18} className="text-gray-500" />;
  const label = PRICING_TYPE_LABELS[config.type] ?? config.type;
  const description = PRICING_TYPE_DESCRIPTIONS[config.type] ?? config.description;

  return (
    <div className={`bg-white rounded-xl border border-l-4 shadow-sm px-5 py-4 flex items-center gap-4 transition-all hover:shadow-md ${accent}`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{label}</p>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{description}</p>
        <p className="text-xs text-gray-500 mt-1">
          v{config.version} · Actualizado {formatDate(config.createdAt)}
        </p>
      </div>

      {/* Value + edit */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-xl font-black text-gray-900">
            {formatCOP(config.amountInCents)}
            <span className="text-xs font-semibold text-gray-500 ml-1">{config.currency}</span>
          </p>
          <p className="text-xs text-gray-600">{config.amountInCents.toLocaleString('es-CO')} centavos</p>
          <p className="text-xs text-gray-600 mt-0.5">
            🗝️ {(config.amountInCents / 1000).toLocaleString('es-CO', { maximumFractionDigits: 3 })} llaves
          </p>
        </div>
        <button
          onClick={() => onEdit(config)}
          className="cursor-pointer p-2 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all"
          title="Editar"
        >
          <Edit2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── PreciosTab ───────────────────────────────────────────────────────────────

export default function PreciosTab() {
  const { data: configs = [], isLoading, isError, refetch } = useActivePricingConfigs();
  const updateMutation = useUpdatePricingConfig();
  const [editing, setEditing] = useState<PricingConfigDTO | null>(null);

  const handleSave = async (valueCents: number) => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ type: editing.type, value: valueCents });
      toast.success(`Precio actualizado: ${PRICING_TYPE_LABELS[editing.type] ?? editing.type}`);
      setEditing(null);
    } catch {
      toast.error('Error al actualizar el precio. Intenta de nuevo.');
    }
  };

  // ── Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
        <Loader2 size={18} className="animate-spin text-blue-500" />
        <span className="text-sm">Cargando configuraciones...</span>
      </div>
    );
  }

  // ── Error
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900">No se pudieron cargar los precios</p>
          <p className="text-sm text-gray-500 mt-1">Verifica tu conexión o intenta de nuevo.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <RefreshCw size={15} />
          Reintentar
        </button>
      </div>
    );
  }

  // ── Empty
  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <DollarSign size={32} className="text-gray-200 mb-3" />
        <p className="text-sm">No hay configuraciones de precio registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Configuraciones de precio activas. Editarlas crea una nueva versión automáticamente.
      </p>

      {configs.map((cfg) => (
        <PricingCard key={cfg.id} config={cfg} onEdit={setEditing} />
      ))}

      {editing && (
        <EditModal
          config={editing}
          isPending={updateMutation.isPending}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
