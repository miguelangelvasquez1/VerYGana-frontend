'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, RefreshCw, Mail, Phone, User, ClipboardCheck, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPqrsDetail, markUnderReview, respondToPqrs } from '@/services/admin/AdminPqrsService';
import { PqrsAdminDetailDTO, PqrsResolutionAction, PqrsStatus } from '@/types/Pqrs.types';
import { marketPlaceIssueReasonLabel, pqrsResolutionActionLabel, pqrsStatusColor, pqrsStatusLabel, pqrsTypeLabel } from '@/components/pqrs/pqrsMeta';

const REFUND_APPROVED_MESSAGE =
  'Hemos aprobado tu reembolso. Por favor completa el formulario de datos bancarios que aparece en esta misma solicitud para procesar el pago.';

const REVIEWABLE_STATUSES: PqrsStatus[] = [PqrsStatus.PENDIENTE_ASIGNACION, PqrsStatus.RECIBIDA];
const RESPONDABLE_STATUSES: PqrsStatus[] = [PqrsStatus.PENDIENTE_ASIGNACION, PqrsStatus.RECIBIDA, PqrsStatus.EN_REVISION];

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const InfoRow: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-500 shrink-0 w-32 flex items-center gap-1.5">{icon}{label}</span>
    <span className="text-gray-900 font-medium min-w-0 break-words">{value ?? '—'}</span>
  </div>
);

interface Props {
  pqrsId: number;
  onBack: () => void;
}

export const AdminPqrsDetail: React.FC<Props> = ({ pqrsId, onBack }) => {
  const [detail, setDetail] = useState<PqrsAdminDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [action, setAction] = useState<PqrsResolutionAction | ''>('');

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getPqrsDetail(pqrsId);
      setDetail(d);
      setResponseText(d.response ?? '');
      setAction(d.action ?? '');
    } catch {
      setError('No se pudo cargar el detalle de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetail(); }, [pqrsId]);

  const handleMarkUnderReview = async () => {
    if (!detail) return;
    setReviewing(true);
    try {
      await markUnderReview(detail.id);
      toast.success('Solicitud marcada en revisión');
      await loadDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al marcar en revisión');
    } finally {
      setReviewing(false);
    }
  };

  const isProductClaim = detail?.purchaseItemId != null;

  const handleSelectAction = (selected: PqrsResolutionAction) => {
    setAction(selected);
    if (selected === PqrsResolutionAction.REFUND && !responseText.trim()) {
      setResponseText(REFUND_APPROVED_MESSAGE);
    }
  };

  const handleRespond = async () => {
    if (!detail || !responseText.trim()) return;
    if (isProductClaim && !action) return;
    setResponding(true);
    try {
      await respondToPqrs(detail.id, {
        response: responseText.trim(),
        action: isProductClaim ? (action as PqrsResolutionAction) : null,
      });
      toast.success('Respuesta enviada correctamente');
      await loadDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar la respuesta');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-admin-blue" size={32} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
          <ChevronLeft size={18} /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button onClick={loadDetail} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm cursor-pointer hover:bg-red-700 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const canReview = REVIEWABLE_STATUSES.includes(detail.status);
  const canRespond = RESPONDABLE_STATUSES.includes(detail.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{detail.subject}</h2>
            <span className="text-gray-400 text-sm shrink-0">#{detail.id}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {pqrsTypeLabel[detail.type]} · Creada {formatDateTime(detail.createdAt)}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${pqrsStatusColor[detail.status]}`}>
          {pqrsStatusLabel[detail.status]}
        </span>
        <button onClick={loadDetail} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0" title="Actualizar">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Mark under review */}
      {canReview && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="font-semibold text-amber-900 text-sm">Esta solicitud aún no está en revisión</p>
            <p className="text-xs text-amber-700 mt-0.5">Márcala en revisión antes de responder al solicitante.</p>
          </div>
          <button
            onClick={handleMarkUnderReview}
            disabled={reviewing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            {reviewing ? <Loader2 size={14} className="animate-spin" /> : <ClipboardCheck size={14} />}
            Marcar en revisión
          </button>
        </div>
      )}

      {/* Waiting for refund payment */}
      {detail.status === PqrsStatus.PENDIENTE_PAGO_REEMBOLSO && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="font-semibold text-teal-900 text-sm">Reembolso aprobado, pendiente de pago</p>
          <p className="text-xs text-teal-700 mt-0.5">
            El comprador ya fue notificado y debe enviar sus datos bancarios. Cuando el pago se realice,
            márcalo como pagado desde la sección de reembolsos en efectivo para cerrar esta solicitud.
          </p>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
        {/* Requester */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Solicitante</h3>
          <div className="space-y-2">
            <InfoRow label="Nombre" value={detail.requesterName} icon={<User size={13} className="text-gray-400" />} />
            <InfoRow label="Correo" value={detail.requesterEmail} icon={<Mail size={13} className="text-gray-400" />} />
            <InfoRow label="Teléfono" value={detail.requesterPhone} icon={<Phone size={13} className="text-gray-400" />} />
          </div>
        </div>

        {isProductClaim && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Package size={14} className="text-purple-500" />
              Reclamo sobre un producto
            </h3>
            <div className="space-y-2">
              <InfoRow label="Ítem de compra" value={`#${detail.purchaseItemId}`} />
              <InfoRow
                label="Motivo"
                value={detail.reasonCode ? marketPlaceIssueReasonLabel[detail.reasonCode] : null}
              />
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Descripción</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{detail.description}</p>
        </div>

        <div className="border-t border-gray-100 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-500">
          <div>
            <p className="text-gray-400">Fecha límite</p>
            <p className="text-gray-700 font-medium">{formatDateTime(detail.dueDate)}</p>
          </div>
          {detail.resolvedAt && (
            <div>
              <p className="text-gray-400">Resuelta</p>
              <p className="text-gray-700 font-medium">{formatDateTime(detail.resolvedAt)}</p>
            </div>
          )}
        </div>

        {/* Response */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Respuesta</h3>
          {canRespond ? (
            <div className="space-y-3">
              {isProductClaim && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Decisión sobre el reclamo *</p>
                  <div className="flex gap-2">
                    {Object.values(PqrsResolutionAction).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAction(opt)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                          action === opt
                            ? opt === PqrsResolutionAction.REFUND
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'bg-gray-700 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pqrsResolutionActionLabel[opt]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Escribe la respuesta para el solicitante..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-blue resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleRespond}
                  disabled={responding || !responseText.trim() || (isProductClaim && !action)}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-admin-blue rounded-lg hover:bg-admin-blue-dark transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {responding && <Loader2 size={14} className="animate-spin" />}
                  Enviar respuesta
                </button>
              </div>
            </div>
          ) : detail.response ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed p-3.5 bg-admin-blue/10 border-l-4 border-admin-blue rounded-r-lg">
              {detail.response}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Sin respuesta.</p>
          )}
        </div>
      </div>
    </div>
  );
};
