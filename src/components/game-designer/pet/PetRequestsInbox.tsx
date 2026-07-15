'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  Clock, Eye, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import {
  getGameDesignerPetRequests,
  markPetRequestInReview,
  approvePetRequest,
  rejectPetRequest,
  type PetRequest,
  type PetCatalogItemBody,
  type PetRequestStatus,
} from '@/services/PetRequestService';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PetRequestStatus, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pendiente',   bg: 'bg-yellow-100', text: 'text-yellow-800' },
  IN_REVIEW: { label: 'En revisión', bg: 'bg-blue-100',   text: 'text-blue-800'   },
  APPROVED:  { label: 'Aprobada',    bg: 'bg-green-100',  text: 'text-green-800'  },
  REJECTED:  { label: 'Rechazada',   bg: 'bg-red-100',    text: 'text-red-700'    },
};

const STATUS_TABS: PetRequestStatus[] = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'];

// ── Approve Modal ─────────────────────────────────────────────────────────────

function ApproveModal({
  request,
  onClose,
  onDone,
}: {
  request: PetRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState<PetCatalogItemBody>({
    name:           request.productName,
    description:    request.description,
    imageObjectKey: request.imageObjectKey,
    effects:        request.desiredEffects,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k: keyof PetCatalogItemBody) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await approvePetRequest(request.id, form);
      onDone();
    } catch {
      setError('No se pudo aprobar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg" style={{ color: '#0b1440' }}>Aprobar solicitud</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <p className="text-sm text-gray-500">
          Revisa y ajusta los datos del ítem que se creará en el catálogo.
        </p>

        {[
          { label: 'Nombre en catálogo', key: 'name'           as const, multiline: false },
          { label: 'Descripción',        key: 'description'    as const, multiline: true  },
          { label: 'Image Object Key',   key: 'imageObjectKey' as const, multiline: false },
          { label: 'Efectos',            key: 'effects'        as const, multiline: true  },
        ].map(({ label, key, multiline }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
            {multiline ? (
              <textarea
                value={form[key]}
                onChange={set(key)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ '--tw-ring-color': '#00a4ff' } as React.CSSProperties}
              />
            ) : (
              <input
                value={form[key]}
                onChange={set(key)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#00a4ff' } as React.CSSProperties}
              />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition"
            style={{ background: 'linear-gradient(135deg, #00a4ff, #0089d6)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Aprobar y crear ítem
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({
  request,
  onClose,
  onDone,
}: {
  request: PetRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const MAX = 500;

  const submit = async () => {
    if (!reason.trim()) { setError('El motivo es obligatorio.'); return; }
    setLoading(true);
    setError('');
    try {
      await rejectPetRequest(request.id, reason.trim());
      onDone();
    } catch {
      setError('No se pudo rechazar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-red-700">Rechazar solicitud</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-500">
          Escribe el motivo de rechazo. El comercial lo verá en su panel.
        </p>
        <div className="flex flex-col gap-1">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value.slice(0, MAX))}
            rows={4}
            placeholder="Motivo del rechazo..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <span className={`text-xs self-end ${reason.length >= MAX ? 'text-red-500' : 'text-gray-400'}`}>
            {reason.length}/{MAX}
          </span>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({
  req,
  onReview,
  onApprove,
  onReject,
  actionLoading,
}: {
  req: PetRequest;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[req.status];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        {req.imageUrl && (
          <img
            src={req.imageUrl}
            alt={req.productName}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 truncate">{req.productName}</p>
              {req.commercialName && (
                <p className="text-xs text-gray-400 mt-0.5">{req.commercialName}</p>
              )}
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
            style={{ color: '#03548C' }}
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Ocultar detalles</> : <><ChevronDown className="w-3 h-3" /> Ver detalles</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Efectos deseados</p>
            <p className="text-sm text-gray-700 mt-0.5">{req.desiredEffects}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Image Key</p>
            <p className="font-mono text-xs text-gray-500 mt-0.5 break-all">{req.imageObjectKey}</p>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(req.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}

      {req.status === 'PENDING' && (
        <div className="border-t border-gray-50 px-4 py-3 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={onReview}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition disabled:opacity-50"
            style={{ borderColor: '#03548C', color: '#03548C' }}
          >
            <Eye className="w-3 h-3" /> Marcar en revisión
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" /> Rechazar
          </button>
        </div>
      )}

      {req.status === 'IN_REVIEW' && (
        <div className="border-t border-gray-50 px-4 py-3 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={onApprove}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00a4ff, #0089d6)' }}
          >
            <CheckCircle2 className="w-3 h-3" /> Aprobar
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            <XCircle className="w-3 h-3" /> Rechazar
          </button>
        </div>
      )}

      {req.status === 'REJECTED' && req.rejectionReason && (
        <div className="border-t border-red-50 px-4 py-3 bg-red-50">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">Motivo de rechazo</p>
          <p className="text-sm text-red-700">{req.rejectionReason}</p>
        </div>
      )}

      {req.status === 'APPROVED' && req.resultCatalogItemId && (
        <div className="border-t border-green-50 px-4 py-3 bg-green-50">
          <p className="text-xs text-green-700">
            Ítem creado en catálogo — ID <span className="font-mono font-bold">#{req.resultCatalogItemId}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PetRequestsInbox() {
  const [activeStatus, setActiveStatus] = useState<PetRequestStatus>('PENDING');
  const [requests, setRequests]         = useState<PetRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<PetRequest | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<PetRequest | null>(null);

  const load = useCallback(async (status: PetRequestStatus) => {
    setLoading(true);
    setError(false);
    try {
      setRequests(await getGameDesignerPetRequests(status));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(activeStatus); }, [activeStatus, load]);

  const handleReview = async (req: PetRequest) => {
    setActionLoading(req.id);
    try {
      await markPetRequestInReview(req.id);
      await load(activeStatus);
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  };

  const handleDone = async () => {
    setApproveTarget(null);
    setRejectTarget(null);
    await load(activeStatus);
  };

  return (
    <>
      <div className="flex flex-col gap-5 h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#0b1440' }}>Bandeja de solicitudes</h2>
            <p className="text-sm text-gray-500 mt-0.5">Solicitudes de integración de productos al juego</p>
          </div>
          <button
            type="button"
            onClick={() => load(activeStatus)}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {STATUS_TABS.map(s => {
            const cfg = STATUS_CFG[s];
            const active = s === activeStatus;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setActiveStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  active ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
                style={active ? { color: '#0b1440' } : {}}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00a4ff' }} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-red-500">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">Error al cargar solicitudes.</p>
            <button type="button" onClick={() => load(activeStatus)} className="text-xs hover:underline" style={{ color: '#00a4ff' }}>
              Reintentar
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
            <Clock className="w-10 h-10" />
            <p className="text-sm font-medium">No hay solicitudes {STATUS_CFG[activeStatus].label.toLowerCase()}s</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto pb-4">
            {requests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                actionLoading={actionLoading === req.id}
                onReview={() => handleReview(req)}
                onApprove={() => setApproveTarget(req)}
                onReject={() => setRejectTarget(req)}
              />
            ))}
          </div>
        )}
      </div>

      {approveTarget && (
        <ApproveModal request={approveTarget} onClose={() => setApproveTarget(null)} onDone={handleDone} />
      )}
      {rejectTarget && (
        <RejectModal request={rejectTarget} onClose={() => setRejectTarget(null)} onDone={handleDone} />
      )}
    </>
  );
}
