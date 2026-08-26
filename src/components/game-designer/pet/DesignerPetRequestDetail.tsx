'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Loader2, Save, Rocket, AlertTriangle, PawPrint,
  Code2, ListChecks, CheckCircle2, Image as ImageIcon,
} from 'lucide-react';
import {
  getGameDesignerPetRequestDetail,
  savePetRequestDraft,
  publishPetRequest,
  type PetRequestDetail,
  type PetItemDraft,
} from '@/services/PetRequestService';
import { apiErrorMessage } from '@/hooks/pets/usePetImageUpload';
import {
  usePetSceneAssetUpload,
  CATALOG_SPRITE_ACCEPT,
} from '@/hooks/pets/usePetSceneAssetUpload';
import { PetCommentsPanel } from '@/components/shared/PetCommentsPanel';
import {
  PET_ITEM_FIELDS,
  PET_ITEM_GROUPS,
  validatePetItem,
  splitBackendErrors,
  type PetItemField,
} from './petItemFields';

const INK = '#0b1440';
const DEEP = '#03548C';
const AZUL = '#00a4ff';

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? String(v) : '');

/**
 * Primer borrador a partir del brief del comercio, para no arrancar en blanco.
 *
 * `imageObjectKey` (la foto que subió el comercio, vive en la solicitud) y
 * `spriteObjectKey` (el sprite final, vive en el ítem) son campos distintos:
 * el backend siembra el segundo con el primero al aprobar, y el diseñador puede
 * reemplazarlo. Acá se replica ese sembrado por si el borrador llega vacío.
 *
 * `price` queda sin valor a propósito: no hay nada en la solicitud de donde
 * deducirlo y un default inventado se publicaría tal cual. `externalId` ya no
 * aparece: lo asigna el servidor al publicar.
 */
function seedDraft(req: PetRequestDetail): PetItemDraft {
  return {
    name: req.productName.slice(0, 100),
    description: req.description?.slice(0, 500) ?? '',
    spriteObjectKey: req.imageObjectKey ?? '',
    active: true,
  };
}

export function DesignerPetRequestDetail({
  requestId,
  onBack,
}: {
  requestId: number;
  onBack: () => void;
}) {
  const [req, setReq] = useState<PetRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [draft, setDraft] = useState<PetItemDraft>({});
  const [saved, setSaved] = useState<PetItemDraft>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState('');

  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState('');
  const [rawError, setRawError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const detail = await getGameDesignerPetRequestDetail(requestId);
      const initial = detail.draft && Object.keys(detail.draft).length > 0
        ? detail.draft
        : seedDraft(detail);
      setReq(detail);
      setDraft(initial);
      setSaved(initial);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const issues = useMemo(() => validatePetItem(draft), [draft]);
  const blocking = issues.filter(i =>
    PET_ITEM_FIELDS.find(f => f.key === i.key)?.required,
  );

  const setField = (key: string, value: unknown) => setDraft(d => ({ ...d, [key]: value }));

  const enterRawMode = () => {
    setRawText(JSON.stringify(draft, null, 2));
    setRawError('');
    setRawMode(true);
  };

  // Al salir del modo JSON se valida: si no parsea, no se pisa el borrador.
  const exitRawMode = () => {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setRawError('El borrador tiene que ser un objeto JSON.');
        return;
      }
      setDraft(parsed as PetItemDraft);
      setRawError('');
      setRawMode(false);
    } catch {
      setRawError('El JSON tiene un error de sintaxis.');
    }
  };

  // Guardar no valida nada del lado del backend: se puede guardar incompleto.
  // Y no hace merge, así que va el objeto entero en cada llamada.
  const save = async (next: PetItemDraft = draft) => {
    setSaving(true);
    setError('');
    setErrorList([]);
    try {
      await savePetRequestDraft(requestId, next);
      setSaved(next);
      setSavedAt(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
      return true;
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'No se pudo guardar el borrador.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Publicar no manda cuerpo: crea el ítem con lo que esté guardado. Por eso, si
  // hay cambios sin guardar, se guardan primero o se publicaría una versión vieja.
  const publish = async () => {
    setError('');
    setErrorList([]);
    if (dirty && !(await save())) return;

    setPublishing(true);
    try {
      await publishPetRequest(requestId);
      setConfirming(false);
      await load();
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'No se pudo publicar el ítem.');
      // El backend concatena los fallos del schema con `;` en un solo mensaje.
      const parts = splitBackendErrors(message);
      setError(parts.length > 1 ? 'El ítem no pasó la validación:' : message);
      setErrorList(parts.length > 1 ? parts : []);
      setConfirming(false);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: AZUL }} />
      </div>
    );
  }

  if (loadError || !req) {
    return (
      <div className="space-y-4">
        <Back onBack={onBack} />
        <div className="flex flex-col items-center gap-3 py-16 text-red-500">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">No se pudo cargar la solicitud.</p>
          <button onClick={load} className="cursor-pointer text-xs hover:underline" style={{ color: AZUL }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const cerrada = req.status === 'COMPLETED';
  const busy = saving || publishing;
  const extraKeys = Object.keys(draft).filter(k => !PET_ITEM_FIELDS.some(f => f.key === k));

  return (
    <div className="flex flex-col gap-5">
      <Back onBack={onBack} />

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">

        {/* Brief del comercio + conversación */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            {req.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={req.imageUrl}
                alt=""
                className="mb-4 aspect-square w-full rounded-xl border border-gray-100 object-cover"
              />
            ) : (
              <div className="mb-4 flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-gray-200">
                <PawPrint className="h-8 w-8 text-gray-300" />
              </div>
            )}

            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Lo que pidió el comercio
            </p>
            <h2 className="mt-1 font-bold" style={{ color: INK }}>{req.productName}</h2>
            {req.commercialName && (
              <p className="mt-0.5 text-xs text-gray-400">{req.commercialName}</p>
            )}

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Qué es</dt>
                <dd className="mt-0.5 leading-relaxed text-gray-700">{req.description}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Efectos que pidió
                </dt>
                <dd className="mt-0.5 leading-relaxed text-gray-700">{req.desiredEffects || '—'}</dd>
              </div>
              {req.adminNotes && (
                <div className="rounded-lg bg-amber-50 p-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Notas del admin
                  </dt>
                  <dd className="mt-0.5 leading-relaxed text-amber-900">{req.adminNotes}</dd>
                </div>
              )}
            </dl>
          </div>

          <PetCommentsPanel role="DESIGNER" requestId={requestId} className="h-[26rem]" />
        </aside>

        {/* Borrador del ítem */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="font-bold" style={{ color: INK }}>Ítem del catálogo</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {cerrada
                  ? 'Ya publicado. Este es el contenido con el que se creó.'
                  : 'Guardar no valida nada. Publicar sí: crea el ítem y cierra la solicitud.'}
              </p>
            </div>
            {!cerrada && (
              <button
                type="button"
                onClick={rawMode ? exitRawMode : enterRawMode}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                {rawMode ? <ListChecks className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
                {rawMode ? 'Volver al formulario' : 'Editar como JSON'}
              </button>
            )}
          </div>

          {cerrada ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Publicado en el catálogo
                {req.resultCatalogItemId && <> como ítem <b>#{req.resultCatalogItemId}</b></>}.
              </div>
              <pre className="overflow-x-auto rounded-xl bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-700">
                {JSON.stringify(draft, null, 2)}
              </pre>
            </div>
          ) : rawMode ? (
            <div className="mt-4 space-y-2">
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                spellCheck={false}
                rows={22}
                className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:ring-2"
                style={{ '--tw-ring-color': AZUL } as React.CSSProperties}
              />
              {rawError && (
                <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
                  <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                  {rawError}
                </p>
              )}
              <p className="text-xs text-gray-400">
                El borrador admite cualquier clave. Aplica los cambios para volver al formulario.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {PET_ITEM_GROUPS.map(group => {
                const fields = PET_ITEM_FIELDS.filter(f => f.group === group.id);
                return (
                  <fieldset key={group.id}>
                    <legend className="text-[11px] font-bold uppercase tracking-wide" style={{ color: DEEP }}>
                      {group.title}
                    </legend>
                    <p className="mb-3 mt-0.5 text-xs text-gray-400">{group.hint}</p>

                    <div className={group.id === 'efectos'
                      ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
                      : group.id === 'tipo'
                      ? 'grid gap-2 sm:grid-cols-2'
                      : 'grid gap-4 sm:grid-cols-2'}>
                      {fields.map(f => (
                        <Field
                          key={f.key}
                          field={f}
                          draft={draft}
                          onChange={setField}
                          invalid={issues.find(i => i.key === f.key)?.message}
                        />
                      ))}
                    </div>
                  </fieldset>
                );
              })}

              {extraKeys.length > 0 && (
                <p className="text-xs text-gray-400">
                  El borrador tiene otras claves ({extraKeys.join(', ')}). Se conservan al guardar;
                  edítalas como JSON.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="flex items-start gap-1.5 text-sm font-semibold text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
              {errorList.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-9 text-sm text-red-700">
                  {errorList.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          {!cerrada && (
            <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
              {blocking.length > 0 && !rawMode && (
                <p className="text-xs text-amber-700">
                  Falta para poder publicar: <b>{blocking.map(i => i.label).join(', ')}</b>. Puedes
                  guardar el borrador igual.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => save()}
                  disabled={busy || rawMode || !dirty}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar borrador
                </button>

                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={busy || rawMode || issues.length > 0}
                  title={issues.length > 0 ? 'Completa los campos obligatorios para publicar' : undefined}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${AZUL}, ${DEEP})` }}
                >
                  <Rocket className="h-4 w-4" />
                  Publicar al catálogo
                </button>

                <span className="text-xs text-gray-400">
                  {rawMode
                    ? 'Aplica los cambios del JSON para guardar o publicar.'
                    : dirty
                    ? 'Tienes cambios sin guardar.'
                    : savedAt
                    ? `Guardado a las ${savedAt}.`
                    : 'Todo guardado.'}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !publishing && setConfirming(false)} />
          <div className="relative flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold" style={{ color: INK }}>¿Publicar este ítem?</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Se crea el ítem en el catálogo con el contenido del borrador y la solicitud se
              cierra. {dirty && 'Los cambios sin guardar se guardan antes de publicar.'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={publishing}
                className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={publishing}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${AZUL}, ${DEEP})` }}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Campo ─────────────────────────────────────────────────────────────────────

function Field({
  field: f,
  draft,
  onChange,
  invalid,
}: {
  field: PetItemField;
  draft: PetItemDraft;
  onChange: (key: string, value: unknown) => void;
  invalid?: string;
}) {
  const id = `draft-${f.key}`;
  const ring = { '--tw-ring-color': AZUL } as React.CSSProperties;
  const border = invalid ? 'border-red-300' : 'border-gray-200';

  if (f.kind === 'asset') {
    return <AssetField field={f} value={str(draft[f.key])} onChange={onChange} invalid={invalid} />;
  }

  if (f.kind === 'bool') {
    // `active` sin valor equivale a activo: el backend lo asume true al omitirlo.
    const checked = f.key === 'active'
      ? draft[f.key] !== false
      : draft[f.key] === true;
    const disabled = f.dependsOn ? draft[f.dependsOn] !== true : false;

    return (
      <label
        htmlFor={id}
        className={`flex items-start gap-2.5 rounded-xl border ${border} px-3 py-2.5 ${
          disabled ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(f.key, e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[#00a4ff]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-800">{f.label}</span>
          {f.help && <span className="mt-0.5 block text-xs leading-relaxed text-gray-400">{f.help}</span>}
        </span>
      </label>
    );
  }

  const label = (
    <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {f.label}
      {f.required
        ? <span className="ml-1 text-red-500">*</span>
        : <span className="ml-1 text-gray-400">· opcional</span>}
    </label>
  );

  return (
    <div className={`flex flex-col gap-1.5 ${f.kind === 'textarea' ? 'sm:col-span-2' : ''}`}>
      {label}

      {f.kind === 'textarea' ? (
        <textarea
          id={id}
          value={str(draft[f.key])}
          onChange={e => onChange(f.key, e.target.value.slice(0, f.maxLength ?? Infinity))}
          rows={3}
          className={`w-full resize-none rounded-xl border ${border} px-3 py-2.5 text-sm outline-none focus:ring-2`}
          style={ring}
        />
      ) : f.kind === 'int' ? (
        <input
          id={id}
          type="number"
          step={1}
          min={f.min}
          value={num(draft[f.key])}
          // Vacío se manda como null: todos los opcionales lo aceptan y así se
          // distingue "sin valor" de 0, que para los deltas es significativo.
          onChange={e => onChange(f.key, e.target.value === '' ? null : Number(e.target.value))}
          className={`w-full rounded-xl border ${border} px-3 py-2.5 text-sm outline-none focus:ring-2`}
          style={ring}
        />
      ) : (
        <input
          id={id}
          value={str(draft[f.key])}
          onChange={e => onChange(f.key, e.target.value.slice(0, f.maxLength ?? Infinity))}
          className={`w-full rounded-xl border ${border} px-3 py-2.5 text-sm outline-none focus:ring-2`}
          style={ring}
        />
      )}

      {invalid ? (
        <p className="text-xs font-medium text-red-600">{invalid}</p>
      ) : f.help ? (
        <p className="text-xs leading-relaxed text-gray-400">{f.help}</p>
      ) : null}
    </div>
  );
}

/**
 * Campo de sprite: sube el archivo y guarda en el borrador la clave que devuelve
 * el backend. Nunca se teclea a mano — una clave inventada se guarda igual de
 * bien que una buena y solo se descubre cuando el juego pide un 404.
 *
 * La vista previa sale del propio File por `createObjectURL`, no de una URL
 * armada con la clave: el bucket no es público-adivinable y construir esas URLs
 * en el cliente es justo lo que el resto del servicio evita.
 */
function AssetField({
  field: f,
  value,
  onChange,
  invalid,
}: {
  field: PetItemField;
  value: string;
  onChange: (key: string, value: unknown) => void;
  invalid?: string;
}) {
  const id = `draft-${f.key}`;
  const { state, select, retry, reset, canRetry, busy } = usePetSceneAssetUpload('CATALOG_SPRITE');
  const [preview, setPreview] = useState<string | null>(null);

  // Revocar al cambiar de archivo y al desmontar: sin esto cada subida deja un
  // blob vivo hasta que se recargue la página.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(prev => { if (prev) URL.revokeObjectURL(prev); return url; });

    const asset = await select(file);
    // Solo se toca el borrador si R2 confirmó: si falla, el sprite anterior sigue.
    if (asset) onChange(f.key, asset.objectKey);
  };

  const clear = () => {
    setPreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    reset();
    onChange(f.key, '');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {f.label}<span className="ml-1 text-gray-400">· opcional</span>
      </label>

      <div className={`flex items-center gap-3 rounded-xl border ${invalid ? 'border-red-300' : 'border-gray-200'} p-3`}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-6 w-6 text-gray-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* La clave, visible y editable. Mismo criterio que el editor de escenas:
              subir es el camino normal, pero al reabrir un borrador hay que PODER VER
              qué sprite tiene y pegar otro sin volver a subirlo. Dejarlo solo-subida
              ocultaba el valor guardado y no había forma de corregirlo. */}
          <input
            value={value}
            onChange={e => onChange(f.key, e.target.value)}
            placeholder="Sube un archivo o pega una clave existente"
            className="mb-2 block w-full rounded-lg border border-gray-200 px-2.5 py-1.5 font-mono text-xs outline-none focus:ring-2"
            style={{ '--tw-ring-color': AZUL } as React.CSSProperties}
          />

          <input
            id={id}
            type="file"
            accept={CATALOG_SPRITE_ACCEPT}
            disabled={busy}
            onChange={e => { const file = e.target.files?.[0]; if (file) pick(file); e.target.value = ''; }}
            className="block w-full text-xs text-gray-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0
                       file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700
                       hover:file:bg-gray-200 disabled:opacity-50"
          />

          {busy && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              {state.status === 'preparing' ? 'Preparando…' : `Subiendo… ${Math.round(state.progress)}%`}
            </p>
          )}

          {!busy && state.status === 'error' && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {state.error}
              {canRetry && (
                <button type="button" onClick={() => retry()} className="ml-2 cursor-pointer underline">
                  Reintentar
                </button>
              )}
            </p>
          )}

          {!busy && state.status !== 'error' && value && (
            <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-gray-500" title={value}>
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
              <span className="truncate">{state.fileName || value}</span>
              <button type="button" onClick={clear} className="shrink-0 cursor-pointer underline">
                Quitar
              </button>
            </p>
          )}
        </div>
      </div>

      {invalid ? (
        <p className="text-xs font-medium text-red-600">{invalid}</p>
      ) : (
        <p className="text-xs leading-relaxed text-gray-400">{f.help}</p>
      )}
    </div>
  );
}

function Back({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex cursor-pointer items-center gap-2 self-start text-sm font-medium text-gray-500 transition hover:text-gray-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a la bandeja
    </button>
  );
}
