'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ShieldAlert, X, AlertTriangle, ListChecks } from 'lucide-react';
import {
  getPendingKyc,
  approveKyc,
  rejectKyc,
  getUserScreeningHistory,
  type KycPendingEntry,
  type ScreeningHistoryEntry,
} from '@/services/ComplianceService';

const STATUS_STYLE: Record<string, string> = {
  HIT: 'bg-red-100 text-red-700',
  FUZZY_HIT: 'bg-amber-100 text-amber-700',
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">Historial de screening</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {entry.name} {entry.lastName} — {entry.documentType} {entry.documentNumber}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-12 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <p className="text-sm">No se pudo cargar el historial.</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <p className="text-sm font-medium text-gray-500">Sin resultados en listas restrictivas</p>
              <p className="text-xs">El usuario no aparece en ninguna lista de screening.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => {
                const badge = STATUS_STYLE[h.status] ?? 'bg-gray-100 text-gray-600';
                return (
                  <div
                    key={h.id}
                    className={`rounded-xl border p-4 ${h.status === 'HIT' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                            {h.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">{h.listName}</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          Nombre consultado: <span className="font-medium">{h.queriedName}</span>
                        </p>
                        <p className="text-xs text-gray-500">Documento: {h.documentNumber}</p>
                        {h.notes && (
                          <p className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border mt-2">
                            Notas: {h.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">
                          {new Date(h.createdAt).toLocaleDateString('es-CO', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                        {h.reviewed && h.reviewedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Revisado {new Date(h.reviewedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PepBadge({ isPep }: { isPep: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isPep ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {isPep ? 'PEP' : 'No PEP'}
    </span>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Rechazar solicitud KYC</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa el motivo del rechazo para{' '}
          <span className="font-semibold">
            {entry.name} {entry.lastName}
          </span>
          .
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Motivo del rechazo..."
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KycReviewPanel() {
  const [entries, setEntries] = useState<KycPendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
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

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approveKyc(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      /* silent — backend error toast could be added here */
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      await rejectKyc(rejectTarget.id, reason);
      setEntries((prev) => prev.filter((e) => e.id !== rejectTarget.id));
      setRejectTarget(null);
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-red-500">
        <ShieldAlert className="w-8 h-8" />
        <p className="text-sm font-medium">Error al cargar usuarios pendientes.</p>
        <button onClick={load} className="text-xs text-blue-600 hover:underline">Reintentar</button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Revisión KYC</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {entries.length} usuario{entries.length !== 1 ? 's' : ''} pendiente{entries.length !== 1 ? 's' : ''} de revisión
            </p>
          </div>
          <button
            onClick={load}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Actualizar
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No hay usuarios pendientes de revisión</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PEP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {entry.name} {entry.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{entry.email}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {entry.documentType} {entry.documentNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <PepBadge isPep={entry.isPep} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(entry.registeredAt).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setScreeningTarget(entry)}
                            disabled={actionLoading !== null}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-semibold rounded-lg transition"
                          >
                            <ListChecks className="w-3 h-3" />
                            Screening
                          </button>
                          <button
                            onClick={() => handleApprove(entry.id)}
                            disabled={actionLoading !== null}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition"
                          >
                            {actionLoading === entry.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Aprobar
                          </button>
                          <button
                            onClick={() => setRejectTarget(entry)}
                            disabled={actionLoading !== null}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition"
                          >
                            <XCircle className="w-3 h-3" />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          entry={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actionLoading === rejectTarget.id}
        />
      )}

      {screeningTarget && (
        <ScreeningHistoryModal
          entry={screeningTarget}
          onClose={() => setScreeningTarget(null)}
        />
      )}
    </>
  );
}
