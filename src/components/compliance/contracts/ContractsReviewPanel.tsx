'use client';

/**
 * Contratos comerciales.
 *
 * Ledger para localizar el contrato, y un diálogo para decidirlo. El rechazo
 * vive detrás de una segunda pantalla dentro del mismo diálogo: aprobar es un
 * clic, rechazar exige escribir el motivo y decir si es documental — de eso
 * depende que el empresario pueda corregirlo por su cuenta.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Clock,
  Eye,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  X,
  XCircle,
} from 'lucide-react';
import {
  approveContractReview,
  getBackgroundCheckDetail,
  getBackgroundChecks,
  getContractForReview,
  getContracts,
  refreshBackgroundCheck,
  rejectContractReview,
  triggerBackgroundChecks,
  type BackgroundCheck,
  type BackgroundCheckDetail,
  type BackgroundCheckFindingResult,
  type BackgroundCheckFindingSeverity,
  type BackgroundCheckStatus,
  type BackgroundCheckType,
  type ContractReviewDetail,
  type ContractReviewListStatus,
  type PendingContractSummary,
} from '@/services/ComplianceService';
import { DOCUMENT_TYPE_LABELS } from '@/services/commercial/OnboardingService';
import {
  Btn,
  EmptyState,
  ErrorState,
  Ledger,
  LedgerBody,
  LedgerHead,
  LedgerRow,
  LedgerTable,
  Modal,
  PanelHeader,
  Ref,
  RefreshButton,
  SkeletonRows,
  StatusTag,
  Tabs,
  Td,
  TextField,
  Th,
  ThSpine,
  type Tone,
} from '@/components/compliance/ui/primitives';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
import NegotiationsPanel from './NegotiationsPanel';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS: Record<ContractReviewListStatus, { label: string; tone: Tone }> = {
  PENDING_VERYGANA_REVIEW: { label: 'Pendiente', tone: 'hold' },
  APPROVED: { label: 'Aprobado', tone: 'clear' },
  REJECTED: { label: 'Rechazado', tone: 'flag' },
};

// Fallback defensivo — si el backend agrega un status nuevo que este panel
// todavía no mapea (ej. estados post-aprobación de firma/pago), mostramos el
// valor crudo en vez de tronar el render con `STATUS[...]` undefined.
function getStatus(status: string): { label: string; tone: Tone } {
  return STATUS[status as ContractReviewListStatus] ?? { label: status, tone: 'neutral' };
}

function formatRelative(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'hace instantes';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  return `hace ${Math.round(diffH / 24)} d`;
}

const BACKGROUND_CHECK_STATUS_BADGE: Record<BackgroundCheckStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: 'No iniciado', className: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'En progreso', className: 'bg-amber-100 text-amber-700' },
  DELAYED: { label: 'Demorado', className: 'bg-amber-100 text-amber-700' },
  ERROR: { label: 'Error', className: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Completado', className: 'bg-emerald-100 text-emerald-700' },
};

const CHECK_TYPE_LABELS: Record<BackgroundCheckType, string> = {
  PERSON: 'Representante legal',
  COMPANY: 'Empresa',
};

const FINDING_RESULT_LABELS: Record<BackgroundCheckFindingResult, string> = {
  found: 'Hallazgo',
  not_found: 'Sin hallazgos',
  error: 'Error',
  delayed: 'Demorado',
  expired: 'Expirado',
  skipped: 'Omitido',
};

const FINDING_RESULT_BADGE: Record<BackgroundCheckFindingResult, string> = {
  found: 'bg-amber-100 text-amber-700',
  not_found: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-700',
  delayed: 'bg-amber-100 text-amber-700',
  expired: 'bg-gray-100 text-gray-700',
  skipped: 'bg-gray-100 text-gray-700',
};

const FINDING_SEVERITY_LABELS: Record<BackgroundCheckFindingSeverity, string> = {
  none: 'Sin severidad',
  unknown: 'Desconocida',
  very_low: 'Muy baja',
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  very_high: 'Muy alta',
};

const FINDING_SEVERITY_BADGE: Record<BackgroundCheckFindingSeverity, string> = {
  none: 'bg-emerald-100 text-emerald-700',
  unknown: 'bg-gray-100 text-gray-700',
  very_low: 'bg-emerald-100 text-emerald-700',
  low: 'bg-lime-100 text-lime-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  very_high: 'bg-red-100 text-red-700',
};

type FilterOption = ContractReviewListStatus | 'ALL';

const FILTER_TABS: { value: FilterOption; label: string }[] = [
  { value: 'PENDING_VERYGANA_REVIEW', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'REJECTED', label: 'Rechazados' },
  { value: 'ALL', label: 'Todos' },
];

function PepBadge() {
  return (
    <span
      title="Representante legal declarado como PEP"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700"
    >
      <AlertTriangle className="w-3 h-3" />
      PEP
    </span>
  );
}

function BackgroundCheckDetailModal({
  check,
  onClose,
}: {
  check: BackgroundCheck;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<BackgroundCheckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setDetail(await getBackgroundCheckDetail(check.id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [check.id]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Detalle de antecedentes — {check.subjectName}</h3>
          <button onClick={onClose} className="cursor-pointer p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center gap-3 py-10 text-red-500">
            <AlertTriangle className="w-6 h-6" />
            <p className="text-sm font-medium">Error al cargar el detalle.</p>
            <button onClick={load} className="cursor-pointer text-xs text-indigo-600 hover:underline">Reintentar</button>
          </div>
        ) : detail.details.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Sin hallazgos reportados.</p>
        ) : (
          <div className="space-y-3">
            {detail.details.map((finding, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <p className="font-semibold text-sm text-gray-800">{finding.database_name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${FINDING_RESULT_BADGE[finding.result] ?? 'bg-gray-100 text-gray-700'}`}>
                      {FINDING_RESULT_LABELS[finding.result] ?? finding.result}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${FINDING_SEVERITY_BADGE[finding.severity] ?? 'bg-gray-100 text-gray-700'}`}>
                      {FINDING_SEVERITY_LABELS[finding.severity] ?? finding.severity}
                    </span>
                  </div>
                </div>
                {finding.update_date && (
                  <p className="text-[11px] text-gray-400 mb-2">Actualizado: {formatDate(finding.update_date)}</p>
                )}
                {(finding.tables ?? []).map((table, ti) => (
                  <div key={ti} className="mt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-1">{table.title}</p>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                      {table.rows.map((row, ri) => (
                        <div key={ri} className="px-2.5 py-1.5 text-xs flex flex-wrap gap-x-4 gap-y-1 bg-gray-50/60">
                          {row.cells.map((cell, ci) => (
                            <span key={ci}>
                              <span className="text-gray-400">{cell.label}: </span>
                              <span className="text-gray-700 font-medium">{cell.value}</span>
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BackgroundChecksSection({ contractId }: { contractId: number }) {
  const [checks, setChecks] = useState<BackgroundCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [detailCheck, setDetailCheck] = useState<BackgroundCheck | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setChecks(await getBackgroundChecks(contractId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load();
  }, [load]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const created = await triggerBackgroundChecks(contractId);
      setChecks(created);
      setShowConfirm(false);
    } catch {
      // el botón de "Consultar antecedentes" vuelve a estar disponible — el
      // officer puede reintentar manualmente, no hay retry automático.
    } finally {
      setTriggering(false);
    }
  };

  const handleRefresh = async (id: number) => {
    setRefreshingId(id);
    try {
      const updated = await refreshBackgroundCheck(id);
      setChecks((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      // silencioso — el registro conserva su último estado conocido.
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="pt-2 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Antecedentes
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={triggering}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition"
        >
          {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Consultar antecedentes
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-6 text-red-500">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-xs font-medium">Error al cargar antecedentes.</p>
          <button onClick={load} className="cursor-pointer text-xs text-indigo-600 hover:underline">Reintentar</button>
        </div>
      ) : checks.length === 0 ? (
        <p className="text-sm text-gray-400">Aún no se han consultado antecedentes para este contrato.</p>
      ) : (
        <ul className="space-y-2">
          {checks.map((check) => {
            const badge = BACKGROUND_CHECK_STATUS_BADGE[check.status];
            return (
              <li key={check.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {CHECK_TYPE_LABELS[check.checkType]} · {check.subjectName}
                    </p>
                    <p className="text-xs text-gray-500">{check.subjectDocument}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <p className="text-[11px] text-gray-400">
                    Solicitado {formatRelative(check.requestedAt)}
                    {check.completedAt && ` · Completado ${formatRelative(check.completedAt)}`}
                  </p>

                  {check.status === 'COMPLETED' ? (
                    <div className="flex items-center gap-3 shrink-0">
                      {check.score !== null && (
                        <span className="text-xs font-semibold text-gray-700">
                          Score: {(check.score * 10).toFixed(1)}/10
                        </span>
                      )}
                      {check.pdfReportUrl && (
                        <a
                          href={check.pdfReportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          <FileText className="w-3 h-3" /> Ver reporte PDF
                        </a>
                      )}
                      <button
                        onClick={() => setDetailCheck(check)}
                        className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        <Eye className="w-3 h-3" /> Ver detalle
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRefresh(check.id)}
                      disabled={refreshingId === check.id}
                      className="cursor-pointer shrink-0 inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      {refreshingId === check.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      Actualizar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !triggering && setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h4 className="font-bold text-gray-900 mb-2">Consultar antecedentes</h4>
            <p className="text-sm text-gray-600">
              Esto genera una consulta nueva en ZapSign y tiene costo. ¿Continuar?
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={triggering}
                className="cursor-pointer flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="cursor-pointer flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {detailCheck && (
        <BackgroundCheckDetailModal check={detailCheck} onClose={() => setDetailCheck(null)} />
      )}
    </div>
  );
}
/* ── Diálogo de revisión ─────────────────────────────────────────────── */

function ContractDetailModal({
  summary,
  onClose,
  onDecided,
}: {
  summary: PendingContractSummary;
  onClose: () => void;
  onDecided: () => void;
}) {
  const reduce = useReducedMotion();
  const [detail, setDetail] = useState<ContractReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const [documentsIssue, setDocumentsIssue] = useState<boolean | null>(null);
  // Evita el doble llamado que provoca React Strict Mode en dev (monta ->
  // limpia -> vuelve a montar cada efecto) — el modal se desmonta por
  // completo al cerrarse, así que no hace falta resetear esto para volver
  // a cargar un contrato distinto (eso ya crea una instancia nueva).
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setDetail(await getContractForReview(summary.contractId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [summary.contractId]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load();
  }, [load]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveContractReview(summary.contractId);
      toast.success(`Contrato aprobado — ${summary.companyName}`);
      onDecided();
    } catch {
      toast.error('No se pudo aprobar el contrato. Intenta de nuevo.');
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim() || documentsIssue === null) return;
    setActionLoading(true);
    try {
      await rejectContractReview(summary.contractId, reason.trim(), documentsIssue);
      toast.success(`Contrato rechazado — ${summary.companyName}`);
      onDecided();
    } catch {
      toast.error('No se pudo rechazar el contrato. Intenta de nuevo.');
      setActionLoading(false);
    }
  };

  const slide = (dir: 1 | -1) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { opacity: 0, x: 24 * dir },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -24 * dir },
        };

  return (
    <Modal
      onClose={onClose}
      size="lg"
      title={`Contrato · ${summary.companyName}`}
      subtitle={
        <span className="inline-flex items-center gap-2">
          <span className="cmp-mono">
            v{summary.version} · Ruta {summary.route}
          </span>
          {summary.pep && <PepBadge />}
        </span>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="cmp-skeleton h-14 rounded-xl"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      ) : error || !detail ? (
        <ErrorState message="No se pudo cargar el contrato." onRetry={load} />
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-cmp-hold/25 bg-cmp-hold-bg px-3 py-2.5">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-cmp-hold" />
            <p className="text-xs leading-relaxed text-cmp-hold">
              Plantilla base pendiente de validación jurídica final por el equipo legal.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              ['Correo', summary.email],
              ['Ruta', summary.route],
              ['Versión', `v${detail.version}`],
              ['Aprobado por el negocio', formatDate(detail.businessApprovedAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="cmp-label text-cmp-mute">{label}</dt>
                <dd className="mt-1 truncate text-sm text-cmp-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <a
            href={detail.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cmp-pressable inline-flex items-center gap-1.5 rounded-lg border border-cmp-azul/25 bg-white px-3 py-2 text-xs font-semibold text-cmp-azul hover:bg-[#E8F1FA]"
          >
            <FileText className="h-3.5 w-3.5" />
            Ver contrato
            <ExternalLink className="h-3 w-3" />
          </a>

          <section>
            <p className="cmp-label mb-2 text-cmp-mute">Documentos ({detail.documents.length})</p>
            {detail.documents.length === 0 ? (
              <p className="text-sm text-cmp-slate">No hay documentos cargados.</p>
            ) : (
              <ul className="space-y-2">
                {detail.documents.map((doc, i) => (
                  <li
                    key={doc.id}
                    className="cmp-row-in flex items-center gap-3 rounded-lg border border-cmp-rule bg-white px-3 py-2.5"
                    style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-cmp-mute" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-cmp-ink">
                        {DOCUMENT_TYPE_LABELS[doc.documentType]}
                      </p>
                      <p className="cmp-mono truncate text-[11px] text-cmp-mute">
                        {doc.originalFileName} · {formatBytes(doc.sizeBytes)}
                      </p>
                    </div>
                    {doc.downloadUrl ? (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs font-semibold text-cmp-azul hover:underline"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-cmp-hold">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <BackgroundChecksSection contractId={summary.contractId} />

          {detail.status !== 'PENDING_VERYGANA_REVIEW' ? (
            <div
              className={`rounded-lg border px-3 py-3 text-sm ${
                detail.status === 'APPROVED'
                  ? 'border-cmp-clear/25 bg-cmp-clear-bg text-cmp-clear'
                  : 'border-cmp-flag/25 bg-cmp-flag-bg text-cmp-flag'
              }`}
            >
              <p className="font-semibold">
                {detail.status === 'APPROVED' ? 'Contrato aprobado' : 'Contrato rechazado'}
                {detail.veryganaReviewedAt && ` · ${formatDate(detail.veryganaReviewedAt)}`}
              </p>
              {detail.veryganaDecisionNotes && (
                <p className="mt-1 text-xs opacity-90">{detail.veryganaDecisionNotes}</p>
              )}
            </div>
          ) : (
            <div className="border-t border-cmp-rule pt-4">
              {/* Decidir y motivar el rechazo son dos pantallas; se deslizan
                  una sobre otra para que se entienda que es un paso más. */}
              <AnimatePresence mode="wait" initial={false}>
                {showRejectForm ? (
                  <motion.div
                    key="reject"
                    {...slide(1)}
                    transition={{ duration: 0.22, ease: EASE_OUT }}
                    className="space-y-4"
                  >
                    <TextField
                      label="Motivo del rechazo"
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Qué debe corregir el empresario."
                    />

                    <div>
                      <p className="cmp-label mb-2 text-cmp-mute">¿El rechazo es por documentos?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { v: true, label: 'Sí, es documental' },
                          { v: false, label: 'No, otro motivo' },
                        ].map(({ v, label }) => (
                          <button
                            key={String(v)}
                            type="button"
                            onClick={() => setDocumentsIssue(v)}
                            className={`cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium ${
                              documentsIssue === v
                                ? 'border-cmp-azul bg-[#E8F1FA] text-cmp-azul'
                                : 'border-cmp-rule bg-white text-cmp-slate hover:border-cmp-mute'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-cmp-slate">
                        {documentsIssue === true
                          ? 'El empresario podrá corregir los documentos por su cuenta.'
                          : documentsIssue === false
                          ? 'Sin autoservicio: el empresario verá que lo vamos a contactar.'
                          : 'Elige una opción para poder confirmar el rechazo.'}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Btn
                        className="flex-1"
                        onClick={() => setShowRejectForm(false)}
                        disabled={actionLoading}
                      >
                        Volver
                      </Btn>
                      <Btn
                        className="flex-1"
                        variant="danger"
                        icon={XCircle}
                        loading={actionLoading}
                        disabled={!reason.trim() || documentsIssue === null}
                        onClick={handleReject}
                      >
                        Confirmar rechazo
                      </Btn>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="decide"
                    {...slide(-1)}
                    transition={{ duration: 0.22, ease: EASE_OUT }}
                    className="flex gap-3"
                  >
                    <Btn
                      className="flex-1"
                      variant="reject"
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                    >
                      Rechazar
                    </Btn>
                    <Btn
                      className="flex-1"
                      variant="approve"
                      icon={Check}
                      loading={actionLoading}
                      onClick={handleApprove}
                    >
                      Aprobar
                    </Btn>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────── */

type MainTab = 'negotiations' | 'contracts';

export default function ContractsReviewPanel() {
  const [activeTab, setActiveTab] = useState<MainTab>('contracts');
  const [negotiationsCount, setNegotiationsCount] = useState<number | null>(null);
  const [contracts, setContracts] = useState<PendingContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<PendingContractSummary | null>(null);
  const [filter, setFilter] = useState<FilterOption>('PENDING_VERYGANA_REVIEW');
  // Evita el doble fetch de React Strict Mode en el montaje inicial sin
  // impedir que un cambio real de filtro dispare una recarga.
  const loadedFilterRef = useRef<FilterOption | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setContracts(await getContracts(filter === 'ALL' ? undefined : filter));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (loadedFilterRef.current === filter) return;
    loadedFilterRef.current = filter;
    load();
  }, [filter, load]);

  const handleDecided = () => {
    setSelected(null);
    load();
  };

  const emptyLabel =
    filter === 'ALL'
      ? 'No hay contratos registrados.'
      : filter === 'PENDING_VERYGANA_REVIEW'
      ? 'Ningún contrato espera revisión.'
      : filter === 'APPROVED'
      ? 'Todavía no hay contratos aprobados.'
      : 'Todavía no hay contratos rechazados.';

  const mainTabs: { value: MainTab; label: string }[] = [
    {
      value: 'negotiations',
      label: negotiationsCount ? `Negociaciones (${negotiationsCount})` : 'Negociaciones',
    },
    { value: 'contracts', label: 'Contratos' },
  ];

  return (
    <>
      <div className="space-y-6">
        <PanelHeader
          eyebrow="Onboarding comercial"
          title="Contratos comerciales"
          description="Negociaciones de asesor y contratos generados por comercios."
          count={activeTab === 'contracts' ? (loading ? 0 : contracts.length) : undefined}
          countLabel={filter === 'PENDING_VERYGANA_REVIEW' ? 'Pendientes' : 'Contratos'}
          actions={
            activeTab === 'contracts' ? (
              <RefreshButton onClick={load} loading={loading} />
            ) : undefined
          }
        />

        <Tabs
          layoutId="cmp-contracts-main-tab"
          options={mainTabs}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'negotiations' && (
          <NegotiationsPanel onCountChange={setNegotiationsCount} />
        )}

        {activeTab === 'contracts' && (
          <>
        <Tabs
          layoutId="cmp-contracts-tab"
          options={FILTER_TABS}
          value={filter}
          onChange={setFilter}
        />

        {loading ? (
          <SkeletonRows rows={5} cols={6} />
        ) : error ? (
          <ErrorState message="No se pudieron cargar los contratos." onRetry={load} />
        ) : contracts.length === 0 ? (
          <EmptyState icon={Inbox} title="Nada por aquí" hint={emptyLabel} />
        ) : (
          <Ledger>
            <LedgerTable>
              <LedgerHead>
                <ThSpine />
                <Th>Empresa</Th>
                <Th>Correo</Th>
                <Th>Ruta</Th>
                <Th>Versión</Th>
                <Th>Estado</Th>
                <Th>Generado</Th>
                <Th>Decidido</Th>
                <Th align="right">Acción</Th>
              </LedgerHead>
              <LedgerBody>
                {contracts.map((c, i) => {
                  const status = getStatus(c.status);
                  const pending = c.status === 'PENDING_VERYGANA_REVIEW';
                  return (
                    <LedgerRow key={c.contractId} index={i} tone={status.tone}>
                      <Td className="font-medium text-cmp-ink">
                        <span className="inline-flex items-center gap-1.5">
                          {c.companyName}
                          {c.pep && <PepBadge />}
                        </span>
                      </Td>
                      <Td className="text-cmp-slate">{c.email}</Td>
                      <Td>
                        <Ref muted>Ruta {c.route}</Ref>
                      </Td>
                      <Td className="cmp-mono text-[12px] text-cmp-slate">v{c.version}</Td>
                      <Td>
                        <StatusTag tone={status.tone}>{status.label}</StatusTag>
                      </Td>
                      <Td className="cmp-mono text-[11px] text-cmp-mute">
                        {formatDate(c.generatedAt)}
                      </Td>
                      <Td className="cmp-mono text-[11px] text-cmp-mute">
                        {formatDate(c.veryganaReviewedAt)}
                      </Td>
                      <Td align="right">
                        <Btn
                          size="sm"
                          variant={pending ? 'primary' : 'quiet'}
                          icon={pending ? ClipboardCheck : Eye}
                          onClick={() => setSelected(c)}
                        >
                          {pending ? 'Revisar' : 'Ver detalle'}
                        </Btn>
                      </Td>
                    </LedgerRow>
                  );
                })}
              </LedgerBody>
            </LedgerTable>
          </Ledger>
        )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <ContractDetailModal
            key="contract-detail"
            summary={selected}
            onClose={() => setSelected(null)}
            onDecided={handleDecided}
          />
        )}
      </AnimatePresence>
    </>
  );
}
