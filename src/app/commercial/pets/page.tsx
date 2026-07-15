'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PawPrint, Plus, Loader2, AlertTriangle, CheckCircle2,
  XCircle, Clock, ChevronDown, ChevronUp, X, Send,
} from 'lucide-react';
import {
  submitPetRequest,
  getMyPetRequests,
  type PetRequest,
  type PetRequestStatus,
  type SubmitPetRequestBody,
} from '@/services/PetRequestService';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PetRequestStatus, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  PENDING:   { label: 'Pendiente',   bg: '#FFF8E1', text: '#92650A', Icon: Clock        },
  IN_REVIEW: { label: 'En revisión', bg: '#E3F2FD', text: '#03548C', Icon: Clock        },
  APPROVED:  { label: 'Aprobada',    bg: '#E8F5E9', text: '#1B5E20', Icon: CheckCircle2 },
  REJECTED:  { label: 'Rechazada',   bg: '#FFEBEE', text: '#B71C1C', Icon: XCircle      },
};

const STATUS_ORDER: PetRequestStatus[] = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'];

// ── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({ req }: { req: PetRequest }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[req.status];
  const Icon = cfg.Icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        {req.imageUrl && (
          <img
            src={req.imageUrl}
            alt={req.productName}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 truncate">{req.productName}</p>
            <span
              className="shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: cfg.bg, color: cfg.text }}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            {STATUS_ORDER.map((s, i) => {
              const idx = STATUS_ORDER.indexOf(req.status);
              const isRejected = req.status === 'REJECTED';
              const done = isRejected ? false : i <= idx;
              const active = s === req.status;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className="h-1.5 flex-1 rounded-full transition-all"
                    style={{
                      background: isRejected && active
                        ? '#EF4444'
                        : done
                        ? 'linear-gradient(90deg, #00a4ff, #0089d6)'
                        : '#E5E7EB',
                    }}
                  />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
            style={{ color: '#03548C' }}
          >
            {expanded
              ? <><ChevronUp className="w-3 h-3" /> Ocultar detalles</>
              : <><ChevronDown className="w-3 h-3" /> Ver detalles</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Efectos deseados</p>
            <p className="text-sm text-gray-700 mt-0.5">{req.desiredEffects}</p>
          </div>
          <p className="text-xs text-gray-400">
            Enviada el {new Date(req.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {req.resultCatalogItemId && (
            <p className="text-xs font-semibold" style={{ color: '#c9a227' }}>
              ✓ Tu producto ya está en el juego — ítem #{req.resultCatalogItemId}
            </p>
          )}
        </div>
      )}

      {req.status === 'REJECTED' && req.rejectionReason && (
        <div className="border-t border-red-100 px-4 py-3" style={{ background: '#FFEBEE' }}>
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-0.5">Motivo de rechazo</p>
          <p className="text-sm text-red-700">{req.rejectionReason}</p>
        </div>
      )}
    </div>
  );
}

// ── New Request Form ──────────────────────────────────────────────────────────

const EMPTY_FORM: SubmitPetRequestBody = {
  productName:    '',
  description:    '',
  imageObjectKey: '',
  desiredEffects: '',
};

function NewRequestForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState<SubmitPetRequestBody>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k: keyof SubmitPetRequestBody) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.description.trim()) {
      setError('Nombre y descripción son obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitPetRequest(form);
      setForm(EMPTY_FORM);
      setOpen(false);
      onCreated();
    } catch {
      setError('No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #00a4ff, #0089d6)' }}
      >
        <Plus className="w-4 h-4" /> Nueva solicitud
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <form
        onSubmit={submit}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg" style={{ color: '#0b1440' }}>
            Integra tu producto al juego
          </h3>
          <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Describe tu producto y qué efecto quieres que tenga en la mascota virtual de tus clientes.
          El equipo de diseño lo revisará y lo integrará al catálogo.
        </p>

        {[
          { label: 'Nombre del producto *',    key: 'productName'    as const, multiline: false, placeholder: 'Ej. Croquetas Premium XYZ' },
          { label: 'Descripción *',            key: 'description'    as const, multiline: true,  placeholder: 'Describe brevemente el producto...' },
          { label: 'Image Object Key',         key: 'imageObjectKey' as const, multiline: false, placeholder: 'products/mi-producto.png' },
          { label: 'Efectos deseados en el juego', key: 'desiredEffects' as const, multiline: true, placeholder: 'Ej. Aumentar felicidad, dar energía extra por 24h...' },
        ].map(({ label, key, multiline, placeholder }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
            {multiline ? (
              <textarea
                value={form[key]}
                onChange={set(key)}
                rows={3}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ '--tw-ring-color': '#00a4ff' } as React.CSSProperties}
              />
            ) : (
              <input
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#00a4ff' } as React.CSSProperties}
              />
            )}
          </div>
        ))}

        <p className="text-xs text-gray-400">
          * La subida de imagen estará disponible próximamente. Por ahora puedes indicar la clave del objeto.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00a4ff, #0089d6)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar solicitud
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PetsPage() {
  const [requests, setRequests] = useState<PetRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setRequests(await getMyPetRequests());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approved  = requests.filter(r => r.status === 'APPROVED').length;
  const pending   = requests.filter(r => r.status === 'PENDING' || r.status === 'IN_REVIEW').length;

  return (
    <div className="flex flex-col gap-6 max-w-2xl p-4 lg:p-6">

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Haz que tu producto aparezca en la mascota virtual de tus clientes
          </p>
          <NewRequestForm onCreated={load} />
        </div>

        {/* Stats */}
        {requests.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',       value: requests.length, bg: '#F0F7FF', text: '#03548C'  },
              { label: 'En proceso',  value: pending,         bg: '#FFF8E1', text: '#92650A'  },
              { label: 'Aprobadas',   value: approved,        bg: '#E8F5E9', text: '#1B5E20'  },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                <p className="text-2xl font-bold" style={{ color: s.text }}>{s.value}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: s.text }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00a4ff' }} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-red-500">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">Error al cargar solicitudes.</p>
            <button type="button" onClick={load} className="text-xs hover:underline" style={{ color: '#00a4ff' }}>
              Reintentar
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0b1440, #03548C)' }}>
              <PawPrint className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Aún no tienes solicitudes</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Envía tu primera solicitud y el equipo de diseño integrará tu producto al juego de mascotas.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map(r => <RequestCard key={r.id} req={r} />)}
          </div>
        )}
    </div>
  );
}
