'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Headset, ChevronRight, ChevronLeft } from 'lucide-react';
import { getAssignedPqrs } from '@/services/admin/AdminPqrsService';
import { PqrsAdminDetailDTO, PqrsStatus, PqrsType } from '@/types/Pqrs.types';
import { pqrsStatusColor, pqrsStatusLabel, pqrsTypeLabel } from '@/components/pqrs/pqrsMeta';
import { AdminPqrsDetail } from './AdminPqrsDetail';

const PAGE_SIZE = 10;

const STATUS_FILTERS: { label: string; value: PqrsStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  ...Object.values(PqrsStatus).map((s) => ({ label: pqrsStatusLabel[s], value: s })),
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const AdminPqrsPanel: React.FC = () => {
  const [items, setItems] = useState<PqrsAdminDetailDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PqrsStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PqrsType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAssignedPqrs(
        statusFilter === 'ALL' ? undefined : statusFilter,
        typeFilter === 'ALL' ? undefined : typeFilter,
        page,
        PAGE_SIZE,
      );
      setItems(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalElements(res.meta.totalElements);
    } catch {
      setError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter, page]);

  const handleRowClick = (id: number) => setSelectedId(id);

  const handleBack = () => {
    setSelectedId(null);
    load();
  };

  if (selectedId !== null) {
    return <AdminPqrsDetail pqrsId={selectedId} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">PQRS</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestiona las peticiones, quejas, reclamos y sugerencias de usuarios y comercios
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(0); }}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as PqrsType | 'ALL'); setPage(0); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 bg-white cursor-pointer"
        >
          <option value="ALL">Todos los tipos</option>
          {Object.values(PqrsType).map((t) => (
            <option key={t} value={t}>{pqrsTypeLabel[t]}</option>
          ))}
        </select>
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
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <Headset size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No hay solicitudes con estos filtros</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Asunto', 'Solicitante', 'Tipo', 'Estado', 'Vence', 'Fecha', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">#{item.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[220px] truncate">{item.subject}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm text-gray-700">{item.requesterName}</p>
                      <p className="text-xs text-gray-400">{item.requesterEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{pqrsTypeLabel[item.type]}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${pqrsStatusColor[item.status]}`}>
                        {pqrsStatusLabel[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(item.dueDate)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-400"><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {totalElements} solicitud{totalElements === 1 ? '' : 'es'} · Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPqrsPanel;
