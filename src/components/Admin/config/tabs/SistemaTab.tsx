'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Wrench,
} from 'lucide-react';
import {
  FeatureStatus,
  SystemFeature,
  formatCategoryLabel,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
} from '@/types/system/SystemFeature.types';
import {
  useSystemFeatures,
  useUpdateFeatureStatus,
} from '@/hooks/system/systemFeatureQueries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function featureKeyToName(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  FeatureStatus,
  { icon: React.ReactNode; badge: string; dot: string; option: string }
> = {
  ENABLED: {
    icon: <CheckCircle size={13} />,
    badge: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    option: 'text-green-700',
  },
  READ_ONLY: {
    icon: <BookOpen size={13} />,
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-400',
    option: 'text-yellow-700',
  },
  MAINTENANCE: {
    icon: <Wrench size={13} />,
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    option: 'text-orange-700',
  },
  DISABLED: {
    icon: <Ban size={13} />,
    badge: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    option: 'text-red-700',
  },
};

const DESTRUCTIVE_STATUSES: FeatureStatus[] = ['MAINTENANCE', 'DISABLED'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-5 w-16 bg-gray-100 rounded" />
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="space-y-2">
      <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
      <div className="space-y-2 pl-1">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  feature: SystemFeature;
  newStatus: FeatureStatus;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ feature, newStatus, isPending, onConfirm, onCancel }: ConfirmModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const isDestructive = DESTRUCTIVE_STATUSES.includes(newStatus);
  const cfg = STATUS_CONFIG[newStatus];
  const name = featureKeyToName(feature.featureKey);
  const requiresTyping = isDestructive;
  const canConfirm = !requiresTyping || confirmText === newStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={!isPending ? onCancel : undefined}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className={`px-6 pt-6 pb-5 ${isDestructive ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              newStatus === 'DISABLED' ? 'bg-red-100' :
              newStatus === 'MAINTENANCE' ? 'bg-orange-100' :
              newStatus === 'READ_ONLY' ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {newStatus === 'DISABLED' ? <Ban size={20} className="text-red-600" /> :
               newStatus === 'MAINTENANCE' ? <Wrench size={20} className="text-orange-600" /> :
               newStatus === 'READ_ONLY' ? <BookOpen size={20} className="text-yellow-600" /> :
               <CheckCircle size={20} className="text-green-600" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Cambiar estado del módulo</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="font-semibold">{name}</span>
                {' → '}
                <span className={`font-semibold ${cfg.option}`}>{STATUS_LABELS[newStatus]}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className={`rounded-xl border p-4 ${isDestructive ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Impacto</p>
            <p className="text-sm text-gray-700">{STATUS_DESCRIPTIONS[newStatus]}</p>
          </div>

          {requiresTyping && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Para confirmar, escribe{' '}
                <code className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                  {newStatus}
                </code>{' '}
                en el campo:
              </p>
              <input
                autoFocus
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canConfirm && !isPending && onConfirm()}
                placeholder={newStatus}
                className={`w-full px-3 py-2.5 text-sm font-mono border rounded-xl outline-none transition-colors ${
                  confirmText && !canConfirm
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isPending}
            className={`cursor-pointer px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${
              newStatus === 'DISABLED' ? 'bg-red-600 hover:bg-red-700' :
              newStatus === 'MAINTENANCE' ? 'bg-orange-600 hover:bg-orange-700' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Confirmar cambio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Feature row card (full-width horizontal) ─────────────────────────────────

interface FeatureCardProps {
  feature: SystemFeature;
  isUpdating: boolean;
  onStatusChange: (feature: SystemFeature, newStatus: FeatureStatus) => void;
}

function FeatureCard({ feature, isUpdating, onStatusChange }: FeatureCardProps) {
  const cfg = STATUS_CONFIG[feature.status];
  const name = featureKeyToName(feature.featureKey);

  return (
    <div className={`bg-white rounded-xl border shadow-sm px-5 py-4 flex items-center gap-4 transition-all ${
      isUpdating
        ? 'opacity-60 pointer-events-none'
        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
    }`}>
      {/* Status dot */}
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{feature.description}</p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
        <code className="hidden sm:inline text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
          {feature.endpointPrefix}
        </code>

        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
          {cfg.icon}
          <span className="hidden sm:inline">{STATUS_LABELS[feature.status]}</span>
        </span>

        <span className="hidden md:flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {relativeTime(feature.updatedAt)}
        </span>

        {isUpdating
          ? <Loader2 size={15} className="animate-spin text-blue-500" />
          : (
            <select
              value={feature.status}
              onChange={(e) => onStatusChange(feature, e.target.value as FeatureStatus)}
              className="cursor-pointer text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {(Object.keys(STATUS_CONFIG) as FeatureStatus[]).map((s) => (
                <option key={s} value={s} className={STATUS_CONFIG[s].option}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          )
        }
      </div>
    </div>
  );
}

// ─── Category section (collapsible) ──────────────────────────────────────────

interface CategorySectionProps {
  category: string;
  items: SystemFeature[];
  updatingId: number | null;
  onStatusChange: (feature: SystemFeature, newStatus: FeatureStatus) => void;
  forceExpanded: boolean;
}

function CategorySection({ category, items, updatingId, onStatusChange, forceExpanded }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const open = forceExpanded || isOpen;

  const activeCount = items.filter((f) => f.status === 'ENABLED').length;
  const hasAttention = items.some(
    (f) => f.status === 'DISABLED' || f.status === 'MAINTENANCE'
  );

  return (
    <section className="space-y-2">
      {/* Collapsible header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="cursor-pointer w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
      >
        <div className="flex items-center gap-3">
          {hasAttention && (
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
          )}
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            {formatCategoryLabel(category)}
          </h3>
          <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
            {activeCount} / {items.length} activos
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
          <span className="text-xs hidden sm:inline">
            {open ? 'Ocultar' : 'Mostrar'}
          </span>
          {open
            ? <ChevronUp size={16} />
            : <ChevronDown size={16} />
          }
        </div>
      </button>

      {/* Cards */}
      {open && (
        <div className="space-y-2 pt-1">
          {items.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isUpdating={updatingId === feature.id}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── SistemaTab ───────────────────────────────────────────────────────────────

export default function SistemaTab() {
  const { data: fetched, isLoading, isError, refetch } = useSystemFeatures();
  const updateMutation = useUpdateFeatureStatus();

  const [features, setFeatures] = useState<SystemFeature[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [pending, setPending] = useState<{
    feature: SystemFeature;
    newStatus: FeatureStatus;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'attention'>('all');

  useEffect(() => {
    if (fetched) setFeatures(fetched);
  }, [fetched]);

  // Force-expand all sections while a search/filter is active so results are always visible
  const isFiltering = !!searchTerm || statusFilter !== 'all';

  const attentionCount = features.filter(
    (f) => f.status === 'DISABLED' || f.status === 'MAINTENANCE'
  ).length;

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        featureKeyToName(f.featureKey).toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.endpointPrefix.toLowerCase().includes(q);
      const matchFilter =
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? f.status === 'ENABLED' :
        f.status === 'DISABLED' || f.status === 'MAINTENANCE';
      return matchSearch && matchFilter;
    });
  }, [features, searchTerm, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, SystemFeature[]>();
    filtered.forEach((f) => {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    });
    return map;
  }, [filtered]);

  const handleStatusChange = (feature: SystemFeature, newStatus: FeatureStatus) => {
    if (newStatus === feature.status) return;
    setPending({ feature, newStatus });
  };

  const confirmChange = async () => {
    if (!pending) return;
    const { feature, newStatus } = pending;
    setPending(null);
    setUpdatingId(feature.id);
    try {
      await updateMutation.mutateAsync({ id: feature.id, status: newStatus });
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === feature.id
            ? { ...f, status: newStatus, updatedAt: new Date().toISOString() }
            : f
        )
      );
      toast.success(`${featureKeyToName(feature.featureKey)} → ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error('Error al actualizar el módulo. Intenta de nuevo.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonSection key={i} />)}
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
          <p className="font-bold text-gray-900">No se pudo cargar el estado del sistema</p>
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

  return (
    <div className="space-y-5">
      {/* Attention banner */}
      {attentionCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle size={18} className="text-orange-500 shrink-0" />
          <p className="text-sm font-medium text-orange-800">
            <span className="font-bold">{attentionCount}</span>{' '}
            módulo{attentionCount !== 1 ? 's' : ''} requiere{attentionCount !== 1 ? 'n' : ''} atención
            (en mantenimiento o deshabilitado).
          </p>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar módulo..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {([
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'Activos' },
            { key: 'attention', label: 'Atención' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                statusFilter === key
                  ? key === 'attention'
                    ? 'bg-orange-100 border-orange-300 text-orange-700'
                    : 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
              {key === 'attention' && attentionCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-px">
                  {attentionCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {grouped.size === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Search size={28} className="text-gray-200 mb-3" />
          <p className="text-sm">No se encontraron módulos con ese criterio.</p>
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
            className="cursor-pointer mt-2 text-sm text-blue-600 hover:underline font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Category sections */}
      {Array.from(grouped.entries()).map(([category, items]) => (
        <CategorySection
          key={category}
          category={category}
          items={items}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
          forceExpanded={isFiltering}
        />
      ))}

      {/* Confirm modal */}
      {pending && (
        <ConfirmModal
          feature={pending.feature}
          newStatus={pending.newStatus}
          isPending={updateMutation.isPending}
          onConfirm={confirmChange}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
