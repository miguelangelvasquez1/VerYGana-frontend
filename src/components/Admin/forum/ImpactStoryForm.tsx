'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useImpactStoryUpload } from '@/hooks/useImpactStory';
import type {
  ImpactStoryFormValues,
  ImpactStoryResponse,
  MediaFilePreview,
  MediaType,
  StoryStatus,
} from '@/types/impactStory.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Educación', 'Salud', 'Medio Ambiente', 'Comunidad',
  'Infraestructura', 'Emprendimiento', 'Alimentación', 'Tecnología', 'Otro',
];
const CURRENCIES = ['USD', 'COP', 'EUR', 'MXN', 'BRL'];
const nanoid = () => Math.random().toString(36).slice(2, 10);

const INITIAL_VALUES: ImpactStoryFormValues = {
  title: '', description: '',
  storyDate: new Date().toISOString().slice(0, 10),
  beneficiariesCount: '', investedAmount: '',
  investedCurrency: 'COP', location: '', category: '',
  status: 'DRAFT', authorName: '', tags: '', mediaFiles: [],
};

// ─── Shared field classes ─────────────────────────────────────────────────────

const inputCls = (err?: string) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-gray-800 bg-white/70
   outline-none transition-all duration-150
   ${err
     ? 'border-red-400 focus:ring-2 focus:ring-red-200'
     : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
   }
   disabled:opacity-50 disabled:cursor-not-allowed placeholder:font-normal placeholder:text-gray-400`;

const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImpactStoryFormProps {
  initialData?: ImpactStoryResponse;
  onSuccess?: (storyId: number) => void;
  onCancel?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImpactStoryForm({ initialData, onSuccess, onCancel }: ImpactStoryFormProps) {
  const isEditing = !!initialData;
  const { submitState, submit } = useImpactStoryUpload();
  const isBusy = !['idle', 'error', 'success'].includes(submitState.status);

  const [values, setValues] = useState<ImpactStoryFormValues>(() => {
    if (!initialData) return INITIAL_VALUES;
    return {
      title: initialData.title,
      description: initialData.description,
      storyDate: initialData.storyDate,
      beneficiariesCount: initialData.beneficiariesCount,
      investedAmount: initialData.investedAmount,
      investedCurrency: initialData.investedCurrency,
      location: initialData.location ?? '',
      category: initialData.category ?? '',
      status: initialData.status,
      authorName: initialData.authorName ?? '',
      tags: initialData.tags ?? '',
      mediaFiles: initialData.mediaFiles.map((m) => ({
        id: String(m.id),
        mediaType: m.mediaType,
        previewUrl: m.thumbnailUrl ?? m.publicUrl,
        fileName: m.fileName, fileSize: m.sizeBytes, mimeType: m.mimeType,
        altText: m.altText ?? '', displayOrder: m.displayOrder, isCover: m.isCover,
        uploadStatus: 'done' as const, uploadProgress: 100,
        mediaAssetId: String(m.id), publicUrl: m.publicUrl,
      })),
    };
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ImpactStoryFormValues, string>>>({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const set = <K extends keyof ImpactStoryFormValues>(k: K, v: ImpactStoryFormValues[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const setMedia: React.Dispatch<React.SetStateAction<MediaFilePreview[]>> = (updater) =>
    setValues((prev) => ({
      ...prev,
      mediaFiles: typeof updater === 'function' ? updater(prev.mediaFiles) : updater,
    }));

  const validate = () => {
    const e: typeof errors = {};
    if (!values.title.trim()) e.title = 'El título es obligatorio';
    if (!values.description.trim()) e.description = 'La descripción es obligatoria';
    if (!values.storyDate) e.storyDate = 'La fecha es obligatoria';
    if (values.beneficiariesCount === '' || Number(values.beneficiariesCount) < 0)
      e.beneficiariesCount = 'Ingresa un número válido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addFiles = useCallback((files: File[]) => {
    const previews: MediaFilePreview[] = files.map((file, i) => ({
      id: nanoid(), file,
      mediaType: (file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE') as MediaType,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name, fileSize: file.size, mimeType: file.type,
      altText: '', displayOrder: values.mediaFiles.length + i,
      isCover: values.mediaFiles.length === 0 && i === 0,
      uploadStatus: 'idle', uploadProgress: 0,
    }));
    setValues((prev) => ({ ...prev, mediaFiles: [...prev.mediaFiles, ...previews] }));
  }, [values.mediaFiles.length]);

  const removeMedia = (id: string) =>
    setValues((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((m) => m.id !== id).map((m, i) => ({ ...m, displayOrder: i })),
    }));

  const setCover = (id: string) =>
    setValues((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.map((m) => ({ ...m, isCover: m.id === id })),
    }));

  const updateAltText = (id: string, altText: string) =>
    setValues((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.map((m) => (m.id === id ? { ...m, altText } : m)),
    }));

  const handleSubmit = async (statusOverride: StoryStatus) => {
    if (!validate()) return;
    const result = await submit(values, statusOverride, setMedia);
    if (result.ok) onSuccess?.(result.storyId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (files.length) addFiles(files);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ── Header card ── */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-6 mb-1 shadow-lg shadow-emerald-900/20">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {isEditing ? 'Editar Historia de Impacto' : 'Nueva Historia de Impacto'}
              </h1>
              <p className="text-emerald-200 text-sm mt-0.5">Comparte el impacto real de tu organización</p>
            </div>
          </div>

          {/* Progress bar */}
          {isBusy && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
                <span>
                  {submitState.status === 'uploading_media' && `Subiendo archivos...`}
                  {submitState.status === 'creating' && 'Guardando historia...'}
                </span>
                <span>{Math.round(submitState.progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-300 rounded-full transition-all duration-300"
                  style={{ width: `${submitState.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error banner */}
        {submitState.status === 'error' && (
          <div className="mt-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/>
            </svg>
            {submitState.error}
          </div>
        )}

        {/* ── Main form card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-2 overflow-hidden">

          {/* ── 01 Información Principal ── */}
          <Section num="01" title="Información Principal">
            <div className="mb-4">
              <label className={labelCls}>Título <Required /></label>
              <input
                className={inputCls(errors.title)}
                placeholder="Ej. 200 familias con acceso a agua potable en Chocó"
                value={values.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={255}
                disabled={isBusy}
              />
              {errors.title && <FieldError msg={errors.title} />}
            </div>

            <div className="mb-4">
              <label className={labelCls}>Descripción <Required /></label>
              <textarea
                className={`${inputCls(errors.description)} resize-none`}
                placeholder="Describe el contexto, las acciones realizadas y los resultados obtenidos..."
                rows={5}
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                disabled={isBusy}
              />
              {errors.description && <FieldError msg={errors.description} />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Fecha <Required /></label>
                <input
                  type="date"
                  className={inputCls(errors.storyDate)}
                  value={values.storyDate}
                  onChange={(e) => set('storyDate', e.target.value)}
                  disabled={isBusy}
                />
                {errors.storyDate && <FieldError msg={errors.storyDate} />}
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <select
                  className={inputCls()}
                  value={values.category}
                  onChange={(e) => set('category', e.target.value)}
                  disabled={isBusy}
                >
                  <option value="">— Seleccionar —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Ubicación</label>
                <input
                  className={inputCls()}
                  placeholder="Ciudad, Departamento"
                  value={values.location}
                  onChange={(e) => set('location', e.target.value)}
                  disabled={isBusy}
                />
              </div>
            </div>
          </Section>

          {/* ── 02 Métricas ── */}
          <Section num="02" title="Métricas de Impacto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Beneficiados */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path strokeLinecap="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <label className={labelCls + ' mb-0'}>Beneficiados <Required /></label>
                </div>
                <input
                  type="number" min="0"
                  className={inputCls(errors.beneficiariesCount) + ' text-lg font-bold'}
                  placeholder="0"
                  value={values.beneficiariesCount}
                  onChange={(e) => set('beneficiariesCount', e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isBusy}
                />
                {errors.beneficiariesCount && <FieldError msg={errors.beneficiariesCount} />}
              </div>

              {/* Inversión */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round"/>
                      <path strokeLinecap="round" d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <label className={labelCls + ' mb-0'}>Inversión realizada</label>
                </div>
                <div className="flex gap-2">
                  <select
                    className={`w-24 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 
                                shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 
                                focus:border-blue-400 transition-colors disabled:opacity-50 cursor-pointer`}
                    value={values.investedCurrency}
                    onChange={(e) => set('investedCurrency', e.target.value)}
                    disabled={isBusy}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number" min="0" step="0.01"
                    className={inputCls() + ' text-lg font-bold'}
                    placeholder="0.00"
                    value={values.investedAmount}
                    onChange={(e) => set('investedAmount', e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isBusy}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ── 03 Media ── */}
          <Section num="03" title="Fotos y Videos">
            <p className="text-xs text-gray-400 -mt-3 mb-4">
              Los archivos se suben al CDN al publicar. El primero marcado será la portada.
            </p>

            {/* Drop zone */}
            <div
              className={`
                border-2 border-dashed rounded-xl py-10 px-4 text-center cursor-pointer
                transition-all duration-200 mb-4
                ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50/60 hover:border-emerald-400 hover:bg-emerald-50/50'}
                ${isBusy ? 'pointer-events-none opacity-50' : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600">Haz clic o arrastra archivos aquí</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, MP4, MOV · múltiples archivos</p>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) addFiles(files);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Media grid */}
            {values.mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {values.mediaFiles.map((m) => (
                  <MediaCard
                    key={m.id} media={m} disabled={isBusy}
                    onRemove={() => removeMedia(m.id)}
                    onSetCover={() => setCover(m.id)}
                    onAltText={(t) => updateAltText(m.id, t)}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* ── 04 Información adicional ── */}
          <Section num="04" title="Información Adicional">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Autor / Responsable</label>
                <input
                  className={inputCls()}
                  placeholder="Nombre del responsable"
                  value={values.authorName}
                  onChange={(e) => set('authorName', e.target.value)}
                  disabled={isBusy}
                />
              </div>
              <div>
                <label className={labelCls}>Etiquetas</label>
                <input
                  className={inputCls()}
                  placeholder="agua, comunidad, 2024 (separadas por coma)"
                  value={values.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  disabled={isBusy}
                />
              </div>
            </div>
          </Section>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-wrap">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-40"
              disabled={isBusy}
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-white border border-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
              disabled={isBusy}
              onClick={() => handleSubmit('DRAFT')}
            >
              Guardar borrador
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors disabled:opacity-40 flex items-center gap-2"
              disabled={isBusy}
              onClick={() => handleSubmit('PUBLISHED')}
            >
              {isBusy && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} opacity={0.3}/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round"/>
                </svg>
              )}
              {isBusy
                ? submitState.status === 'uploading_media'
                  ? `Subiendo ${Math.round(submitState.progress)}%`
                  : 'Publicando...'
                : isEditing ? 'Actualizar y publicar' : 'Publicar historia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 border-b border-gray-100 last:border-b-0">
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-gray-800 mb-4">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
          {num}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── MediaCard ────────────────────────────────────────────────────────────────

function MediaCard({ media, disabled, onRemove, onSetCover, onAltText }: {
  media: MediaFilePreview; disabled: boolean;
  onRemove: () => void; onSetCover: () => void; onAltText: (t: string) => void;
}) {
  const isUploading = media.uploadStatus === 'uploading' || media.uploadStatus === 'preparing';
  const hasError = media.uploadStatus === 'error';
  const sizeMb = (media.fileSize / (1024 * 1024)).toFixed(1);

  return (
    <div className={`
      relative rounded-xl border overflow-hidden bg-white transition-shadow
      ${media.isCover ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'}
      ${hasError ? 'border-red-300' : ''}
      hover:shadow-md
    `}>
      {/* Cover badge */}
      {media.isCover && (
        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
          Portada
        </span>
      )}

      {/* Upload overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/>
              <circle
                cx="20" cy="20" r="16" fill="none" stroke="white" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - media.uploadProgress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.2s' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
              {Math.round(media.uploadProgress)}%
            </span>
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="h-28 bg-gray-100 overflow-hidden">
        {media.mediaType === 'VIDEO' ? (
          <div className="relative h-full">
            <video src={media.previewUrl} muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        ) : (
          <img src={media.previewUrl} alt={media.altText || media.fileName} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Meta */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-700 truncate mb-0.5">{media.fileName}</p>
        <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
          {sizeMb} MB · {media.mediaType}
          {media.uploadStatus === 'done' && <span className="text-emerald-600 font-semibold">✓</span>}
          {hasError && <span className="text-red-500 font-semibold">✕</span>}
        </p>
        <input
          className="w-full px-2 py-1 text-[11px] rounded-lg border border-gray-200 outline-none focus:border-emerald-400 bg-gray-50 placeholder:text-gray-300 disabled:opacity-50"
          placeholder="Texto alternativo"
          value={media.altText}
          onChange={(e) => onAltText(e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-1.5 px-2.5 pb-2.5">
        {!media.isCover && (
          <button
            type="button"
            className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
            onClick={onSetCover} disabled={disabled} title="Usar como portada"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </button>
        )}
        <button
          type="button"
          className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
          onClick={onRemove} disabled={disabled} title="Eliminar"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Micro helpers ────────────────────────────────────────────────────────────

function Required() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}