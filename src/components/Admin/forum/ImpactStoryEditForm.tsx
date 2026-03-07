'use client';

import React, { useState } from 'react';
import { useUpdateImpactStory } from '@/hooks/useImpactStory';
import type { ImpactStoryResponse, StoryStatus } from '@/types/impactStory.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Educación', 'Salud', 'Medio Ambiente', 'Comunidad',
  'Infraestructura', 'Emprendimiento', 'Alimentación', 'Tecnología', 'Otro',
];
const CURRENCIES = ['USD', 'COP', 'EUR', 'MXN', 'BRL'];

const STATUS_OPTIONS: { value: StoryStatus; label: string }[] = [
  { value: 'DRAFT',     label: 'Borrador'  },
  { value: 'PUBLISHED', label: 'Publicada' },
  { value: 'ARCHIVED',  label: 'Archivada' },
];

// ─── Field classes ────────────────────────────────────────────────────────────

const inputCls = (err?: string) =>
  [
    'w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-gray-800 bg-white outline-none',
    'transition-all duration-150 placeholder:font-normal placeholder:text-gray-400',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    err
      ? 'border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100',
  ].join(' ');

const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

// ─── Form state type ──────────────────────────────────────────────────────────

interface EditFormValues {
  title: string;
  description: string;
  storyDate: string;
  beneficiariesCount: number | '';
  investedAmount: number | '';
  investedCurrency: string;
  location: string;
  category: string;
  status: StoryStatus;
  authorName: string;
  tags: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImpactStoryEditFormProps {
  story: ImpactStoryResponse;
  onSuccess: () => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImpactStoryEditForm({
  story,
  onSuccess,
  onCancel,
}: ImpactStoryEditFormProps) {
  const updateMutation = useUpdateImpactStory();
  const isBusy = updateMutation.isPending;

  const [values, setValues] = useState<EditFormValues>({
    title:              story.title,
    description:        story.description,
    storyDate:          story.storyDate,
    beneficiariesCount: story.beneficiariesCount,
    investedAmount:     story.investedAmount,
    investedCurrency:   story.investedCurrency,
    location:           story.location   ?? '',
    category:           story.category   ?? '',
    status:             story.status,
    authorName:         story.authorName ?? '',
    tags:               story.tags       ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EditFormValues, string>>>({});

  // ── Helpers ──────────────────────────────────────────────────────────────

  const set = <K extends keyof EditFormValues>(k: K, v: EditFormValues[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!values.title.trim())        e.title = 'El título es obligatorio';
    if (!values.description.trim())  e.description = 'La descripción es obligatoria';
    if (!values.storyDate)           e.storyDate = 'La fecha es obligatoria';
    if (values.beneficiariesCount === '' || Number(values.beneficiariesCount) < 0)
      e.beneficiariesCount = 'Ingresa un número válido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await updateMutation.mutateAsync({
      id:                 story.id,
      title:              values.title,
      description:        values.description,
      storyDate:          values.storyDate,
      beneficiariesCount: Number(values.beneficiariesCount),
      investedAmount:     Number(values.investedAmount) || 0,
      investedCurrency:   values.investedCurrency,
      location:           values.location   || undefined,
      category:           values.category   || undefined,
      status:             values.status,
      authorName:         values.authorName || undefined,
      tags:               values.tags       || undefined,
    });
    onSuccess();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-6 mb-2 shadow-lg shadow-emerald-900/20">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
              title="Volver"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Editar Historia</h1>
              <p className="text-emerald-200 text-sm mt-0.5 truncate max-w-md">{story.title}</p>
            </div>
          </div>
        </div>

        {/* Media notice */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-2 text-amber-700 text-xs font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
          </svg>
          Los archivos multimedia no se pueden editar. Para cambiarlos, elimina esta historia y crea una nueva.
        </div>

        {/* Error banner */}
        {updateMutation.isError && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-2 text-red-600 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Ocurrió un error al guardar. Intenta de nuevo.
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ── 01 Información Principal ── */}
          <Section num="01" title="Información Principal">
            <div className="mb-4">
              <label className={labelCls}>Título <Req /></label>
              <input
                className={inputCls(errors.title)}
                placeholder="Título de la historia"
                value={values.title}
                maxLength={255}
                disabled={isBusy}
                onChange={(e) => set('title', e.target.value)}
              />
              {errors.title && <Err msg={errors.title} />}
            </div>

            <div className="mb-4">
              <label className={labelCls}>Descripción <Req /></label>
              <textarea
                className={`${inputCls(errors.description)} resize-none`}
                rows={5}
                placeholder="Describe el impacto de la historia..."
                value={values.description}
                disabled={isBusy}
                onChange={(e) => set('description', e.target.value)}
              />
              {errors.description && <Err msg={errors.description} />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Fecha <Req /></label>
                <input
                  type="date"
                  className={inputCls(errors.storyDate)}
                  value={values.storyDate}
                  disabled={isBusy}
                  onChange={(e) => set('storyDate', e.target.value)}
                />
                {errors.storyDate && <Err msg={errors.storyDate} />}
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <select
                  className={inputCls()}
                  value={values.category}
                  disabled={isBusy}
                  onChange={(e) => set('category', e.target.value)}
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
                  disabled={isBusy}
                  onChange={(e) => set('location', e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* ── 02 Métricas ── */}
          <Section num="02" title="Métricas de Impacto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path strokeLinecap="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Beneficiados <Req />
                  </label>
                </div>
                <input
                  type="number" min="0"
                  className={`${inputCls(errors.beneficiariesCount)} text-lg font-bold`}
                  placeholder="0"
                  value={values.beneficiariesCount}
                  disabled={isBusy}
                  onChange={(e) => set('beneficiariesCount', e.target.value === '' ? '' : Number(e.target.value))}
                />
                {errors.beneficiariesCount && <Err msg={errors.beneficiariesCount} />}
              </div>

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

          {/* ── 03 Estado ── */}
          <Section num="03" title="Estado de publicación">
            <div className="grid grid-cols-3 gap-3">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = values.status === opt.value;
                const colorMap: Record<StoryStatus, string> = {
                  PUBLISHED: isActive
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/50',
                  DRAFT: isActive
                    ? 'border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-100'
                    : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:bg-amber-50/50',
                  ARCHIVED: isActive
                    ? 'border-gray-400 bg-gray-100 text-gray-700 ring-2 ring-gray-200'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50',
                };
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isBusy}
                    onClick={() => set('status', opt.value)}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${colorMap[opt.value]}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
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
                  disabled={isBusy}
                  onChange={(e) => set('authorName', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Etiquetas</label>
                <input
                  className={inputCls()}
                  placeholder="agua, comunidad, 2024"
                  value={values.tags}
                  disabled={isBusy}
                  onChange={(e) => set('tags', e.target.value)}
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors disabled:opacity-40 flex items-center gap-2"
              disabled={isBusy}
              onClick={handleSubmit}
            >
              {isBusy && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} opacity={0.3}/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round"/>
                </svg>
              )}
              {isBusy ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Micro helpers ────────────────────────────────────────────────────────────

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

function Req() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function Err({ msg }: { msg: string }) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}