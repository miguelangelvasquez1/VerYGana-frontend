'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  RefreshCw,
  Palette,
  Search,
  Filter,
  Layers,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { getMyBrandingRequests, type BrandingRequest, type BrandingStatus } from '@/services/BrandingRequestService';
import { CreateBrandingWizard } from './CreateBrandingWizard';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BrandingStatus, { label: string; badge: string; gradient: string }> = {
  DRAFT:                      { label: 'Borrador',               badge: 'bg-gray-100 text-gray-700 border-gray-200',       gradient: 'from-gray-400 to-gray-500' },
  PENDING_REVIEW:             { label: 'En revisión',            badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', gradient: 'from-amber-400 to-yellow-500' },
  APPROVED:                   { label: 'Aprobado',               badge: 'bg-green-100 text-green-800 border-green-200',    gradient: 'from-green-400 to-emerald-500' },
  REJECTED:                   { label: 'Rechazado',              badge: 'bg-red-100 text-red-800 border-red-200',          gradient: 'from-red-400 to-rose-500' },
  DESIGN_IN_PROGRESS:         { label: 'En diseño',              badge: 'bg-blue-100 text-blue-800 border-blue-200',       gradient: 'from-blue-400 to-indigo-500' },
  PENDING_ADVERTISER_APPROVAL:{ label: 'Pendiente tu aprobación',badge: 'bg-purple-100 text-purple-800 border-purple-200', gradient: 'from-purple-400 to-violet-500' },
  CHANGES_REQUESTED:          { label: 'Cambios solicitados',    badge: 'bg-orange-100 text-orange-800 border-orange-200', gradient: 'from-orange-400 to-amber-500' },
  CAMPAIGN_CREATED:                   { label: 'Campaña creada',         badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', gradient: 'from-emerald-400 to-green-600' },
  CANCELLED:                  { label: 'Cancelado',              badge: 'bg-gray-100 text-gray-500 border-gray-200',       gradient: 'from-gray-300 to-gray-400' },
};

const STATUS_FILTER_OPTIONS: { label: string; value: BrandingStatus | 'all' }[] = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Borrador',          value: 'DRAFT' },
  { label: 'En revisión',       value: 'PENDING_REVIEW' },
  { label: 'Aprobado',          value: 'APPROVED' },
  { label: 'En diseño',         value: 'DESIGN_IN_PROGRESS' },
  { label: 'Pend. aprobación',  value: 'PENDING_ADVERTISER_APPROVAL' },
  { label: 'Cambios solicitados', value: 'CHANGES_REQUESTED' },
  { label: 'Campaña creada',     value: 'CAMPAIGN_CREATED' },
  { label: 'Rechazado',         value: 'REJECTED' },
  { label: 'Cancelado',         value: 'CANCELLED' },
];

const formatCOP = (cents: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── Request Card ─────────────────────────────────────────────────────────────

const BrandingCard: React.FC<{ req: BrandingRequest; onClick: () => void }> = ({ req, onClick }) => {
  const cfg = STATUS_CONFIG[req.status] ?? { label: req.status, badge: 'bg-gray-100 text-gray-700 border-gray-200', gradient: 'from-gray-300 to-gray-400' };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Left status bar */}
      <div className={`absolute left-0 inset-y-0 w-1 bg-linear-to-b ${cfg.gradient}`} />

      <div className="pl-6 pr-5 pt-5 pb-4 flex flex-col gap-4">
        {/* Brand + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate leading-snug group-hover:text-blue-600 transition-colors duration-150">
              {req.brandName}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{req.gameName}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Budget — hero metric */}
        <div>
          <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">
            {formatCOP(req.budgetCents)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wide font-medium">
            Presupuesto total
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
          <span className="flex items-center gap-1">
            <Layers size={12} className="text-gray-400" />
            {req.corporateResourceCount} recursos
          </span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1">
            <Calendar size={12} className="text-gray-400" />
            {formatDate(req.createdAt)}
          </span>
          <span className="ml-auto text-blue-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            Ver <ChevronRight size={12} />
          </span>
        </div>

        {/* Optional footer */}
        {(req.assignedDesignerName || req.adminNotes) && (
          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            {req.assignedDesignerName && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                <User size={11} className="text-gray-400 shrink-0" />
                {req.assignedDesignerName}
              </p>
            )}
            {req.adminNotes && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 truncate">
                <AlertCircle size={11} className="shrink-0" />
                {req.adminNotes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ID — faint watermark */}
      <span className="absolute bottom-4 right-5 text-[10px] font-mono text-gray-300">
        #{req.id}
      </span>
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const BrandingRequestPanel: React.FC = () => {
  const router = useRouter();

  const [view, setView] = useState<'list' | 'create'>('list');
  const [requests, setRequests] = useState<BrandingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BrandingStatus | 'all'>('all');

  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await getMyBrandingRequests(signal));
    } catch (err: any) {
      if (err?.name !== 'CanceledError') {
        setError('No se pudieron cargar las solicitudes');
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


  if (view === 'create') {
    return (
      <CreateBrandingWizard
        onBack={() => setView('list')}
        onComplete={() => { setView('list'); load(); }}
      />
    );
  }

const filtered = requests.filter(r => {
    const matchesSearch =
      r.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gameName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/commercial/branding')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
      >
        <ChevronLeft size={18} /> Volver
      </button>

      {/* Controls bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por marca o juego..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as BrandingStatus | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_FILTER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* New request button */}
          <button
            onClick={() => setView('create')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} />
            Nueva solicitud
          </button>
        </div>
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: requests.length, color: 'text-gray-900' },
            { label: 'En revisión', value: requests.filter(r => r.status === 'PENDING_REVIEW').length, color: 'text-yellow-600' },
            { label: 'En diseño',  value: requests.filter(r => ['DESIGN_IN_PROGRESS','PENDING_ADVERTISER_APPROVAL','CHANGES_REQUESTED'].includes(r.status)).length, color: 'text-blue-600' },
            { label: 'Campaña creada', value: requests.filter(r => r.status === 'CAMPAIGN_CREATED').length, color: 'text-emerald-600' },
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
          {!loading && `${filtered.length} solicitud${filtered.length !== 1 ? 'es' : ''}`}
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
            <Palette className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all'
              ? 'No se encontraron solicitudes'
              : 'Sin solicitudes de branding aún'}
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            {searchTerm || statusFilter !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda'
              : 'Crea tu primera solicitud para integrar tu marca en un videojuego'}
          </p>
          <button
            onClick={() => setView('create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm cursor-pointer"
          >
            <Plus size={16} />
            Nueva solicitud
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(req => (
            <BrandingCard
              key={req.id}
              req={req}
              onClick={() => router.push(`/commercial/branding/requests/${req.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
