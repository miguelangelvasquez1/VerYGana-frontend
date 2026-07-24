'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Clock,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  X,
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_BADGE: Record<ContractReviewListStatus, { label: string; className: string }> = {
  PENDING_VERYGANA_REVIEW: { label: 'Pendiente', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Aprobado', className: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rechazado', className: 'bg-red-100 text-red-700' },
};

type FilterOption = ContractReviewListStatus | 'ALL';

const FILTER_TABS: { value: FilterOption; label: string }[] = [
  { value: 'PENDING_VERYGANA_REVIEW', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'REJECTED', label: 'Rechazados' },
  { value: 'ALL', label: 'Todos' },
];

function ContractDetailModal({
  summary,
  onClose,
  onDecided,
}: {
  summary: PendingContractSummary;
  onClose: () => void;
  onDecided: () => void;
}) {
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
      onDecided();
    } catch {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim() || documentsIssue === null) return;
    setActionLoading(true);
    try {
      await rejectContractReview(summary.contractId, reason.trim(), documentsIssue);
      onDecided();
    } catch {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Contrato de {summary.companyName}</h3>
          <button onClick={onClose} className="cursor-pointer p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center gap-3 py-10 text-red-500">
            <AlertTriangle className="w-6 h-6" />
            <p className="text-sm font-medium">Error al cargar el contrato.</p>
            <button onClick={load} className="cursor-pointer text-xs text-blue-600 hover:underline">Reintentar</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Plantilla base pendiente de validación jurídica final por el equipo legal.
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-semibold text-gray-800">Correo:</span> {summary.email}</p>
              <p><span className="font-semibold text-gray-800">Ruta:</span> {summary.route}</p>
              <p><span className="font-semibold text-gray-800">Versión:</span> {detail.version}</p>
              <p>
                <span className="font-semibold text-gray-800">Aprobado por el negocio:</span>{' '}
                {formatDate(detail.businessApprovedAt)}
              </p>
            </div>

            <a
              href={detail.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              Ver contrato
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Documentos ({detail.documents.length})
              </p>
              {detail.documents.length === 0 ? (
                <p className="text-sm text-gray-400">No hay documentos cargados.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {DOCUMENT_TYPE_LABELS[doc.documentType]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {doc.originalFileName} · {formatBytes(doc.sizeBytes)}
                        </p>
                      </div>
                      {doc.downloadUrl ? (
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Ver <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {detail.status !== 'PENDING_VERYGANA_REVIEW' ? (
              <div
                className={`p-3 rounded-xl border text-sm ${
                  detail.status === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
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
            ) : showRejectForm ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Motivo del rechazo (obligatorio)..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    ¿El rechazo es por documentos?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDocumentsIssue(true)}
                      className={`cursor-pointer py-2 rounded-xl border-2 text-sm font-semibold transition ${
                        documentsIssue === true
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Sí, es documental
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocumentsIssue(false)}
                      className={`cursor-pointer py-2 rounded-xl border-2 text-sm font-semibold transition ${
                        documentsIssue === false
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      No, otro motivo
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {documentsIssue === true
                      ? 'El empresario podrá corregir los documentos por su cuenta.'
                      : documentsIssue === false
                      ? 'Sin autoservicio — el empresario verá que debemos contactarlo.'
                      : 'Elige una opción para poder confirmar el rechazo.'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    disabled={actionLoading}
                    className="cursor-pointer flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !reason.trim() || documentsIssue === null}
                    className="cursor-pointer flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Confirmar rechazo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="cursor-pointer flex-1 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                >
                  Rechazar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="cursor-pointer flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Aprobar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
      ? 'No hay contratos pendientes de revisión'
      : filter === 'APPROVED'
      ? 'No hay contratos aprobados todavía.'
      : 'No hay contratos rechazados todavía.';

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Contratos comerciales</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {contracts.length} contrato{contracts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={load} className="cursor-pointer text-xs text-blue-600 hover:underline font-medium">
            Actualizar
          </button>
        </div>

        <div className="flex gap-1.5 border-b border-gray-200">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`cursor-pointer px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
                filter === tab.value
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-red-500">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">Error al cargar contratos.</p>
            <button onClick={load} className="cursor-pointer text-xs text-blue-600 hover:underline">Reintentar</button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">{emptyLabel}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ruta</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Versión</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Generado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Decidido</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contracts.map((c) => (
                    <tr key={c.contractId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.companyName}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          Ruta {c.route}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">v{c.version}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[c.status].className}`}>
                          {STATUS_BADGE[c.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.generatedAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.veryganaReviewedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelected(c)}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition ml-auto"
                        >
                          {c.status === 'PENDING_VERYGANA_REVIEW' ? (
                            <>
                              <ClipboardCheck className="w-3 h-3" />
                              Revisar
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              Ver detalle
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <ContractDetailModal
          summary={selected}
          onClose={() => setSelected(null)}
          onDecided={handleDecided}
        />
      )}
    </>
  );
}
