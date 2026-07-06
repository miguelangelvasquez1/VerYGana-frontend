'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, ClipboardCheck, X } from 'lucide-react';
import {
  getScreeningHits,
  reviewScreening,
  type ScreeningHit,
  type ScreeningList,
  type PageResponse,
} from '@/services/ComplianceService';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  HIT: { label: 'HIT', cls: 'bg-red-100 text-red-700' },
  FUZZY_HIT: { label: 'FUZZY HIT', cls: 'bg-amber-100 text-amber-700' },
};

const LIST_LABELS: Record<ScreeningList, string> = {
  OFAC_SDN: 'OFAC SDN',
  UN: 'UN',
  ATTORNEY_GENERAL: 'Attorney General',
  COMPTROLLER: 'Comptroller',
  NATIONAL_POLICE: 'National Police',
};

function ReviewModal({
  hit,
  onClose,
  onConfirm,
  loading,
}: {
  hit: ScreeningHit;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Marcar como revisado</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-semibold">{hit.queriedName}</span> — {hit.listName}
        </p>
        <p className="text-xs text-gray-400 mb-4">Documento: {hit.documentNumber}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Notas de revisión (opcional)..."
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
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
            onClick={() => onConfirm(notes.trim())}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function ScreeningsPanel() {
  const [page, setPage] = useState<PageResponse<ScreeningHit> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ScreeningHit | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      setPage(await getScreeningHits(p, PAGE_SIZE));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(currentPage); }, [currentPage, load]);

  const handleReview = async (notes: string) => {
    if (!reviewTarget) return;
    setActionLoading(reviewTarget.id);
    try {
      await reviewScreening(reviewTarget.id, notes);
      setReviewTarget(null);
      await load(currentPage);
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  const hits = page?.content ?? [];
  const totalPages = page?.totalPages ?? 1;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Alertas de Screening</h2>
            {page && (
              <p className="text-sm text-gray-500 mt-0.5">
                {page.totalElements} resultado{page.totalElements !== 1 ? 's' : ''} sin revisar
              </p>
            )}
          </div>
          <button onClick={() => load(currentPage)} className="text-xs text-blue-600 hover:underline font-medium">
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-red-500">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">Error al cargar alertas.</p>
            <button onClick={() => load(currentPage)} className="text-xs text-blue-600 hover:underline">Reintentar</button>
          </div>
        ) : hits.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No hay alertas pendientes de revisión</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre consultado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lista</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hits.map((hit) => {
                      const badge = STATUS_LABELS[hit.status] ?? { label: hit.status, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <tr key={hit.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{hit.queriedName}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{hit.documentNumber}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{LIST_LABELS[hit.listName] ?? hit.listName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(hit.createdAt).toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setReviewTarget(hit)}
                              disabled={actionLoading !== null}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition ml-auto"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                              Revisar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Página {currentPage + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
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

      {reviewTarget && (
        <ReviewModal
          hit={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onConfirm={handleReview}
          loading={actionLoading === reviewTarget.id}
        />
      )}
    </>
  );
}
