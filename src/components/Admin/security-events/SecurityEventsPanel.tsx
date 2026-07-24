'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ShieldAlert,
  Wrench,
  RefreshCw,
} from 'lucide-react';
import {
  getSecurityEvents,
  getCriticalSecurityEvents,
  type SecurityEventFilters,
  type SecurityEventsResult,
} from '@/services/admin/SecurityEventsService';
import { datetimeLocalToZonedIso } from '@/lib/utils/dateTime';

const LEVEL_STYLE: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700 border-blue-200',
  WARNING: 'bg-amber-100 text-amber-700 border-amber-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  DEBUG: 'bg-gray-100 text-gray-600 border-gray-200',
};

const ACTION_LABELS: Record<string, string> = {
  BRUTE_FORCE_ATTEMPT: 'Fuerza bruta',
  TOKEN_FARMING: 'Farming de tokens',
  SESSION_HIJACKING_SUSPECTED: 'Posible secuestro de sesión',
  IP_AUTO_BLOCKED: 'IP bloqueada automáticamente',
  EXCESSIVE_SESSIONS: 'Sesiones excesivas',
  TOKEN_CLEANUP_FAILED: 'Fallo de limpieza de tokens',
  MONTHLY_CLEANUP_FAILED: 'Fallo de limpieza mensual',
  HEALTH_CHECK_FAILED: 'Fallo de monitoreo (health check)',
};

// Fallos operativos de los jobs internos — no son ataques, se distinguen visualmente.
const OPERATIONAL_ACTIONS = new Set([
  'TOKEN_CLEANUP_FAILED',
  'MONTHLY_CLEANUP_FAILED',
  'HEALTH_CHECK_FAILED',
]);

const ACTION_OPTIONS = Object.keys(ACTION_LABELS);

const PAGE_SIZE = 50;

const emptyFilters: SecurityEventFilters = {
  action: '',
  level: '',
  from: '',
  to: '',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

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
      </div>
    </div>
  );
}

export default function SecurityEventsPanel() {
  const [tab, setTab] = useState<'all' | 'critical'>('all');
  const [filters, setFilters] = useState<SecurityEventFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState<SecurityEventsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchEvents = useCallback(async (
    activeTab: 'all' | 'critical',
    activeFilters: SecurityEventFilters,
    page: number
  ) => {
    setLoading(true);
    setError(false);
    try {
      const from = datetimeLocalToZonedIso(activeFilters.from);
      const to = datetimeLocalToZonedIso(activeFilters.to);
      if (activeTab === 'critical') {
        setData(await getCriticalSecurityEvents(from, to, page, PAGE_SIZE));
      } else {
        setData(await getSecurityEvents({ ...activeFilters, from, to, page, size: PAGE_SIZE }));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents('all', emptyFilters, 0);
  }, [fetchEvents]);

  const handleSearch = () => {
    setCurrentPage(0);
    setExpandedId(null);
    fetchEvents(tab, filters, 0);
  };

  const handleTabChange = (t: 'all' | 'critical') => {
    setTab(t);
    setCurrentPage(0);
    setExpandedId(null);
    fetchEvents(t, filters, 0);
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    setExpandedId(null);
    fetchEvents(tab, filters, p);
  };

  const events = data?.events.data ?? [];
  const totalPages = data?.events.meta.totalPages ?? 1;

  const summaryCards = data
    ? Object.entries(data.summary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Eventos de Seguridad</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Detección automática (fuerza bruta, token farming, anomalías, sesiones) — corre cada hora.
          </p>
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-20 animate-pulse" />
          ))
        ) : summaryCards.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center text-xs text-gray-400">
            Sin eventos con los filtros actuales.
          </div>
        ) : (
          summaryCards.map(([action, count]) => (
            <div key={action} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-1 truncate" title={actionLabel(action)}>
                {actionLabel(action)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'critical'] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              tab === t
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'all' ? 'Todos' : 'Solo Críticos'}
          </button>
        ))}
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de evento</label>
              <select
                value={filters.action ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
                disabled={tab === 'critical'}
                className="cursor-pointer w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{actionLabel(a)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nivel</label>
              <select
                value={filters.level ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
                disabled={tab === 'critical'}
                className="cursor-pointer w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="DEBUG">DEBUG</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
              <input
                type="datetime-local"
                value={filters.from ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
              <input
                type="datetime-local"
                value={filters.to ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          {tab === 'critical' && (
            <p className="text-xs text-gray-400 mt-2">
              El tab &quot;Solo Críticos&quot; ya filtra por nivel CRITICAL — el filtro de tipo y nivel no aplica aquí.
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setFilters(emptyFilters); setCurrentPage(0); setExpandedId(null); fetchEvents(tab, emptyFilters, 0); }}
              className="cursor-pointer px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleSearch}
              className="cursor-pointer px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">No se pudo cargar los eventos</p>
            <p className="text-sm text-gray-500 mt-1">Verifica tu conexión o intenta de nuevo.</p>
          </div>
          <button
            onClick={handleSearch}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <RefreshCw size={15} />
            Reintentar
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">No se encontraron eventos con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="w-8" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario / Origen</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map((ev) => {
                    const isOperational = OPERATIONAL_ACTIONS.has(ev.action);
                    const isExpanded = expandedId === ev.id;
                    const hasDetail = !!ev.additionalData && Object.keys(ev.additionalData).length > 0;
                    return (
                      <Fragment key={ev.id}>
                        <tr
                          onClick={() => hasDetail && setExpandedId(isExpanded ? null : ev.id)}
                          className={`transition-colors ${hasDetail ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        >
                          <td className="pl-4 py-3 text-gray-400">
                            {hasDetail && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(ev.createdAt).toLocaleString('es-CO', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            <div className="flex items-center gap-1.5">
                              <span className="shrink-0" title={isOperational ? 'Fallo operativo' : 'Evento de amenaza'}>
                                {isOperational ? (
                                  <Wrench className="w-3.5 h-3.5 text-gray-400" />
                                ) : (
                                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                                )}
                              </span>
                              {actionLabel(ev.action)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${LEVEL_STYLE[ev.level] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {ev.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {ev.username === 'SYSTEM' ? (
                              <span className="text-gray-400 text-xs font-mono">SYSTEM</span>
                            ) : (
                              ev.username
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-md truncate" title={ev.description}>
                            {ev.description}
                          </td>
                        </tr>
                        {isExpanded && hasDetail && (
                          <tr className="bg-gray-50">
                            <td />
                            <td colSpan={5} className="px-4 py-3">
                              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                                {Object.entries(ev.additionalData ?? {}).map(([key, value]) => (
                                  <div key={key} className="flex flex-col">
                                    <dt className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{key}</dt>
                                    <dd className="text-xs text-gray-700 font-mono break-all">{formatDetailValue(value)}</dd>
                                  </div>
                                ))}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              {data?.events.meta.totalElements ?? 0} resultado{(data?.events.meta.totalElements ?? 0) !== 1 ? 's' : ''} — Página {currentPage + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="cursor-pointer p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="cursor-pointer p-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
