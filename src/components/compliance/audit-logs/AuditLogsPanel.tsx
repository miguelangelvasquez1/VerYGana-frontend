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
  auditLevel,
  type AuditLogDTO,
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

const LEVEL: Record<auditLevel, { tone: Tone; label: string }> = {
  [auditLevel.DEBUG]: { tone: 'neutral', label: 'Debug' },
  [auditLevel.INFO]: { tone: 'info', label: 'Info' },
  [auditLevel.WARNING]: { tone: 'hold', label: 'Alerta' },
  [auditLevel.CRITICAL]: { tone: 'flag', label: 'Crítico' },
};

// La entidad afectada llega con entityPublicId si es un usuario, o con
// entityId en cualquier otro caso — nunca ambos.
const entityRef = (log: AuditLogDTO) => {
  const ref = log.entityPublicId ?? (log.entityId != null ? `#${log.entityId}` : null);
  if (!log.entityType && !ref) return null;
  return [log.entityType, ref].filter(Boolean).join(' ');
};

const hasAdditionalData = (log: AuditLogDTO) =>
  !!log.additionalData && Object.keys(log.additionalData).length > 0;

const hasDetail = (log: AuditLogDTO) =>
  !!(log.description || entityRef(log) || log.ipAddress || log.userAgent || hasAdditionalData(log));

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="cmp-label text-cmp-mute">{label}</dt>
      <dd className="mt-0.5 break-words text-cmp-slate">{children}</dd>
    </div>
  );
}

const emptyFilters: AuditLogFilters = {
  userPublicId: undefined,
  action: '',
  level: '',
  category: '',
  success: undefined,
  from: '',
  to: '',
};

// El backend recibe userPublicId como UUID: cualquier otro formato responde
// 400, así que se valida antes de pedir.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalidUserPublicId = (f: AuditLogFilters) =>
  !!f.userPublicId && !UUID_RE.test(f.userPublicId);

const countActive = (f: AuditLogFilters) =>
  [f.userPublicId, f.action, f.level, f.category, f.success, f.from, f.to].filter(
    (v) => v !== undefined && v !== ''
  ).length;

/* ── Fila expandible ─────────────────────────────────────────────────── */

function LogRow({ log, index }: { log: AuditLogDTO; index: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const level = LEVEL[log.level] ?? { tone: 'neutral' as Tone, label: log.level };
  const detail = hasDetail(log);
  const entity = entityRef(log);

  return (
    <>
      <LedgerRow index={index} tone={level.tone}>
        <Td className="cmp-mono text-[11px] text-cmp-mute">{log.id}</Td>
        <Td>
          {log.username || log.userEmail ? (
            <div className="min-w-0" title={log.userPublicId ?? undefined}>
              <p className="truncate text-cmp-ink">{log.username || log.userEmail}</p>
              {log.username && log.userEmail && (
                <p className="truncate text-[11px] text-cmp-mute">{log.userEmail}</p>
              )}
            </div>
          ) : log.userPublicId ? (
            <Ref muted>{log.userPublicId.slice(0, 8)}</Ref>
          ) : (
            <span className="text-cmp-rule">—</span>
          )}
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
          {detail && (
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
        {open && detail && (
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
                <div className="space-y-3 px-4 py-3 text-[12px]">
                  {log.description && <p className="leading-relaxed text-cmp-ink">{log.description}</p>}
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {entity && (
                      <DetailItem label="Entidad">
                        <span className="cmp-mono text-[11px]">{entity}</span>
                      </DetailItem>
                    )}
                    {log.ipAddress && (
                      <DetailItem label="IP">
                        <span className="cmp-mono text-[11px]">{log.ipAddress}</span>
                      </DetailItem>
                    )}
                    {log.userAgent && <DetailItem label="User agent">{log.userAgent}</DetailItem>}
                  </dl>
                  {hasAdditionalData(log) && (
                    <pre className="cmp-mono overflow-x-auto rounded-lg bg-white/70 p-3 text-[11px] leading-relaxed text-cmp-slate">
                      {JSON.stringify(log.additionalData, null, 2)}
                    </pre>
                  )}
                </div>
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
  const [data, setData] = useState<PageResponse<AuditLogDTO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const reduce = useReducedMotion();

  const fetchLogs = useCallback(
    async (activeTab: 'all' | 'critical', activeFilters: AuditLogFilters, page: number) => {
      // "Solo críticos" no filtra por usuario, así que ahí el campo no bloquea.
      if (activeTab === 'all' && invalidUserPublicId(activeFilters)) {
        setFiltersOpen(true);
        return;
      }
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
  const userIdInvalid = invalidUserPublicId(filters);

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
                <Field label="Usuario (publicId)">
                  <input
                    type="text"
                    placeholder="3f2a9c1e-…"
                    value={filters.userPublicId ?? ''}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        userPublicId: e.target.value.trim() || undefined,
                      }))
                    }
                    aria-invalid={userIdInvalid}
                    className={`${inputClass} cmp-mono ${
                      userIdInvalid ? 'border-cmp-flag focus:border-cmp-flag' : ''
                    }`}
                  />
                  {userIdInvalid && (
                    <span className="mt-1 block text-[11px] text-cmp-flag">
                      Debe ser un UUID completo, ej. 3f2a9c1e-8b4d-4e2f-9a1c-0d5e6f7a8b9c
                    </span>
                  )}
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
                    <option value="DEBUG">Debug</option>
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
                <Btn
                  size="sm"
                  variant="primary"
                  icon={Search}
                  onClick={handleSearch}
                  disabled={tab === 'all' && userIdInvalid}
                >
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
