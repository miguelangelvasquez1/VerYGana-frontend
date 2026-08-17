'use client';

/**
 * Cola de revisión KYC.
 *
 * A diferencia de los demás paneles —que son ledgers para comparar— aquí el
 * oficial no compara: decide, caso por caso. Por eso son tarjetas y no filas:
 * cada expediente tiene espacio para su veredicto, y al decidirlo sale de la
 * pila mientras el contador baja. La cola se ve encoger.
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, CheckCircle2, ListChecks, ShieldCheck, XCircle } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  approveKyc,
  getPendingKyc,
  getUserScreeningHistory,
  rejectKyc,
  type KycPendingEntry,
  type ScreeningHistoryEntry,
} from '@/services/ComplianceService';
import {
  Btn,
  EmptyState,
  ErrorState,
  Modal,
  PanelHeader,
  Ref,
  RefreshButton,
  SkeletonRows,
  Spine,
  StatusTag,
  TextField,
  type Tone,
} from '@/components/compliance/ui/primitives';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * La cola mezcla dos tipos de expediente: personas naturales (documento,
 * PEP) y empresas (NIT, representante legal). Se leen distinto, así que la
 * tarjeta se arma según lo que el backend realmente mandó.
 */
const isCompany = (e: KycPendingEntry) =>
  Boolean(e.companyName || e.nit) ||
  String(e.role ?? '').replace(/^ROLE_/, '').toUpperCase() === 'COMMERCIAL';

const subjectName = (e: KycPendingEntry) => {
  const person = [e.name, e.lastName].filter(Boolean).join(' ').trim();
  return e.companyName?.trim() || person || e.email;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

/* ── Historial de screening ──────────────────────────────────────────── */

const HIT_TONE: Record<string, Tone> = { HIT: 'flag', FUZZY_HIT: 'hold' };

function ScreeningHistoryModal({
  entry,
  onClose,
}: {
  entry: KycPendingEntry;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<ScreeningHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getUserScreeningHistory(entry.id)
      .then(setHistory)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [entry.id]);

  return (
    <Modal
      size="lg"
      onClose={onClose}
      title="Historial de screening"
      subtitle={
        <span>
          {subjectName(entry)}
          {entry.documentNumber && ` · ${entry.documentType ?? ''} ${entry.documentNumber}`}
          {isCompany(entry) && entry.nit && ` · NIT ${entry.nit}`}
        </span>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="cmp-skeleton h-24 rounded-xl"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          message="No se pudo cargar el historial."
          onRetry={() => {
            setError(false);
            setLoading(true);
            getUserScreeningHistory(entry.id)
              .then(setHistory)
              .catch(() => setError(true))
              .finally(() => setLoading(false));
          }}
        />
      ) : history.length === 0 ? (
        <EmptyState
          tone="clear"
          icon={CheckCircle2}
          title="Sin coincidencias en listas restrictivas"
          hint="Este usuario no aparece en ninguna lista consultada."
        />
      ) : (
        <ul className="space-y-3">
          {history.map((h, i) => {
            const tone = HIT_TONE[h.status] ?? 'neutral';
            return (
              <li
                key={h.id}
                className="cmp-row-in relative overflow-hidden rounded-xl border border-cmp-rule bg-white p-4 pl-5"
                style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
              >
                <Spine tone={tone} />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusTag tone={tone}>{h.status.replace('_', ' ')}</StatusTag>
                      <span className="text-sm font-semibold text-cmp-ink">{h.listName}</span>
                    </div>
                    <p className="text-sm text-cmp-slate">
                      Nombre consultado:{' '}
                      <span className="font-medium text-cmp-ink">{h.queriedName}</span>
                    </p>
                    <Ref muted>{h.documentNumber}</Ref>
                    {h.notes && (
                      <p className="rounded-lg border border-cmp-rule-soft bg-cmp-rule-soft/40 px-3 py-2 text-xs text-cmp-slate">
                        {h.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="cmp-mono text-[11px] text-cmp-mute">{formatDate(h.createdAt)}</p>
                    {h.reviewed && h.reviewedAt && (
                      <p className="cmp-label mt-1.5 text-cmp-clear">
                        Revisado {formatDate(h.reviewedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

/* ── Rechazo ─────────────────────────────────────────────────────────── */

function RejectModal({
  entry,
  onClose,
  onConfirm,
  loading,
}: {
  entry: KycPendingEntry;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal onClose={onClose} title="Rechazar solicitud KYC" subtitle={subjectName(entry)}>
      <p className="mb-4 text-sm text-cmp-slate">
        El motivo queda registrado en la auditoría y se le muestra al usuario.
      </p>
      <TextField
        label="Motivo del rechazo"
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ej. El documento cargado no coincide con los datos registrados."
      />
      <div className="mt-5 flex gap-3">
        <Btn className="flex-1" onClick={onClose} disabled={loading}>
          Cancelar
        </Btn>
        <Btn
          className="flex-1"
          variant="danger"
          icon={XCircle}
          loading={loading}
          disabled={!reason.trim()}
          onClick={() => onConfirm(reason.trim())}
        >
          Rechazar
        </Btn>
      </div>
    </Modal>
  );
}

/* ── Tarjeta de expediente ───────────────────────────────────────────── */

function CaseCard({
  entry,
  index,
  busy,
  onScreening,
  onApprove,
  onReject,
}: {
  entry: KycPendingEntry;
  index: number;
  busy: 'approve' | 'reject' | null;
  onScreening: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const reduce = useReducedMotion();
  const locked = busy !== null;
  const company = isCompany(entry);

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      // El desenfoque al salir funde la tarjeta con el hueco que deja: sin
      // él se ven dos objetos distintos durante el reacomodo.
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -20, filter: 'blur(4px)' }}
      transition={{
        duration: 0.26,
        ease: EASE_OUT,
        delay: reduce ? 0 : Math.min(index, 8) * 0.03,
      }}
      className="relative overflow-hidden rounded-xl border border-cmp-rule bg-white shadow-[0_1px_2px_rgba(11,31,51,0.04)]"
    >
      <Spine tone={entry.isPep ? 'flag' : company ? 'info' : 'hold'} />
      <div className="flex flex-col gap-4 p-4 pl-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {company && <Building2 className="h-4 w-4 shrink-0 text-cmp-azul" />}
            <h3 className="text-[15px] font-semibold leading-tight text-cmp-ink">
              {subjectName(entry)}
            </h3>
            {company && <StatusTag tone="info">Empresa</StatusTag>}
            {entry.isPep && <StatusTag tone="flag">PEP</StatusTag>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-cmp-slate">
            {company
              ? entry.nit && <Ref>NIT {entry.nit}</Ref>
              : entry.documentNumber && (
                  <Ref>
                    {entry.documentType} {entry.documentNumber}
                  </Ref>
                )}
            <span className="truncate">{entry.email}</span>
            {company && entry.legalRepDocNumber && (
              <span className="cmp-mono text-[11px] text-cmp-mute">
                Rep. legal {entry.legalRepDocType} {entry.legalRepDocNumber}
              </span>
            )}
            <span className="cmp-mono text-[11px] text-cmp-mute">
              Registro {formatDate(entry.registeredDate)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Btn size="sm" icon={ListChecks} onClick={onScreening} disabled={locked}>
            Screening
          </Btn>
          <Btn size="sm" variant="reject" icon={XCircle} onClick={onReject} disabled={locked}>
            Rechazar
          </Btn>
          <Btn
            size="sm"
            variant="approve"
            icon={CheckCircle2}
            loading={busy === 'approve'}
            disabled={locked}
            onClick={onApprove}
          >
            Aprobar
          </Btn>
        </div>
      </div>
    </motion.li>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────── */

export default function KycReviewPanel() {
  const [entries, setEntries] = useState<KycPendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyKind, setBusyKind] = useState<'approve' | 'reject' | null>(null);
  const [rejectTarget, setRejectTarget] = useState<KycPendingEntry | null>(null);
  const [screeningTarget, setScreeningTarget] = useState<KycPendingEntry | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      setEntries(await getPendingKyc());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (entry: KycPendingEntry) => {
    setBusyId(entry.id);
    setBusyKind('approve');
    try {
      await approveKyc(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success(`KYC aprobado — ${subjectName(entry)}`);
    } catch {
      toast.error('No se pudo aprobar el KYC. Intenta de nuevo.');
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setBusyId(target.id);
    setBusyKind('reject');
    try {
      await rejectKyc(target.id, reason);
      setEntries((prev) => prev.filter((e) => e.id !== target.id));
      setRejectTarget(null);
      toast.success(`KYC rechazado — ${subjectName(target)}`);
    } catch {
      toast.error('No se pudo rechazar el KYC. Intenta de nuevo.');
    } finally {
      setBusyId(null);
      setBusyKind(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PanelHeader
          eyebrow="Expedientes · SARLAFT"
          title="Revisión KYC"
          description="Verifica identidad y listas restrictivas antes de habilitar la cuenta."
          count={loading ? 0 : entries.length}
          countLabel="En cola"
          actions={<RefreshButton onClick={load} loading={loading} />}
        />

        {loading ? (
          <SkeletonRows rows={4} cols={4} />
        ) : error ? (
          <ErrorState message="No se pudieron cargar los usuarios pendientes." onRetry={load} />
        ) : entries.length === 0 ? (
          <EmptyState
            tone="clear"
            icon={ShieldCheck}
            title="Cola vacía"
            hint="No hay usuarios pendientes de revisión."
          />
        ) : (
          <ul className="space-y-3">
            <AnimatePresence mode="popLayout">
              {entries.map((entry, i) => (
                <CaseCard
                  key={entry.id}
                  entry={entry}
                  index={i}
                  busy={busyId === entry.id ? busyKind : null}
                  onScreening={() => setScreeningTarget(entry)}
                  onApprove={() => handleApprove(entry)}
                  onReject={() => setRejectTarget(entry)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            key="reject"
            entry={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={handleReject}
            loading={busyId === rejectTarget.id && busyKind === 'reject'}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screeningTarget && (
          <ScreeningHistoryModal
            key="screening"
            entry={screeningTarget}
            onClose={() => setScreeningTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
