'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PawPrint, Plus, Loader2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, X, Send, ImagePlus, Trash2, Sparkles,
} from 'lucide-react';
import {
  submitPetRequest,
  getMyPetRequests,
  type PetRequest,
  type PetRequestStatus,
  type SubmitPetRequestBody,
} from '@/services/PetRequestService';
import {
  usePetImageUpload,
  apiErrorMessage,
  ACCEPT_ATTR,
} from '@/hooks/pets/usePetImageUpload';
import { PetCommentsPanel } from '@/components/shared/PetCommentsPanel';
import { usePlanState } from '@/components/commercial/layout/DashboardLayout';
import { isWalletExhausted, WALLET_EXHAUSTED_TOOLTIP } from '@/components/commercial/plans/WalletBudgetAlerts';

// ── Paleta de marca ───────────────────────────────────────────────────────────

const INK   = '#0b1440';
const DEEP  = '#03548C';
const AZUL  = '#00a4ff';
const AZUL_D = '#0089d6';
const GOLD  = '#c9a227';

const RAIL = `linear-gradient(90deg, ${AZUL_D}, ${AZUL})`;

// ── Etapas ────────────────────────────────────────────────────────────────────
//
// El recorrido real es Enviada → En revisión → En diseño → En el juego.
// `REJECTED` no es una etapa más: es un final alterno que puede caer en
// cualquier punto, así que se pinta aparte en vez de ocupar un nodo del riel.
//
// APPROVED e ITEM_IN_PROGRESS comparten nodo a propósito: para el comercio
// ambos significan lo mismo — ya está aceptada y alguien la está construyendo.

const STAGES: { label: string; hint: string; covers: PetRequestStatus[] }[] = [
  {
    label: 'Enviada',
    hint: 'Está en la cola para revisión.',
    covers: ['PENDING'],
  },
  {
    label: 'En revisión',
    hint: 'La estamos evaluando.',
    covers: ['IN_REVIEW'],
  },
  {
    label: 'En diseño',
    hint: 'Aceptada: un diseñador la está convirtiendo en un ítem.',
    covers: ['APPROVED', 'ITEM_IN_PROGRESS'],
  },
  {
    label: 'En el juego',
    hint: 'Tus clientes ya pueden usarla con su mascota.',
    covers: ['COMPLETED'],
  },
];

function stageIndex(status: PetRequestStatus): number {
  return STAGES.findIndex((s) => s.covers.includes(status));
}

function StageTrack({ status }: { status: PetRequestStatus }) {
  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2">
        <span className="h-1.5 flex-1 rounded-full bg-red-500" />
        <span className="text-[11px] font-semibold text-red-600">Rechazada</span>
      </div>
    );
  }

  const current = stageIndex(status);

  return (
    <ol className="flex items-end gap-1.5">
      {STAGES.map((stage, i) => {
        const reached = i <= current;
        const active = i === current;
        return (
          <li key={stage.label} className="flex-1">
            <span
              aria-hidden
              className="block h-1.5 rounded-full transition-colors"
              style={{ background: reached ? RAIL : '#E5E7EB' }}
            />
            <span
              className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: active ? DEEP : reached ? '#9CA3AF' : '#C6CBD3' }}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ── Chip de estado ────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<PetRequestStatus, { label: string; bg: string; text: string }> = {
  PENDING:          { label: 'Pendiente',   bg: '#FFF8E1', text: '#92650A' },
  IN_REVIEW:        { label: 'En revisión', bg: '#E3F2FD', text: DEEP     },
  APPROVED:         { label: 'Aceptada',    bg: '#EDE9FE', text: '#4C1D95' },
  ITEM_IN_PROGRESS: { label: 'En diseño',   bg: '#EDE9FE', text: '#4C1D95' },
  COMPLETED:        { label: 'En el juego', bg: '#E8F5E9', text: '#1B5E20' },
  REJECTED:         { label: 'Rechazada',   bg: '#FFEBEE', text: '#B71C1C' },
};

// ── Tarjeta de solicitud ──────────────────────────────────────────────────────

function RequestCard({ req }: { req: PetRequest }) {
  const [expanded, setExpanded] = useState(false);
  const chip = STATUS_CHIP[req.status];

  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md">
      <div className="flex gap-5 p-5">
        {/* Miniatura — el producto tal cual lo verá el equipo de diseño */}
        {req.imageUrl ? (
          <img
            src={req.imageUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-xl border border-gray-100 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
            <PawPrint className="h-6 w-6 text-gray-300" />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold" style={{ color: INK }}>{req.productName}</h3>
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{req.description}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: chip.bg, color: chip.text }}
            >
              {chip.label}
            </span>
          </div>

          <StageTrack status={req.status} />

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex cursor-pointer items-center gap-1 self-start text-xs font-semibold hover:underline"
            style={{ color: DEEP }}
            aria-expanded={expanded}
          >
            {expanded
              ? <><ChevronUp className="h-3 w-3" /> Ocultar detalles</>
              : <><ChevronDown className="h-3 w-3" /> Ver detalles</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 px-5 pb-5 pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Efectos que pediste
            </p>
            <p className="mt-1 text-sm text-gray-700">{req.desiredEffects || '—'}</p>
          </div>
          <p className="text-xs text-gray-400">
            Enviada el{' '}
            {new Date(req.createdAt).toLocaleDateString('es-CO', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
          {req.resultCatalogItemId && (
            <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: GOLD }}>
              <Sparkles className="h-3.5 w-3.5" />
              Ya está en el juego como ítem #{req.resultCatalogItemId}
            </p>
          )}

          {/* Montado solo al desplegar: si no, cada tarjeta pediría su hilo al cargar. */}
          <PetCommentsPanel role="COMMERCIAL" requestId={req.id} accent="blue" className="h-80" />
        </div>
      )}

      {req.status === 'REJECTED' && req.rejectionReason && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
            Por qué se rechazó
          </p>
          <p className="mt-1 text-sm text-red-700">{req.rejectionReason}</p>
        </div>
      )}
    </article>
  );
}

// ── Campo de imagen ───────────────────────────────────────────────────────────

function ImageField({ upload }: { upload: ReturnType<typeof usePetImageUpload> }) {
  const { state, select, clear, retry, canRetry } = upload;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) select(file);
  };

  const uploading = state.status === 'preparing' || state.status === 'uploading';

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Imagen del producto <span className="text-gray-400">· opcional</span>
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors"
        style={{
          borderColor: state.status === 'error' ? '#FCA5A5' : dragging ? AZUL : '#E5E7EB',
          background: dragging ? '#F0F9FF' : '#FAFBFC',
        }}
      >
        {state.previewUrl ? (
          <>
            <img src={state.previewUrl} alt="" className="h-full w-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-[1px]">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <div className="w-3/4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-white transition-[width] duration-200"
                      style={{ width: `${state.status === 'preparing' ? 8 : state.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs font-medium text-white">
                    {state.status === 'preparing' ? 'Preparando…' : `Subiendo ${Math.round(state.progress)}%`}
                  </p>
                </div>
              </div>
            )}
            {state.status === 'ready' && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
                <span className="flex items-center gap-1.5 truncate text-xs font-medium text-white">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{state.fileName}</span>
                </span>
                <button
                  type="button"
                  onClick={clear}
                  className="shrink-0 cursor-pointer rounded-lg bg-white/20 p-1.5 text-white transition hover:bg-white/35"
                  aria-label="Quitar imagen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 px-5 text-center"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: '#EAF6FF', color: DEEP }}
            >
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold" style={{ color: INK }}>
              Sube una foto del producto
            </span>
            <span className="text-xs leading-relaxed text-gray-500">
              Arrástrala aquí o haz clic para buscarla.<br />
              PNG, JPEG o WEBP · hasta 5 MB
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
        />
      </div>

      {state.status === 'error' && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          {state.error}
        </p>
      )}

      {(state.status === 'ready' || state.status === 'error') && (
        <div className="flex items-center gap-3">
          {canRetry && (
            <button
              type="button"
              onClick={retry}
              className="cursor-pointer text-xs font-semibold hover:underline"
              style={{ color: DEEP }}
            >
              Reintentar subida
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer text-xs font-semibold hover:underline"
            style={{ color: DEEP }}
          >
            {state.status === 'ready' ? 'Cambiar imagen' : 'Elegir otra imagen'}
          </button>
          {state.status === 'error' && state.previewUrl && (
            <button
              type="button"
              onClick={clear}
              className="cursor-pointer text-xs font-semibold text-gray-500 hover:underline"
            >
              Seguir sin imagen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────

const EMPTY_FORM = { productName: '', description: '', desiredEffects: '' };

const FIELDS = [
  {
    key: 'productName' as const,
    label: 'Nombre del producto',
    required: true,
    rows: 0,
    placeholder: 'Croquetas Premium XYZ',
    help: '',
  },
  {
    key: 'description' as const,
    label: 'Qué es',
    required: true,
    rows: 3,
    placeholder: 'Alimento seco para perro adulto, sabor pollo, presentación de 2 kg.',
    help: '',
  },
  {
    key: 'desiredEffects' as const,
    label: 'Qué debería hacer en el juego',
    required: false,
    rows: 3,
    placeholder: 'Subir la felicidad de la mascota y darle energía extra por 24 horas.',
    help: 'Entre más concreto, menos vueltas da la revisión.',
  },
];

function NewRequestDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const upload = usePetImageUpload();

  // Escape cierra, y el fondo no scrollea detrás del diálogo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const set = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.description.trim()) {
      setError('Escribe el nombre del producto y qué es.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body: SubmitPetRequestBody = {
        productName:    form.productName.trim(),
        description:    form.description.trim(),
        desiredEffects: form.desiredEffects.trim(),
        imageObjectKey: upload.state.objectKey,
      };
      await submitPetRequest(body);
      upload.clear();
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'No se pudo enviar la solicitud. Reintenta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: INK }}>
              Manda un producto al juego
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              El equipo de diseño lo convierte en un ítem que tus clientes usan con su mascota.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 transition hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-6 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <ImageField upload={upload} />

          <div className="flex flex-col gap-4">
            {FIELDS.map(({ key, label, required, rows, placeholder, help }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`pet-${key}`}
                  className="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                >
                  {label}{' '}
                  {!required && <span className="text-gray-400">· opcional</span>}
                </label>
                {rows > 0 ? (
                  <textarea
                    id={`pet-${key}`}
                    value={form[key]}
                    onChange={set(key)}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-transparent focus:ring-2"
                    style={{ '--tw-ring-color': AZUL } as React.CSSProperties}
                  />
                ) : (
                  <input
                    id={`pet-${key}`}
                    value={form[key]}
                    onChange={set(key)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-transparent focus:ring-2"
                    style={{ '--tw-ring-color': AZUL } as React.CSSProperties}
                  />
                )}
                {help && <p className="text-xs text-gray-400">{help}</p>}
              </div>
            ))}
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4">
          {error && (
            <p className="flex items-start gap-1.5 text-sm font-medium text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || upload.busy}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_D})` }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {upload.busy ? 'Subiendo imagen…' : 'Enviar solicitud'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function PetsPage() {
  const { planState } = usePlanState();
  const walletExhausted = isWalletExhausted(planState);
  const [requests, setRequests] = useState<PetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const counts = {
    total:    requests.length,
    proceso: requests.filter((r) =>
      (['PENDING', 'IN_REVIEW', 'APPROVED', 'ITEM_IN_PROGRESS'] as PetRequestStatus[]).includes(r.status),
    ).length,
    juego: requests.filter((r) => r.status === 'COMPLETED').length,
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">

        {/* Encabezado */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: AZUL }}>
              Juego de mascotas
            </p>
            <h1 className="mt-1.5 text-2xl font-bold lg:text-3xl" style={{ color: INK }}>
              Tus productos en el juego
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-gray-500">
              Manda un producto real y el equipo de diseño lo convierte en un ítem que tus
              clientes pueden usar con su mascota virtual.
            </p>
          </div>
          {walletExhausted ? (
            <button
              type="button"
              disabled
              title={WALLET_EXHAUSTED_TOOLTIP}
              className="flex items-center gap-2 rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-bold text-gray-400 cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> Nueva solicitud
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_D})` }}
            >
              <Plus className="h-4 w-4" /> Nueva solicitud
            </button>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">

          {/* Lista */}
          <section className="min-w-0">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-16 text-red-600">
                <AlertTriangle className="h-8 w-8" />
                <p className="text-sm font-semibold">No se pudieron cargar tus solicitudes.</p>
                <button
                  type="button"
                  onClick={load}
                  className="cursor-pointer text-xs font-semibold hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 px-6 py-20 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${INK}, ${DEEP})` }}
                >
                  <PawPrint className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: INK }}>Todavía no has mandado ningún producto</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                    Empieza por el que más vendes. Con una foto y una descripción corta basta.
                  </p>
                </div>
                {walletExhausted ? (
                  <button
                    type="button"
                    disabled
                    title={WALLET_EXHAUSTED_TOOLTIP}
                    className="rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-bold text-gray-400 cursor-not-allowed"
                  >
                    Crear la primera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDialogOpen(true)}
                    className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${AZUL}, ${AZUL_D})` }}
                  >
                    Crear la primera
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((r) => <RequestCard key={r.id} req={r} />)}
              </div>
            )}
          </section>

          {/* Panel lateral */}
          <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-6">
            {requests.length > 0 && (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
                <dl className="flex items-center justify-between gap-2 text-center">
                  {[
                    { label: 'Enviadas',   value: counts.total,   color: INK  },
                    { label: 'En proceso', value: counts.proceso, color: '#92650A' },
                    { label: 'En el juego', value: counts.juego,  color: '#1B5E20' },
                  ].map((s) => (
                    <div key={s.label} className="flex-1">
                      <dd className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</dd>
                      <dt className="mt-0.5 text-[11px] font-semibold text-gray-500">{s.label}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
              <h2 className="text-sm font-bold" style={{ color: INK }}>Cómo avanza una solicitud</h2>
              <ol className="mt-4 flex flex-col gap-4">
                {STAGES.map((stage, i) => (
                  <li key={stage.label} className="flex gap-3">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: RAIL }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: INK }}>{stage.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{stage.hint}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
                Si algo no encaja, la solicitud se rechaza con el motivo escrito para que puedas
                corregirlo y volver a mandarla.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {dialogOpen && (
        <NewRequestDialog onClose={() => setDialogOpen(false)} onCreated={load} />
      )}
    </div>
  );
}
