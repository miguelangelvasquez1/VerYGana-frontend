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
  XCircle,
} from 'lucide-react';
import {
  approveContractReview,
  getContractForReview,
  getContracts,
  rejectContractReview,
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

type FilterOption = ContractReviewListStatus | 'ALL';

const FILTER_TABS: { value: FilterOption; label: string }[] = [
  { value: 'PENDING_VERYGANA_REVIEW', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'REJECTED', label: 'Rechazados' },
  { value: 'ALL', label: 'Todos' },
];

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
        <span className="cmp-mono">
          v{summary.version} · Ruta {summary.route}
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

export default function ContractsReviewPanel() {
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

  return (
    <>
      <div className="space-y-6">
        <PanelHeader
          eyebrow="Onboarding comercial"
          title="Contratos comerciales"
          description="Última revisión antes de habilitar a la empresa en la plataforma."
          count={loading ? 0 : contracts.length}
          countLabel={filter === 'PENDING_VERYGANA_REVIEW' ? 'Pendientes' : 'Contratos'}
          actions={<RefreshButton onClick={load} loading={loading} />}
        />

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
                  const status = STATUS[c.status];
                  const pending = c.status === 'PENDING_VERYGANA_REVIEW';
                  return (
                    <LedgerRow key={c.contractId} index={i} tone={status.tone}>
                      <Td className="font-medium text-cmp-ink">{c.companyName}</Td>
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
