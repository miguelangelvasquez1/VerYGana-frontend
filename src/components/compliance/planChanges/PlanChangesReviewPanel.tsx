'use client';

/**
 * Cambios de plan.
 *
 * Mismo mecanismo de revisión que los Contratos comerciales de onboarding
 * (Ledger + diálogo con aprobar/rechazar), pero para otrosíes de cambio de
 * plan: sin ruta, documentos ni antecedentes — solo plan origen→destino y,
 * si aplica, el abono requerido.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Eye,
  ExternalLink,
  FileSignature,
  FileText,
  Inbox,
  XCircle,
} from 'lucide-react';
import {
  approveContractReview,
  rejectContractReview,
  markContractSigned,
} from '@/services/ComplianceService';
import {
  getPlanChangeReviewQueue,
  getPlanChangeContractForReview,
  type PlanChangeReviewListItemDTO,
} from '@/services/CompliancePlanChangeService';
import { ContractStatus, ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { formatBudget, formatCents } from '@/utils/currency';
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

const PLAN_LABELS: Record<PlanCode, string> = {
  [PlanCode.BASIC]: 'Personal',
  [PlanCode.STANDARD]: 'Estándar',
  [PlanCode.PREMIUM]: 'Premium',
};

const STATUS: Record<ContractStatus, { label: string; tone: Tone }> = {
  PENDING_BUSINESS_REVIEW: { label: 'Esperando al comercial', tone: 'neutral' },
  PENDING_VERYGANA_REVIEW: { label: 'Pendiente de revisión', tone: 'hold' },
  APPROVED: { label: 'Aprobado — enviando a firma', tone: 'info' },
  PENDING_SIGNATURE: { label: 'Pendiente de firma', tone: 'info' },
  SIGNED: { label: 'Firmado', tone: 'clear' },
  REJECTED: { label: 'Rechazado', tone: 'flag' },
};

// Fallback defensivo, igual criterio que ContractsReviewPanel.tsx — status
// nulo (solicitud sin contrato generado aún) o valores futuros no mapeados.
function getStatus(status: string | null): { label: string; tone: Tone } {
  if (!status) return { label: 'Sin contrato', tone: 'neutral' };
  return STATUS[status as ContractStatus] ?? { label: status, tone: 'neutral' };
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Diálogo de revisión ─────────────────────────────────────────────── */

function PlanChangeDetailModal({
  item,
  onClose,
  onDecided,
}: {
  item: PlanChangeReviewListItemDTO;
  onClose: () => void;
  onDecided: () => void;
}) {
  const reduce = useReducedMotion();
  const [detail, setDetail] = useState<ContractSummaryResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (item.contractId == null) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      setDetail(await getPlanChangeContractForReview(item.contractId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [item.contractId]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load();
  }, [load]);

  const handleApprove = async () => {
    if (item.contractId == null || actionLoading) return;
    setActionLoading(true);
    try {
      await approveContractReview(item.contractId);
      toast.success(`Otrosí aprobado — ${item.companyName}`);
      onDecided();
    } catch {
      toast.error('No se pudo aprobar el otrosí. Intenta de nuevo.');
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (item.contractId == null || !reason.trim() || actionLoading) return;
    setActionLoading(true);
    try {
      // Para cambio de plan siempre false — no hay documentos que corregir.
      await rejectContractReview(item.contractId, reason.trim(), false);
      toast.success(`Otrosí rechazado — ${item.companyName}`);
      onDecided();
    } catch {
      toast.error('No se pudo rechazar el otrosí. Intenta de nuevo.');
      setActionLoading(false);
    }
  };

  const handleMarkSigned = async () => {
    if (item.contractId == null || actionLoading) return;
    setActionLoading(true);
    try {
      await markContractSigned(item.contractId);
      toast.success('Contrato marcado como firmado.');
      onDecided();
    } catch {
      toast.error('No se pudo marcar como firmado. Intenta de nuevo.');
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
      title={`Cambio de plan · ${item.companyName}`}
      subtitle={
        <span className="cmp-mono">
          {item.fromPlanCode ? PLAN_LABELS[item.fromPlanCode] : '—'} → {PLAN_LABELS[item.toPlanCode]}
          {item.requiredTopUpAmountCents
            ? ` · Abono ${formatBudget(formatCents(item.requiredTopUpAmountCents))}`
            : ''}
        </span>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="cmp-skeleton h-14 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : error || !detail ? (
        <ErrorState message="No se pudo cargar el otrosí." onRetry={load} />
      ) : (
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-cmp-hold/25 bg-cmp-hold-bg px-3 py-2.5">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-cmp-hold" />
            <p className="text-xs leading-relaxed text-cmp-hold">
              Otrosí generado a partir del Contrato Marco — pendiente de validación de VerYGana.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              ['Correo', item.email],
              ['Plan destino', PLAN_LABELS[item.toPlanCode]],
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
            Ver otrosí
            <ExternalLink className="h-3 w-3" />
          </a>

          {detail.status === 'PENDING_VERYGANA_REVIEW' ? (
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
                      placeholder="Qué debe corregir el comercial."
                    />
                    <div className="flex gap-3">
                      <Btn className="flex-1" onClick={() => setShowRejectForm(false)} disabled={actionLoading}>
                        Volver
                      </Btn>
                      <Btn
                        className="flex-1"
                        variant="danger"
                        icon={XCircle}
                        loading={actionLoading}
                        disabled={!reason.trim()}
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
                    <Btn className="flex-1" variant="approve" icon={Check} loading={actionLoading} onClick={handleApprove}>
                      Aprobar
                    </Btn>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : detail.status === 'PENDING_SIGNATURE' ? (
            <div className="border-t border-cmp-rule pt-4 space-y-3">
              <div className="rounded-lg border border-cmp-azul/25 bg-[#E8F1FA] px-3 py-3 text-sm text-cmp-azul">
                <p className="font-semibold">Aprobado — enviado a firma electrónica</p>
                <p className="mt-1 text-xs opacity-90">
                  La firma se confirma sola vía el webhook de ZapSign. Usa el botón de abajo solo como respaldo manual.
                </p>
              </div>
              <Btn variant="quiet" icon={FileSignature} loading={actionLoading} onClick={handleMarkSigned}>
                Marcar como firmado
              </Btn>
            </div>
          ) : detail.status === 'APPROVED' ? (
            <div className="rounded-lg border border-cmp-clear/25 bg-cmp-clear-bg px-3 py-3 text-sm text-cmp-clear">
              <p className="font-semibold">
                Aprobado — a punto de enviarse a firma
                {detail.veryganaReviewedAt && ` · ${formatDate(detail.veryganaReviewedAt)}`}
              </p>
            </div>
          ) : detail.status === 'SIGNED' ? (
            <div className="rounded-lg border border-cmp-clear/25 bg-cmp-clear-bg px-3 py-3 text-sm text-cmp-clear">
              <p className="font-semibold">Firmado — el cambio de plan se aplica automáticamente.</p>
            </div>
          ) : detail.status === 'REJECTED' ? (
            <div className="rounded-lg border border-cmp-flag/25 bg-cmp-flag-bg px-3 py-3 text-sm text-cmp-flag">
              <p className="font-semibold">
                Rechazado{detail.veryganaReviewedAt && ` · ${formatDate(detail.veryganaReviewedAt)}`}
              </p>
              {detail.veryganaDecisionNotes && <p className="mt-1 text-xs opacity-90">{detail.veryganaDecisionNotes}</p>}
            </div>
          ) : (
            <div className="rounded-lg border border-cmp-rule bg-cmp-rule-soft/50 px-3 py-3 text-sm text-cmp-slate">
              Esperando aprobación del comercial.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────── */

type QueueTab = 'actionable' | 'all';

export default function PlanChangesReviewPanel() {
  const [items, setItems] = useState<PlanChangeReviewListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<PlanChangeReviewListItemDTO | null>(null);
  const [tab, setTab] = useState<QueueTab>('actionable');
  // Evita el doble fetch de React Strict Mode en el montaje inicial.
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await getPlanChangeReviewQueue());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load();
  }, [load]);

  const handleDecided = () => {
    setSelected(null);
    load();
  };

  const actionableCount = items.filter((i) => i.contractStatus === 'PENDING_VERYGANA_REVIEW').length;
  const visible = tab === 'actionable' ? items.filter((i) => i.contractStatus === 'PENDING_VERYGANA_REVIEW') : items;

  // El endpoint no soporta filtro por estado — esta pestaña es puramente
  // cliente-side, solo para que sea fácil encontrar lo accionable.
  const tabs: { value: QueueTab; label: string }[] = [
    { value: 'actionable', label: actionableCount ? `Pendientes de revisión (${actionableCount})` : 'Pendientes de revisión' },
    { value: 'all', label: 'Todas' },
  ];

  const emptyHint =
    tab === 'actionable' ? 'Ninguna solicitud espera revisión.' : 'No hay solicitudes de cambio de plan registradas.';

  return (
    <>
      <div className="space-y-6">
        <PanelHeader
          eyebrow="Onboarding comercial"
          title="Cambios de plan"
          description="Otrosíes generados cuando un comercial pide cambiar de plan."
          count={loading ? 0 : visible.length}
          countLabel={tab === 'actionable' ? 'Pendientes' : 'Solicitudes'}
          actions={<RefreshButton onClick={load} loading={loading} />}
        />

        <Tabs layoutId="cmp-plan-changes-tab" options={tabs} value={tab} onChange={setTab} />

        {loading ? (
          <SkeletonRows rows={5} cols={6} />
        ) : error ? (
          <ErrorState message="No se pudieron cargar las solicitudes de cambio de plan." onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState icon={Inbox} title="Nada por aquí" hint={emptyHint} />
        ) : (
          <Ledger>
            <LedgerTable>
              <LedgerHead>
                <ThSpine />
                <Th>Empresa</Th>
                <Th>Correo</Th>
                <Th>Plan</Th>
                <Th>Abono</Th>
                <Th>Estado</Th>
                <Th>Solicitado</Th>
                <Th align="right">Acción</Th>
              </LedgerHead>
              <LedgerBody>
                {visible.map((item, i) => {
                  const status = getStatus(item.contractStatus);
                  const pending = item.contractStatus === 'PENDING_VERYGANA_REVIEW';
                  const hasContract = item.contractId != null;
                  return (
                    <LedgerRow key={item.id} index={i} tone={status.tone}>
                      <Td className="font-medium text-cmp-ink">{item.companyName}</Td>
                      <Td className="text-cmp-slate">{item.email}</Td>
                      <Td className="cmp-mono text-[12px] text-cmp-slate">
                        {item.fromPlanCode ? PLAN_LABELS[item.fromPlanCode] : '—'} → {PLAN_LABELS[item.toPlanCode]}
                      </Td>
                      <Td className="text-cmp-slate">
                        {item.requiredTopUpAmountCents ? formatBudget(formatCents(item.requiredTopUpAmountCents)) : '—'}
                      </Td>
                      <Td>
                        <StatusTag tone={status.tone}>{status.label}</StatusTag>
                      </Td>
                      <Td className="cmp-mono text-[11px] text-cmp-mute">{formatDate(item.requestedAt)}</Td>
                      <Td align="right">
                        {!hasContract ? (
                          <span className="text-xs text-cmp-mute">Sin contrato aún</span>
                        ) : (
                          <Btn
                            size="sm"
                            variant={pending ? 'primary' : 'quiet'}
                            icon={pending ? ClipboardCheck : Eye}
                            onClick={() => setSelected(item)}
                          >
                            {pending ? 'Revisar' : 'Ver detalle'}
                          </Btn>
                        )}
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
          <PlanChangeDetailModal
            key="plan-change-detail"
            item={selected}
            onClose={() => setSelected(null)}
            onDecided={handleDecided}
          />
        )}
      </AnimatePresence>
    </>
  );
}
