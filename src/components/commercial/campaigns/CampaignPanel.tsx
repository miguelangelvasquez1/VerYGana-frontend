'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Megaphone,
  Search,
  Filter,
  Users,
  Gamepad2,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { getCampaigns, type CampaignSummary, type CampaignStatus } from '@/services/CampaignService';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CampaignStatus, { label: string; badge: string; gradient: string }> = {
  DRAFT:     { label: 'Borrador',   badge: 'bg-gray-100 text-gray-700 border-gray-200',       gradient: 'from-gray-400 to-gray-500' },
  ACTIVE:    { label: 'Activa',     badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', gradient: 'from-emerald-400 to-green-600' },
  PAUSED:    { label: 'Pausada',    badge: 'bg-amber-100 text-amber-800 border-amber-200',     gradient: 'from-amber-400 to-orange-500' },
  COMPLETED: { label: 'Finalizada', badge: 'bg-blue-100 text-blue-800 border-blue-200',        gradient: 'from-blue-400 to-indigo-500' },
  CANCELLED: { label: 'Cancelada',  badge: 'bg-gray-100 text-gray-500 border-gray-200',        gradient: 'from-gray-300 to-gray-400' },
};

const STATUS_FILTER_OPTIONS: { label: string; value: CampaignStatus | 'all' }[] = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Borrador',   value: 'DRAFT' },
  { label: 'Activa',     value: 'ACTIVE' },
  { label: 'Pausada',    value: 'PAUSED' },
  { label: 'Finalizada', value: 'COMPLETED' },
  { label: 'Cancelada',  value: 'CANCELLED' },
];

const formatCOP = (cents: number | null | undefined) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── Campaign Card ─────────────────────────────────────────────────────────────

const CampaignCard: React.FC<{ campaign: CampaignSummary; onClick: () => void }> = ({ campaign, onClick }) => {
  const cfg = STATUS_CONFIG[campaign.status] ?? { label: campaign.status, badge: 'bg-gray-100 text-gray-700 border-gray-200', gradient: 'from-gray-300 to-gray-400' };
  const budgetCents = campaign.budgetCents ?? 0;
  const spentCents = campaign.spentCents ?? 0;
  const spentPct = budgetCents > 0 ? Math.min(100, Math.round((spentCents / budgetCents) * 100)) : 0;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
    >
      <div className={`absolute left-0 inset-y-0 w-1 bg-linear-to-b ${cfg.gradient}`} />

      <div className="pl-6 pr-5 pt-5 pb-4 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <Gamepad2 size={15} className="text-gray-400 shrink-0" />
            <h3 className="text-base font-bold text-gray-900 truncate leading-snug group-hover:text-blue-600 transition-colors duration-150">
              {campaign.gameTitle ?? `Campaña #${campaign.id}`}
            </h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Budget vs spent */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">
              {formatCOP(campaign.spentCents)}
            </p>
            <p className="text-xs text-gray-400">de {formatCOP(campaign.budgetCents)}</p>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full transition-all"
              style={{ width: `${spentPct}%` }}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
          <span className="flex items-center gap-1">
            <Megaphone size={12} className="text-gray-400" />
            {(campaign.completedSessions ?? 0).toLocaleString('es-CO')} completadas
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1">
            <Users size={12} className="text-gray-400" />
            {(campaign.uniquePlayersCount ?? 0).toLocaleString('es-CO')} jugadores
          </span>
          <span className="ml-auto text-blue-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            Ver <ChevronRight size={12} />
          </span>
        </div>
      </div>

      <span className="absolute bottom-4 right-5 text-[10px] font-mono text-gray-300">
        #{campaign.id}
      </span>
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const CampaignPanel: React.FC = () => {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await getCampaigns(signal));
    } catch (err: any) {
      if (err?.name !== 'CanceledError') {
        setError('No se pudieron cargar las campañas');
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

  const filtered = campaigns.filter(c => {
    const matchesSearch = (c.gameTitle ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por juego..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_FILTER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={() => router.push('/commercial/branding/requests')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
              >
                <ClipboardList size={15} />
                Ver solicitudes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: campaigns.length, color: 'text-gray-900' },
            { label: 'Activas',    value: campaigns.filter(c => c.status === 'ACTIVE').length, color: 'text-emerald-600' },
            { label: 'Pausadas',   value: campaigns.filter(c => c.status === 'PAUSED').length, color: 'text-amber-600' },
            { label: 'Borrador',   value: campaigns.filter(c => c.status === 'DRAFT').length, color: 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Refresh hint */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {!loading && `${filtered.length} campaña${filtered.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => load()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => load()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Megaphone className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all'
              ? 'No se encontraron campañas'
              : 'Sin campañas aún'}
          </h3>
          <p className="text-gray-600 text-sm">
            {searchTerm || statusFilter !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda'
              : 'Cuando apruebes el diseño de una solicitud de branding, se creará una campaña aquí'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onClick={() => router.push(`/commercial/branding/campaigns/${campaign.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
