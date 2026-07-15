'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Palette, ChevronRight } from 'lucide-react';
import {
  adminGetBrandingRequests,
  type AdminBrandingRequestSummary,
  type BrandingStatus,
} from '@/services/BrandingRequestService';
import { AdminBrandingDetail } from './AdminBrandingDetail';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BrandingStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'bg-gray-100 text-gray-700' },
  PENDING_REVIEW: { label: 'En revisión', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Aprobado', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
  DESIGN_IN_PROGRESS: { label: 'En diseño', className: 'bg-blue-100 text-blue-800' },
  PENDING_ADVERTISER_APPROVAL: { label: 'Pend. aprobación', className: 'bg-purple-100 text-purple-800' },
  CHANGES_REQUESTED: { label: 'Cambios solicitados', className: 'bg-orange-100 text-orange-800' },
  CAMPAIGN_CREATED: { label: 'Campaña creada', className: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-100 text-gray-500' },
};

const STATUS_FILTERS: { label: string; value: BrandingStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'En revisión', value: 'PENDING_REVIEW' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'En diseño', value: 'DESIGN_IN_PROGRESS' },
  { label: 'Campaña creada', value: 'CAMPAIGN_CREATED' },
  { label: 'Rechazadas', value: 'REJECTED' },
];

const formatCOP = (cents: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Panel ───────────────────────────────────────────────────────────────────

const AdminBrandingPanel: React.FC = () => {
  const [requests, setRequests] = useState<AdminBrandingRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BrandingStatus | 'ALL'>('ALL');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await adminGetBrandingRequests());
    } catch {
      setError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRowClick = (id: number) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('list');
    load();
  };

  if (view === 'detail' && selectedId !== null) {
    return <AdminBrandingDetail requestId={selectedId} onBack={handleBack} />;
  }

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Solicitudes de Branding</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona las solicitudes de integración de marca en juegos
          </p>
        </div>
        <button
          onClick={load}
          title="Actualizar"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: requests.length, cls: 'text-gray-900' },
            {
              label: 'En revisión',
              value: requests.filter(r => r.status === 'PENDING_REVIEW').length,
              cls: 'text-yellow-700',
            },
            {
              label: 'En diseño',
              value: requests.filter(r =>
                ['APPROVED', 'DESIGN_IN_PROGRESS', 'PENDING_ADVERTISER_APPROVAL', 'CHANGES_REQUESTED'].includes(r.status)
              ).length,
              cls: 'text-blue-700',
            },
            {
              label: 'Campaña creada',
              value: requests.filter(r => r.status === 'CAMPAIGN_CREATED').length,
              cls: 'text-emerald-700',
            },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.value !== 'ALL' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({requests.filter(r => r.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={load} className="mt-3 text-sm text-red-600 underline cursor-pointer">
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <Palette size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {filter === 'ALL'
              ? 'No hay solicitudes de branding aún'
              : 'No hay solicitudes con este estado'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Empresa', 'Marca / Juego', 'Estado', 'Presupuesto', 'Ses. est.', 'Fecha', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(req => {
                const status = STATUS_CONFIG[req.status];
                return (
                  <tr
                    key={req.id}
                    onClick={() => handleRowClick(req.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      #{req.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-[160px] truncate">
                      {req.commercialName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{req.brandName}</p>
                      <p className="text-xs text-gray-500">{req.gameName}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {formatCOP(req.budgetCents)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {req.estimatedSessions != null
                        ? `~${req.estimatedSessions.toLocaleString('es-CO')}`
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBrandingPanel;
