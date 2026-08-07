'use client';

/**
 * Logs de auditoría.
 *
 * El registro inmutable de lo que pasó. No se decide nada aquí: se busca.
 * Todo lo que se compara —id, usuario, marca de tiempo— va en monoespaciada
 * con cifras tabulares, y el nivel se lee en el borde de la fila.
 */

import { useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, FileSearch, Search, SlidersHorizontal } from 'lucide-react';
import {
  getAuditLogs,
  getCriticalAuditLogs,
  type AuditLog,
  type AuditLogFilters,
  type PageResponse,
} from '@/services/ComplianceService';
import { dateToZonedIsoStart, dateToZonedIsoEnd } from '@/lib/utils/dateTime';
import {
  Btn,
  EmptyState,
  ErrorState,
  Field,
  Ledger,
  LedgerBody,
  LedgerHead,
  LedgerRow,
  LedgerTable,
  Pager,
  PanelHeader,
  Ref,
  SkeletonRows,
  StatusTag,
  Tabs,
  Td,
  Th,
  ThSpine,
  inputClass,
  type Tone,
} from '@/components/compliance/ui/primitives';

const PAGE_SIZE = 20;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const LEVEL: Record<AuditLog['level'], { tone: Tone; label: string }> = {
  INFO: { tone: 'info', label: 'Info' },
  WARNING: { tone: 'hold', label: 'Alerta' },
  CRITICAL: { tone: 'flag', label: 'Crítico' },
};

const emptyFilters: AuditLogFilters = {
  userId: undefined,
  action: '',
  level: '',
  category: '',
  success: undefined,
  from: '',
  to: '',
};

const countActive = (f: AuditLogFilters) =>
  [f.userId, f.action, f.level, f.category, f.success, f.from, f.to].filter(
    (v) => v !== undefined && v !== ''
  ).length;

/* ── Fila expandible ─────────────────────────────────────────────────── */

function LogRow({ log, index }: { log: AuditLog; index: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const level = LEVEL[log.level] ?? { tone: 'neutral' as Tone, label: log.level };

  return (
    <>
      <LedgerRow index={index} tone={level.tone}>
        <Td className="cmp-mono text-[11px] text-cmp-mute">{log.id}</Td>
        <Td>
          {log.userId ? <Ref muted>#{log.userId}</Ref> : <span className="text-cmp-rule">—</span>}
        </Td>
        <Td className="font-medium text-cmp-ink">{log.action}</Td>
        <Td>
          <StatusTag tone={level.tone}>{level.label}</StatusTag>
        </Td>
        <Td className="text-cmp-slate">{log.category}</Td>
        <Td>
          <span
            className={`cmp-label ${log.success ? 'text-cmp-clear' : 'text-cmp-flag'}`}
          >
            {log.success ? 'Exitoso' : 'Fallido'}
          </span>
        </Td>
        <Td className="cmp-mono whitespace-nowrap text-[11px] text-cmp-mute">
          {new Date(log.createdAt).toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Td>
        <Td align="right">
          {log.details && (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Ocultar detalle' : 'Ver detalle'}
              className="cursor-pointer rounded-lg p-1.5 text-cmp-mute hover:bg-cmp-rule-soft hover:text-cmp-ink"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
              />
            </button>
          )}
        </Td>
      </LedgerRow>

      {/* La fila misma es el elemento animado: si el <tr> se desmontara de
          inmediato, el cierre no se vería nunca. */}
      <AnimatePresence initial={false}>
        {open && log.details && (
          <motion.tr
            key="details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            <td colSpan={9} className="p-0">
              <motion.div
                initial={reduce ? false : { height: 0 }}
                animate={reduce ? {} : { height: 'auto' }}
                exit={reduce ? {} : { height: 0 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="overflow-hidden bg-cmp-rule-soft/40"
              >
                <pre className="cmp-mono overflow-x-auto px-4 py-3 text-[11px] leading-relaxed text-cmp-slate">
                  {log.details}
                </pre>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────── */

export default function AuditLogsPanel() {
  const [tab, setTab] = useState<'all' | 'critical'>('all');
  const [filters, setFilters] = useState<AuditLogFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [data, setData] = useState<PageResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const reduce = useReducedMotion();

  const fetchLogs = useCallback(
    async (activeTab: 'all' | 'critical', activeFilters: AuditLogFilters, page: number) => {
      setLoading(true);
      setError(false);
      try {
        const from = dateToZonedIsoStart(activeFilters.from);
        const to = dateToZonedIsoEnd(activeFilters.to);
        if (activeTab === 'critical') {
          setData(await getCriticalAuditLogs(from, to, page, PAGE_SIZE));
        } else {
          setData(await getAuditLogs({ ...activeFilters, from, to, page, size: PAGE_SIZE }));
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

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
  const activeFilters = countActive(filters);

  return (
    <div className="space-y-6">
      <PanelHeader
        eyebrow="Registro inmutable"
        title="Logs de auditoría"
        description="Toda acción sensible del sistema, con su autor y su resultado."
        count={data?.totalElements ?? 0}
        countLabel="Registros"
        actions={
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
              filtersOpen || activeFilters
                ? 'border-cmp-azul/30 bg-[#E8F1FA] text-cmp-azul'
                : 'border-cmp-rule bg-white text-cmp-slate hover:border-cmp-mute hover:text-cmp-ink'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeFilters > 0 && (
              <span className="cmp-mono rounded bg-cmp-azul px-1.5 py-0.5 text-[10px] text-white">
                {activeFilters}
              </span>
            )}
          </button>
        }
      />

      <Tabs
        layoutId="cmp-audit-tab"
        options={[
          { value: 'all' as const, label: 'Todos' },
          { value: 'critical' as const, label: 'Solo críticos' },
        ]}
        value={tab}
        onChange={handleTabChange}
      />

      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-cmp-rule bg-white p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Usuario ID">
                  <input
                    type="number"
                    placeholder="42"
                    value={filters.userId ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        userId: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className={`${inputClass} cmp-mono`}
                  />
                </Field>
                <Field label="Acción">
                  <input
                    placeholder="LOGIN"
                    value={filters.action ?? ''}
                    onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
                    className={`${inputClass} cmp-mono`}
                  />
                </Field>
                <Field label="Nivel">
                  <select
                    value={filters.level ?? ''}
                    onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Todos</option>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Alerta</option>
                    <option value="CRITICAL">Crítico</option>
                  </select>
                </Field>
                <Field label="Categoría">
                  <input
                    placeholder="AUTH"
                    value={filters.category ?? ''}
                    onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                    className={`${inputClass} cmp-mono`}
                  />
                </Field>
                <Field label="Resultado">
                  <select
                    value={filters.success === undefined ? '' : String(filters.success)}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        success: e.target.value === '' ? undefined : e.target.value === 'true',
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Todos</option>
                    <option value="true">Exitoso</option>
                    <option value="false">Fallido</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Desde">
                    <input
                      type="date"
                      value={filters.from ?? ''}
                      onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Hasta">
                    <input
                      type="date"
                      value={filters.to ?? ''}
                      onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-cmp-rule-soft pt-4">
                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFilters(emptyFilters);
                    setCurrentPage(0);
                    fetchLogs(tab, emptyFilters, 0);
                  }}
                >
                  Limpiar
                </Btn>
                <Btn size="sm" variant="primary" icon={Search} onClick={handleSearch}>
                  Buscar
                </Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!data && !loading && !error ? (
        <div className="rounded-xl border border-dashed border-cmp-rule bg-white/60 px-6 py-16 text-center">
          <FileSearch className="mx-auto h-7 w-7 text-cmp-mute" />
          <p className="mt-3 text-sm font-semibold text-cmp-ink">El registro está esperando</p>
          <p className="mt-1 text-sm text-cmp-slate">
            Ajusta los filtros y presiona Buscar para traer los movimientos.
          </p>
          <div className="mt-5 flex justify-center">
            <Btn size="sm" variant="primary" icon={Search} onClick={handleSearch}>
              Buscar
            </Btn>
          </div>
        </div>
      ) : loading ? (
        <SkeletonRows rows={8} cols={7} />
      ) : error ? (
        <ErrorState message="No se pudieron cargar los logs." onRetry={handleSearch} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Ningún movimiento coincide"
          hint="Amplía el rango de fechas o quita algún filtro."
        />
      ) : (
        <>
          <Ledger>
            <LedgerTable>
              <LedgerHead>
                <ThSpine />
                <Th>ID</Th>
                <Th>Usuario</Th>
                <Th>Acción</Th>
                <Th>Nivel</Th>
                <Th>Categoría</Th>
                <Th>Resultado</Th>
                <Th>Fecha</Th>
                <Th align="right">Detalle</Th>
              </LedgerHead>
              <LedgerBody>
                {logs.map((log, i) => (
                  <LogRow key={log.id} log={log} index={i} />
                ))}
              </LedgerBody>
            </LedgerTable>
          </Ledger>

          <Pager
            page={currentPage}
            totalPages={totalPages}
            total={data?.totalElements}
            onChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
