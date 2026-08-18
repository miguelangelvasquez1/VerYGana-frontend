'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, XCircle, Eye, Loader2, PawPrint,
  UserCheck, AlertTriangle, Sparkles,
} from 'lucide-react';
import {
  adminGetPetRequestDetail,
  adminGetPetDesigners,
  adminMarkPetRequestInReview,
  adminApprovePetRequest,
  adminAssignPetDesigner,
  adminRejectPetRequest,
  type PetRequestDetail,
  type PetDesigner,
} from '@/services/PetRequestService';
import { apiErrorMessage } from '@/hooks/pets/usePetImageUpload';
import { PetCommentsPanel } from '@/components/shared/PetCommentsPanel';
import { PET_STATUS_CONFIG, formatPetDate, designerLabel } from './petRequestStatus';

type Action = 'review' | 'approve' | 'assign' | 'reject';

export function AdminPetRequestDetail({
  requestId,
  onBack,
}: {
  requestId: number;
  onBack: () => void;
}) {
  const [req, setReq] = useState<PetRequestDetail | null>(null);
  const [designers, setDesigners] = useState<PetDesigner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [running, setRunning] = useState<Action | null>(null);
  const [actionError, setActionError] = useState('');

  const [designerId, setDesignerId] = useState<number | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const detail = await adminGetPetRequestDetail(requestId);
      setReq(detail);
      setDesignerId(detail.assignedDesignerUserId ?? '');
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  // Los diseñadores se cargan aparte: si ese endpoint falla, el detalle sigue
  // siendo legible y solo se pierde la posibilidad de asignar.
  useEffect(() => {
    adminGetPetDesigners().then(setDesigners).catch(() => setDesigners([]));
  }, []);

  const run = async (action: Action, fn: () => Promise<void>) => {
    setRunning(action);
    setActionError('');
    try {
      await fn();
      await load();
      setRejecting(false);
      setReason('');
    } catch (err: unknown) {
      setActionError(apiErrorMessage(err, 'No se pudo completar la acción.'));
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !req) {
    return (
      <div className="space-y-4">
        <BackButton onBack={onBack} />
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">No se pudo cargar la solicitud</p>
          <button onClick={load} className="mt-3 text-sm text-red-600 underline cursor-pointer">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const status = PET_STATUS_CONFIG[req.status];
  const abierta = req.status === 'PENDING' || req.status === 'IN_REVIEW';
  const enDiseno = req.status === 'APPROVED' || req.status === 'ITEM_IN_PROGRESS';
  const sinDisenador = enDiseno && !req.assignedDesignerUserId;
  const busy = running !== null;

  return (
    <div className="space-y-6">
      <BackButton onBack={onBack} />

      {/* Cabecera */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-wrap items-start gap-5">
          {req.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={req.imageUrl}
              alt=""
              className="h-28 w-28 shrink-0 rounded-xl border border-gray-100 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-200">
              <PawPrint size={26} className="text-gray-300" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">{req.productName}</h1>
              <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>
                {status.label}
              </span>
              <span className="text-sm text-gray-400">#{req.id}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{req.description}</p>
            <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="Comercio" value={req.commercialName} />
              <Row label="Enviada" value={formatPetDate(req.createdAt)} />
              <Row label="Diseñador" value={req.assignedDesignerName} fallback="Sin asignar" />
              <Row
                label="Ítem en catálogo"
                value={req.resultCatalogItemId ? `#${req.resultCatalogItemId}` : undefined}
              />
            </dl>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Efectos que pidió el comercio
          </p>
          <p className="mt-1 text-sm text-gray-700">{req.desiredEffects || '—'}</p>
        </div>

        {req.adminNotes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Notas para el diseñador
            </p>
            <p className="mt-1 text-sm text-gray-700">{req.adminNotes}</p>
          </div>
        )}

        {req.status === 'REJECTED' && req.rejectionReason && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Motivo del rechazo
            </p>
            <p className="mt-1 text-sm text-red-700">{req.rejectionReason}</p>
          </div>
        )}

        {req.status === 'COMPLETED' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
            <Sparkles size={16} className="shrink-0" />
            El ítem ya está publicado en el catálogo. No queda nada por hacer acá.
          </div>
        )}
      </div>

      {sinDisenador && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            Esta solicitud está aprobada pero sin diseñador, así que no aparece en ninguna
            bandeja. Asígnale uno para que alguien pueda trabajarla.
          </p>
        </div>
      )}

      {/* Acciones */}
      {(abierta || enDiseno) && (
        <div className="bg-white rounded-xl shadow p-6 space-y-5">
          <h2 className="font-semibold text-gray-800">Acciones</h2>

          {req.status === 'PENDING' && (
            <button
              onClick={() => run('review', () => adminMarkPetRequestInReview(req.id))}
              disabled={busy}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
            >
              {running === 'review' ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
              Marcar en revisión
            </button>
          )}

          {/* Selector de diseñador: obligatorio para aprobar, reutilizado para reasignar */}
          <div className="space-y-3">
            <label htmlFor="pet-designer" className="block text-sm font-medium text-gray-700">
              Diseñador {abierta && <span className="text-red-500">*</span>}
            </label>
            <select
              id="pet-designer"
              value={designerId}
              onChange={e => setDesignerId(e.target.value ? Number(e.target.value) : '')}
              disabled={busy || designers.length === 0}
              className="w-full max-w-md cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
            >
              <option value="">
                {designers.length === 0 ? 'No hay diseñadores activos' : 'Elige un diseñador…'}
              </option>
              {designers.map(d => (
                <option key={d.userId} value={d.userId}>{designerLabel(d)}</option>
              ))}
            </select>

            {abierta && (
              <>
                <label htmlFor="pet-notes" className="block text-sm font-medium text-gray-700">
                  Notas para el diseñador <span className="text-gray-400">· opcional</span>
                </label>
                <textarea
                  id="pet-notes"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Contexto, restricciones de marca, referencias…"
                  className="w-full max-w-md resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {abierta && (
              <button
                onClick={() =>
                  run('approve', () => adminApprovePetRequest(req.id, designerId as number, adminNotes))
                }
                disabled={busy || designerId === ''}
                title={designerId === '' ? 'Elige un diseñador para poder aprobar' : undefined}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {running === 'approve' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Aprobar y asignar
              </button>
            )}

            {enDiseno && (
              <button
                onClick={() => run('assign', () => adminAssignPetDesigner(req.id, designerId as number))}
                disabled={busy || designerId === '' || designerId === req.assignedDesignerUserId}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {running === 'assign' ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                {req.assignedDesignerUserId ? 'Reasignar diseñador' : 'Asignar diseñador'}
              </button>
            )}

            {abierta && !rejecting && (
              <button
                onClick={() => setRejecting(true)}
                disabled={busy}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle size={15} />
                Rechazar
              </button>
            )}
          </div>

          {rejecting && (
            <div className="space-y-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <label htmlFor="pet-reason" className="block text-sm font-medium text-red-800">
                Motivo del rechazo <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-red-700">El comercio lo verá tal cual en su panel.</p>
              <textarea
                id="pet-reason"
                value={reason}
                onChange={e => setReason(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Explica qué tendría que cambiar para que lo aceptemos."
                className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejecting(false); setReason(''); }}
                  disabled={busy}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => run('reject', () => adminRejectPetRequest(req.id, reason.trim()))}
                  disabled={busy || !reason.trim()}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {running === 'reject' ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Confirmar rechazo
                </button>
              </div>
            </div>
          )}

          {actionError && (
            <p className="flex items-start gap-1.5 text-sm font-medium text-red-600">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {actionError}
            </p>
          )}
        </div>
      )}

      <PetCommentsPanel role="ADMIN" requestId={req.id} accent="blue" className="h-[28rem]" />
    </div>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────────

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
    >
      <ArrowLeft size={16} />
      Volver a la lista
    </button>
  );
}

function Row({ label, value, fallback = '—' }: { label: string; value?: string | null; fallback?: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-gray-400">{label}:</dt>
      <dd className="min-w-0 truncate text-gray-800">{value || <span className="text-gray-300">{fallback}</span>}</dd>
    </div>
  );
}
