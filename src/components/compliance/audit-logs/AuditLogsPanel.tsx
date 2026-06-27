'use client';

import { useState, useCallback } from 'react';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, SlidersHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import {
  getAuditLogs,
  getCriticalAuditLogs,
  type AuditLog,
  type PageResponse,
  type AuditLogFilters,
} from '@/services/ComplianceService';

const LEVEL_STYLE: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700',
  WARNING: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const PAGE_SIZE = 20;

const emptyFilters: AuditLogFilters = {
  userId: undefined,
  action: '',
  level: '',
  category: '',
  success: undefined,
  from: '',
  to: '',
};

export default function AuditLogsPanel() {
  const [tab, setTab] = useState<'all' | 'critical'>('all');
  const [filters, setFilters] = useState<AuditLogFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState<PageResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchLogs = useCallback(async (
    activeTab: 'all' | 'critical',
    activeFilters: AuditLogFilters,
    page: number
  ) => {
    setLoading(true);
    setError(false);
    try {
      if (activeTab === 'critical') {
        setData(await getCriticalAuditLogs(activeFilters.from || undefined, activeFilters.to || undefined, page, PAGE_SIZE));
      } else {
        setData(await getAuditLogs({ ...activeFilters, page, size: PAGE_SIZE }));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchLogs(tab, filters, 0);
  };

  const handleTabChange = (t: 'all' | 'critical') => {
    setTab(t);
    setCurrentPage(0);
    fetchLogs(t, filters, 0);
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    fetchLogs(tab, filters, p);
  };

  const logs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Logs de Auditoría</h2>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'critical'] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'all' ? 'Todos' : 'Solo Críticos'}
          </button>
        ))}
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Usuario ID</label>
              <input
                type="number"
                placeholder="ej. 42"
                value={filters.userId ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Acción</label>
              <input
                placeholder="ej. LOGIN"
                value={filters.action ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nivel</label>
              <select
                value={filters.level ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Todos</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
              <input
                placeholder="ej. AUTH"
                value={filters.category ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Resultado</label>
              <select
                value={filters.success === undefined ? '' : String(filters.success)}
                onChange={(e) => setFilters((f) => ({ ...f, success: e.target.value === '' ? undefined : e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Todos</option>
                <option value="true">Exitoso</option>
                <option value="false">Fallido</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={filters.from ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filters.to ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setFilters(emptyFilters); setCurrentPage(0); fetchLogs(tab, emptyFilters, 0); }}
              className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border rounded-lg hover:bg-gray-50 transition"
            >
              Limpiar
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Buscar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!data && !loading && !error ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <p className="text-sm text-gray-400">Aplica filtros y presiona <span className="font-semibold">Buscar</span> para cargar logs.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-red-500">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-medium">Error al cargar los logs.</p>
          <button onClick={handleSearch} className="text-xs text-blue-600 hover:underline">Reintentar</button>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <p className="text-sm text-gray-500">No se encontraron logs con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resultado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{log.id}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.userId ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">#{log.userId}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{log.action}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_STYLE[log.level] ?? 'bg-gray-100 text-gray-600'}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.category}</td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(log.createdAt).toLocaleString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              {data?.totalElements ?? 0} resultado{(data?.totalElements ?? 0) !== 1 ? 's' : ''} — Página {currentPage + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
