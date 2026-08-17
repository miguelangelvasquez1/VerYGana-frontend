'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2, RefreshCw, AlertTriangle, Plus, Trash2, Save, Layers,
  ChevronUp, ChevronDown, X, Copy, Upload, CheckCircle2, Play,
} from 'lucide-react';
import {
  getPetScenes,
  createPetScene,
  updatePetScene,
  deletePetScene,
  type PetScene,
  type PetSceneObject,
} from '@/services/PetRequestService';
import { apiErrorMessage } from '@/hooks/pets/usePetImageUpload';
import {
  usePetSceneAssetUpload,
  SCENE_ASSET_ACCEPT,
} from '@/hooks/pets/usePetSceneAssetUpload';
import { splitBackendErrors } from './petItemFields';
import { ScenePreviewModal } from './ScenePreviewModal';

const INK = '#0b1440';
const DEEP = '#03548C';
const AZUL = '#00a4ff';

/**
 * `type` no está restringido por el backend. Estos tres son los conocidos
 * —inferidos de SpawnImage/SpawnVideoDelayed en el build y de la documentación
 * de la API— pero la lista completa está sin confirmar con el equipo del juego,
 * así que el campo es libre con sugerencias, no un select cerrado.
 */
const KNOWN_TYPES = ['background', 'image', 'video'];

const emptyObject = (): PetSceneObject => ({
  objectId: '',
  type: 'image',
  objectKey: '',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  scaleMultiplier: 1,
});

const emptyScene = (): PetScene => ({
  sceneId: 0,
  active: true,
  objects: [emptyObject()],
});

/**
 * El editor asume strings y números; si el backend manda `null` en cualquier
 * campo —o una escena sin `objects`— los `.trim()` de la validación revientan y
 * la pantalla se cae al abrir. Se normaliza al entrar al formulario.
 */
function normalizeScene(scene: PetScene): PetScene {
  return {
    // Se conserva tal cual: es la PK que necesita el PUT. Si se pierde acá, el
    // guardado cae en la rama de "crear" y duplica la escena en vez de editarla.
    id: scene?.id,
    sceneId: Number(scene?.sceneId ?? 0),
    active: scene?.active !== false,
    objects: (scene?.objects ?? []).map(o => ({
      objectId: String(o?.objectId ?? ''),
      type: String(o?.type ?? ''),
      objectKey: String(o?.objectKey ?? ''),
      url: o?.url ?? undefined,
      x: Number(o?.x ?? 0),
      y: Number(o?.y ?? 0),
      width: Number(o?.width ?? 1),
      height: Number(o?.height ?? 1),
      scaleMultiplier: o?.scaleMultiplier ?? null,
    })),
  };
}

// ── Validación (espejo del schema, para avisar antes del 400) ─────────────────

function validateScene(scene: PetScene): string[] {
  const errs: string[] = [];

  if (!Number.isInteger(scene.sceneId) || scene.sceneId < 0) {
    errs.push('El ID de escena tiene que ser un entero mayor o igual a 0.');
  }
  if (scene.objects.length === 0) {
    errs.push('La escena necesita al menos un objeto.');
  }

  const seen = new Set<string>();
  scene.objects.forEach((o, i) => {
    const n = `Objeto ${i + 1}`;
    const objectId = String(o.objectId ?? '');
    if (!objectId.trim()) errs.push(`${n}: falta el identificador.`);
    else if (objectId.length > 100) errs.push(`${n}: el identificador supera los 100 caracteres.`);
    else if (seen.has(objectId)) errs.push(`${n}: el identificador "${objectId}" está repetido.`);
    seen.add(objectId);

    if (!String(o.type ?? '').trim()) errs.push(`${n}: falta el tipo.`);
    if (!String(o.objectKey ?? '').trim()) errs.push(`${n}: falta la clave del asset.`);
    if (!Number.isInteger(o.x)) errs.push(`${n}: X tiene que ser entero.`);
    if (!Number.isInteger(o.y)) errs.push(`${n}: Y tiene que ser entero.`);
    if (!Number.isInteger(o.width) || o.width < 1) errs.push(`${n}: el ancho tiene que ser un entero ≥ 1.`);
    if (!Number.isInteger(o.height) || o.height < 1) errs.push(`${n}: el alto tiene que ser un entero ≥ 1.`);
    if (o.scaleMultiplier != null && !(o.scaleMultiplier > 0)) {
      errs.push(`${n}: la escala tiene que ser mayor que 0.`);
    }
  });

  return errs;
}

// ── Editor ────────────────────────────────────────────────────────────────────

export default function PetScenesEditor() {
  const [scenes, setScenes] = useState<PetScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [editing, setEditing] = useState<PetScene | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState<number | null>(null);
  // Los errores de validación no se muestran hasta que se intenta guardar: si no,
  // abrir una escena incompleta recibe con un panel rojo sin haber tocado nada.
  const [attempted, setAttempted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      // Se normaliza acá y no solo al editar: la lista también lee `objects`,
      // y una escena sin ese array la tumbaba entera.
      const data = await getPetScenes();
      setScenes((Array.isArray(data) ? data : []).map(normalizeScene));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const issues = useMemo(() => (editing ? validateScene(editing) : []), [editing]);

  const patchScene = (patch: Partial<PetScene>) =>
    setEditing(s => (s ? { ...s, ...patch } : s));

  const patchObject = (index: number, patch: Partial<PetSceneObject>) =>
    setEditing(s => s
      ? { ...s, objects: s.objects.map((o, i) => (i === index ? { ...o, ...patch } : o)) }
      : s);

  const addObject = () =>
    setEditing(s => (s ? { ...s, objects: [...s.objects, emptyObject()] } : s));

  const duplicateObject = (index: number) =>
    setEditing(s => {
      if (!s) return s;
      const copy = { ...s.objects[index], objectId: '' };
      const objects = [...s.objects];
      objects.splice(index + 1, 0, copy);
      return { ...s, objects };
    });

  const removeObject = (index: number) =>
    setEditing(s => (s ? { ...s, objects: s.objects.filter((_, i) => i !== index) } : s));

  const moveObject = (index: number, dir: -1 | 1) =>
    setEditing(s => {
      if (!s) return s;
      const target = index + dir;
      if (target < 0 || target >= s.objects.length) return s;
      const objects = [...s.objects];
      [objects[index], objects[target]] = [objects[target], objects[index]];
      return { ...s, objects };
    });

  const save = async () => {
    if (!editing) return;
    setAttempted(true);
    if (validateScene(editing).length > 0) return;
    setSaving(true);
    setError('');
    setErrorList([]);
    try {
      // `editing.id` (la PK), no `editing.sceneId`: la ruta identifica la fila.
      if (isNew || editing.id == null) await createPetScene(editing);
      else await updatePetScene(editing.id, editing);
      setEditing(null);
      await load();
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'No se pudo guardar la escena.');
      const parts = splitBackendErrors(message);
      setError(parts.length > 1 ? 'La escena no pasó la validación:' : message);
      setErrorList(parts.length > 1 ? parts : []);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    setDeleting(id);
    setError('');
    try {
      await deletePetScene(id);
      await load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'No se pudo eliminar la escena.'));
    } finally {
      setDeleting(null);
    }
  };

  // ── Formulario ─────────────────────────────────────────────────────────────

  if (editing) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: INK }}>
              {isNew ? 'Nueva escena' : `Escena ${editing.sceneId}`}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              El juego agrupa los objetos por el ID de escena.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(null)}
            disabled={saving}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" /> Cancelar
          </button>
        </div>

        {/* Cabecera de la escena */}
        <div className="grid gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sceneId" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              ID de escena <span className="text-red-500">*</span>
            </label>
            <input
              id="sceneId"
              type="number"
              step={1}
              min={0}
              value={Number.isFinite(editing.sceneId) ? editing.sceneId : ''}
              onChange={e => patchScene({ sceneId: e.target.value === '' ? NaN : Number(e.target.value) })}
              disabled={!isNew}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
              style={{ '--tw-ring-color': AZUL } as React.CSSProperties}
            />
            {!isNew && <p className="text-xs text-gray-400">No se puede cambiar en una escena existente.</p>}
          </div>

          <label className="flex h-fit cursor-pointer items-start gap-2.5 self-end rounded-xl border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editing.active !== false}
              onChange={e => patchScene({ active: e.target.checked })}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#00a4ff]"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">Activa</span>
              <span className="mt-0.5 block text-xs text-gray-400">
                Si está inactiva, no se le entrega al juego.
              </span>
            </span>
          </label>
        </div>

        {/* Objetos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: DEEP }}>
              Objetos ({editing.objects.length})
            </h3>
            <button
              type="button"
              onClick={addObject}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" /> Añadir objeto
            </button>
          </div>

          {editing.objects.map((obj, i) => (
            <ObjectRow
              key={i}
              index={i}
              total={editing.objects.length}
              obj={obj}
              onChange={patch => patchObject(i, patch)}
              onMove={dir => moveObject(i, dir)}
              onDuplicate={() => duplicateObject(i)}
              onRemove={() => removeObject(i)}
            />
          ))}

          {editing.objects.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
              La escena necesita al menos un objeto.
            </p>
          )}
        </div>

        {(error || (attempted && issues.length > 0)) && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            {error && (
              <p className="flex items-start gap-1.5 text-sm font-semibold text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            {(errorList.length > 0 || (attempted && issues.length > 0)) && (
              <ul className="mt-2 list-disc space-y-1 pl-9 text-sm text-red-700">
                {(errorList.length > 0 ? errorList : issues).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-gray-200/80 pt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${DEEP})` }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? 'Crear escena' : 'Guardar cambios'}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={() => setPreviewing(editing.sceneId)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Play className="h-4 w-4" /> Previsualizar
            </button>
          )}

          <span className="text-xs text-gray-400">
            La validación corre igual al crear que al editar.
          </span>
        </div>

        {previewing !== null && (
          <ScenePreviewModal sceneId={previewing} onClose={() => setPreviewing(null)} />
        )}
      </div>
    );
  }

  // ── Lista ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: INK }}>Escenas</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Fondos y objetos que el juego dibuja alrededor de la mascota.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
            title="Actualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(emptyScene());
              setIsNew(true);
              setError(''); setErrorList([]); setAttempted(false);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${AZUL}, ${DEEP})` }}
          >
            <Plus className="h-4 w-4" /> Nueva escena
          </button>
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-sm font-medium text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: AZUL }} />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-red-500">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">No se pudieron cargar las escenas.</p>
          <button onClick={load} className="cursor-pointer text-xs hover:underline" style={{ color: AZUL }}>
            Reintentar
          </button>
        </div>
      ) : scenes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <Layers className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Todavía no hay escenas</p>
          <p className="max-w-xs text-xs text-gray-400">
            Una escena agrupa el fondo y los objetos que el juego dibuja.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map(scene => (
            <div
              key={scene.id ?? scene.sceneId}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold" style={{ color: INK }}>Escena {scene.sceneId}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {scene.objects.length} objeto{scene.objects.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    scene.active !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {scene.active !== false ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <ul className="space-y-1 text-xs text-gray-500">
                {scene.objects.slice(0, 3).map((o, i) => (
                  // Índice como key: `objectId` puede venir vacío o repetido.
                  <li key={i} className="truncate">
                    <span className="font-mono">{o.objectId || '(sin id)'}</span>
                    {o.type ? ` · ${o.type}` : ''}
                  </li>
                ))}
                {scene.objects.length > 3 && (
                  <li className="text-gray-400">y {scene.objects.length - 3} más…</li>
                )}
                {scene.objects.length === 0 && (
                  <li className="text-gray-400">Sin objetos</li>
                )}
              </ul>

              <div className="mt-auto flex gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    // Ya viene normalizada de `load`; se clona para no editar
                    // en sitio el objeto de la lista.
                    setEditing(structuredClone(scene));
                    setIsNew(false);
                    setError(''); setErrorList([]); setAttempted(false);
                  }}
                  className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewing(scene.sceneId)}
                  title="Previsualizar en el juego"
                  className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scene.id != null && remove(scene.id)}
                  disabled={scene.id == null || deleting === scene.id}
                  className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === scene.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewing !== null && (
        <ScenePreviewModal sceneId={previewing} onClose={() => setPreviewing(null)} />
      )}
    </div>
  );
}

// ── Fila de objeto ────────────────────────────────────────────────────────────

/**
 * Sube el archivo y deja la `objectKey` que devuelve el backend. El campo de
 * texto queda editable para pegar una clave existente, pero ya no hace falta
 * adivinarla.
 */
function AssetField({
  objectKey,
  url,
  onKey,
}: {
  objectKey: string;
  /** Sólo de lo ya guardado; una clave recién pegada todavía no la tiene. */
  url?: string;
  onKey: (key: string) => void;
}) {
  const upload = usePetSceneAssetUpload('SCENE_OBJECT');
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, select, retry, canRetry, busy } = upload;

  const pick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const key = await select(file);
    if (key) onKey(key);
  };

  // Sólo vale para lo ya guardado: si la clave cambió sin guardar, la miniatura
  // apuntaría al asset anterior y engañaría más de lo que ayuda.
  const thumb = url && objectKey ? url : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-gray-50 object-contain"
          />
        )}
        <input
          value={objectKey}
          onChange={e => onKey(e.target.value)}
          placeholder="Sube un archivo o pega una clave existente"
          className="w-full rounded-lg border border-gray-200 px-2.5 py-2 font-mono text-sm outline-none focus:ring-2"
          style={{ '--tw-ring-color': AZUL } as React.CSSProperties}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {busy ? 'Subiendo…' : 'Subir'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={SCENE_ASSET_ACCEPT}
          className="sr-only"
          onChange={e => { pick(e.target.files); e.target.value = ''; }}
        />
      </div>

      {state.status === 'uploading' && (
        <div className="h-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${state.progress}%`, background: AZUL }}
          />
        </div>
      )}

      {state.status === 'ready' && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{state.fileName}</span>
        </p>
      )}

      {state.status === 'error' && (
        <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          {state.error}
          {canRetry && (
            <button
              type="button"
              onClick={async () => { const k = await retry(); if (k) onKey(k); }}
              className="ml-1 shrink-0 cursor-pointer font-semibold underline"
            >
              Reintentar
            </button>
          )}
        </p>
      )}

      <p className="text-[11px] text-gray-400">
        PNG, JPEG, WEBP, MP4 o MOV · hasta 25 MB
      </p>
    </div>
  );
}

function ObjectRow({
  index, total, obj, onChange, onMove, onDuplicate, onRemove,
}: {
  index: number;
  total: number;
  obj: PetSceneObject;
  onChange: (patch: Partial<PetSceneObject>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const ring = { '--tw-ring-color': AZUL } as React.CSSProperties;
  const input = 'w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm outline-none focus:ring-2';
  const label = 'text-[10px] font-semibold uppercase tracking-wide text-gray-500';
  const int = (v: string) => (v === '' ? NaN : Number(v));

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button" onClick={() => onMove(-1)} disabled={index === 0}
            title="Subir"
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button" onClick={() => onMove(1)} disabled={index === total - 1}
            title="Bajar"
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button" onClick={onDuplicate} title="Duplicar"
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button" onClick={onRemove} title="Quitar"
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 lg:col-span-2">
          <label className={label}>Identificador *</label>
          <input
            value={obj.objectId}
            onChange={e => onChange({ objectId: e.target.value.slice(0, 100) })}
            placeholder="background_main"
            className={`${input} font-mono`}
            style={ring}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={label}>Tipo *</label>
          {/* Campo libre con sugerencias: el backend no restringe los valores. */}
          <input
            value={obj.type}
            onChange={e => onChange({ type: e.target.value })}
            list="pet-scene-types"
            className={input}
            style={ring}
          />
          <datalist id="pet-scene-types">
            {KNOWN_TYPES.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-1">
          <label className={label}>Escala</label>
          <input
            type="number" step="0.1" min="0.1"
            value={obj.scaleMultiplier ?? ''}
            onChange={e => onChange({ scaleMultiplier: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="1.0"
            className={input}
            style={ring}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
          <label className={label}>Asset *</label>
          <AssetField
            objectKey={obj.objectKey}
            url={obj.url}
            onKey={key => onChange({ objectKey: key })}
          />
        </div>

        {([
          ['x', 'X'], ['y', 'Y'], ['width', 'Ancho'], ['height', 'Alto'],
        ] as const).map(([key, text]) => (
          <div key={key} className="flex flex-col gap-1">
            <label className={label}>{text} *</label>
            <input
              type="number"
              step={1}
              min={key === 'width' || key === 'height' ? 1 : undefined}
              value={Number.isFinite(obj[key]) ? obj[key] : ''}
              onChange={e => onChange({ [key]: int(e.target.value) } as Partial<PetSceneObject>)}
              className={input}
              style={ring}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
