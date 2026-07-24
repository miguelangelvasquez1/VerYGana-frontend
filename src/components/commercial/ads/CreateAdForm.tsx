// components/forms/CreateAdForm.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Upload, X, DollarSign, Eye, MapPin, Tag,
  Link as LinkIcon, Loader2, Clock, Info, CheckCircle2,
  AlertCircle, ChevronUp, ChevronDown, Film, Image as ImageIcon, ArrowLeft,
  HelpCircle,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { useAdUpload } from '@/hooks/ads/useAdUpload';
import { useRouter } from 'next/navigation';
import { AdDetails } from '@/types/ads/commercial';
import toast from 'react-hot-toast';
import { usePlanState } from '../layout/DashboardLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateAdFormData {
  title: string;
  description: string;
  type: 'IMAGE' | 'VIDEO';
  file: File | null;
  imageDurationSeconds: number; // 5–60, only for IMAGE
  pricePerLike: number;         // cents, multiple of 10, >= minPricePerLike
  maxViews: number;
  maxViewsPerUserPerDay: number;
  categoryIds: number[];
  targetUrl: string;
  targetAudience: {
    ageRange: [number, number];
    gender: 'ALL' | 'MALE' | 'FEMALE';
    municipalityCodes: string[];
  };
}

type FormStep = 'file' | 'pricing' | 'details';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMultiplesOf10From(minValue: number, count = 8): number[] {
  const start = minValue % 10 === 0 ? minValue : Math.ceil(minValue / 10) * 10;
  return Array.from({ length: count }, (_, i) => start + i * 10);
}

// ─── Small shared components ──────────────────────────────────────────────────

function SectionCard({ children, faded }: { children: React.ReactNode; faded?: boolean }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm transition-opacity ${faded ? 'opacity-50 pointer-events-none' : ''}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-[#03548C]/10 flex items-center justify-center flex-shrink-0 text-[#03548C]">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-base leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-[#03548C] bg-[#03548C]/5 border border-[#03548C]/20 rounded-lg px-3 py-2 mt-2">
      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CreateAdForm() {
  const router = useRouter();
  const { refreshPlanState } = usePlanState();

  const [step, setStep] = useState<FormStep>('file');
  const [formData, setFormData] = useState<CreateAdFormData>({
    title: '',
    description: '',
    type: 'IMAGE',
    file: null,
    imageDurationSeconds: 15,
    pricePerLike: 0,
    maxViews: 100,
    maxViewsPerUserPerDay: 10,
    categoryIds: [],
    targetUrl: '',
    targetAudience: { ageRange: [18, 65], gender: 'ALL', municipalityCodes: [] },
  });

  const [selectedMunicipalitiesData, setSelectedMunicipalitiesData] = useState<
    { code: string; name: string; departmentName: string }[]
  >([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showTargetUrlTip, setShowTargetUrlTip] = useState(false);

  const { categories, loading: loadingCategories } = useCategories();
  const { departments, loading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(selectedDepartment);

  // adDetails memo — keeps the hook's reference stable
  const adDetails: AdDetails = useMemo(() => ({
    title: formData.title,
    description: formData.description,
    targetUrl: formData.targetUrl || null,
    categoryIds: formData.categoryIds,
    targetMunicipalitiesCodes: formData.targetAudience.municipalityCodes,
    minAge: formData.targetAudience.ageRange[0],
    maxAge: formData.targetAudience.ageRange[1],
    targetGender: formData.targetAudience.gender,
    pricePerLike: formData.pricePerLike,
    maxLikes: formData.maxViews,
    maxLikesPerUserPerDay: formData.maxViewsPerUserPerDay,
  }), [formData]);

  const {
    uploadState, fileState, pricingInfo,
    prepareAndUpload, uploadAd, cancelAndOrphan,
  } = useAdUpload({ adDetails });

  // When analysis completes, move to pricing step and seed pricePerLike with the minimum
  useEffect(() => {
    if (pricingInfo) {
      setFormData((prev) => ({ ...prev, pricePerLike: pricingInfo.minPricePerLike }));
      setStep('pricing');
    }
  }, [pricingInfo]);

  const totalBudgetCents = formData.pricePerLike * formData.maxViews;
  const ageRangeInvalid = formData.targetAudience.ageRange[0] > formData.targetAudience.ageRange[1];
  const isUploading = uploadState.status === 'preparing'
    || uploadState.status === 'uploading'
    || uploadState.status === 'analyzing';
  const isSubmitting = uploadState.status === 'creating';

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFileSelected = (file: File) => {
    const type: 'IMAGE' | 'VIDEO' = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
    setFormData((prev) => ({ ...prev, file, type }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
  };

  /** "Confirm and upload" — triggers steps 1+2+3 */
  const handleConfirmFile = async () => {
    if (!formData.file) return;
    await prepareAndUpload(
      formData.file,
      formData.type === 'IMAGE' ? formData.imageDurationSeconds : undefined,
    );
  };

  /** User wants to pick a different file */
  const handleChangeFile = async () => {
    await cancelAndOrphan();
    setFormData((prev) => ({ ...prev, file: null, pricePerLike: 0 }));
    setStep('file');
  };

  // ── Categories ───────────────────────────────────────────────────────────────

  const toggleCategory = (id: number) =>
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));

  // ── Municipalities ───────────────────────────────────────────────────────────

  const addMunicipality = (code: string) => {
    if (formData.targetAudience.municipalityCodes.includes(code)) return;
    const mun = municipalities.find((m) => m.code === code);
    const dept = departments.find((d) => d.code === selectedDepartment);
    if (!mun || !dept) return;
    setSelectedMunicipalitiesData((prev) => [
      ...prev, { code: mun.code, name: mun.name, departmentName: dept.name },
    ]);
    setFormData((prev) => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        municipalityCodes: [...prev.targetAudience.municipalityCodes, code],
      },
    }));
  };

  const removeMunicipality = (code: string) => {
    setSelectedMunicipalitiesData((prev) => prev.filter((m) => m.code !== code));
    setFormData((prev) => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        municipalityCodes: prev.targetAudience.municipalityCodes.filter((c) => c !== code),
      },
    }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingInfo) { toast.error('Debes subir un archivo primero'); return; }
    if (formData.categoryIds.length === 0) { toast.error('Selecciona al menos una categoría'); return; }
    if (ageRangeInvalid) { toast.error('La edad mínima no puede ser mayor que la edad máxima'); return; }

    const result = await uploadAd();
    if (result.ok) {
      await refreshPlanState();
      toast.success('¡Anuncio creado con éxito!');
      router.push('/commercial/ads');
    } else {
      toast.error(result.errorMsg);
      if (result.assetOrphaned) {
        setFormData((prev) => ({ ...prev, file: null, pricePerLike: 0 }));
        setStep('file');
      }
    }
  };

  // ── Upload status label for the "confirming" button ──────────────────────────

  const uploadStatusLabel = () => {
    switch (uploadState.status) {
      case 'preparing':  return <><Loader2 className="w-4 h-4 animate-spin" /> Preparando...</>;
      case 'uploading':  return <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo {fileState?.progress?.toFixed(0) ?? 0}%</>;
      case 'analyzing':  return <><Loader2 className="w-4 h-4 animate-spin" /> Analizando archivo...</>;
      default:           return <>Confirmar y calcular precio</>;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/commercial/ads')}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crear nuevo anuncio</h2>
          <p className="text-sm text-gray-500 mt-1">Sube tu contenido, configura el presupuesto y llega a tu audiencia.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['file', 'pricing', 'details'] as FormStep[]).map((s, i) => {
          const labels = ['Archivo', 'Presupuesto', 'Detalles'];
          const done = (step === 'pricing' && i === 0) || (step === 'details' && i <= 1);
          const active = step === s;
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all
                ${active ? 'bg-[#03548C] text-white shadow-sm'
                  : done ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-400'}`}
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                {labels[i]}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-px transition-colors ${done ? 'bg-emerald-300' : active ? 'bg-[#03548C]/30' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 — FILE
        ══════════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader
            icon={<Upload className="w-5 h-5" />}
            title="Contenido del anuncio"
            subtitle="Sube la imagen o video que verán los usuarios"
          />

          {/* Show confirmed file badge when on pricing/details steps */}
          {step !== 'file' && pricingInfo && formData.file ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[220px]">{formData.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {pricingInfo.durationSeconds}s ·{' '}
                    {formData.type === 'IMAGE' ? 'imagen' : 'video'} · subido correctamente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangeFile}
                disabled={isSubmitting}
                className="text-xs text-[#03548C] font-semibold hover:underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          ) : (
            /* File selection UI */
            <>
              {/* Type toggle */}
              <div className="flex gap-2 mb-4">
                {(['IMAGE', 'VIDEO'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: t, file: null }))}
                    disabled={isUploading}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 flex items-center justify-center gap-2 transition-all
                      ${formData.type === t
                        ? 'border-[#03548C] bg-[#03548C]/10 text-[#03548C]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {t === 'IMAGE' ? <ImageIcon className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                    {t === 'IMAGE' ? 'Imagen' : 'Video'}
                  </button>
                ))}
              </div>

              {/* Image duration slider — only for IMAGE, before upload */}
              {formData.type === 'IMAGE' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="inline w-4 h-4 mr-1.5 text-[#03548C] -mt-0.5" />
                    Duración de visualización
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={5} max={60} step={5}
                      value={formData.imageDurationSeconds}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageDurationSeconds: Number(e.target.value) }))}
                      disabled={isUploading}
                      className="flex-1 accent-[#03548C] disabled:opacity-50"
                    />
                    <div className="w-20 text-center bg-[#03548C]/5 border-2 border-[#03548C]/20 rounded-xl py-2">
                      <span className="text-xl font-bold text-[#03548C]">{formData.imageDurationSeconds}</span>
                      <span className="text-xs text-[#03548C]/60 ml-0.5">s</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
                    <span>5s mín</span><span>60s máx</span>
                  </div>
                  <InfoNote>
                    El precio mínimo por visualización se calcula según esta duración.
                  </InfoNote>
                </div>
              )}

              {/* Drop zone / file selected */}
              {!formData.file ? (
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#03548C]/40 hover:bg-gray-50 transition-all"
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Arrastra tu archivo aquí o{' '}
                    <label className="text-[#03548C] font-semibold hover:underline cursor-pointer">
                      selecciona uno
                      <input
                        type="file"
                        className="hidden"
                        accept={formData.type === 'IMAGE' ? 'image/*' : 'video/*'}
                        onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); }}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-400">
                    {formData.type === 'IMAGE' ? 'JPG, PNG, WebP — máx 5 MB' : 'MP4, WebM — máx 100 MB'}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-[#03548C]/20 bg-[#03548C]/5 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#03548C]/10 rounded-lg flex items-center justify-center">
                      {formData.type === 'IMAGE'
                        ? <ImageIcon className="w-5 h-5 text-[#03548C]" />
                        : <Film className="w-5 h-5 text-[#03548C]" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{formData.file.name}</p>
                      <p className="text-xs text-gray-500">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, file: null }))}
                    disabled={isUploading}
                    className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Upload progress bar */}
              {isUploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {uploadState.status === 'preparing' && 'Preparando subida...'}
                      {uploadState.status === 'uploading' && `Subiendo archivo... ${fileState?.progress?.toFixed(0) ?? 0}%`}
                      {uploadState.status === 'analyzing' && 'Analizando contenido y calculando precio...'}
                    </span>
                    <span>{uploadState.progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#03548C] rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Confirm button */}
              {formData.file && !isUploading && (
                <button
                  type="button"
                  onClick={handleConfirmFile}
                  className="mt-4 w-full py-3 bg-[#03548C] text-white rounded-xl font-semibold text-sm
                    hover:bg-[#0b1440] active:scale-[0.98] transition-all flex items-center justify-center gap-2
                    shadow-md cursor-pointer"
                >
                  {uploadStatusLabel()}
                </button>
              )}
              {formData.file && isUploading && (
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full py-3 bg-[#03548C]/50 text-white rounded-xl font-semibold text-sm
                    flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  {uploadStatusLabel()}
                </button>
              )}

              {/* Error */}
              {uploadState.status === 'error' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {uploadState.error}
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 — PRICING
            Shown after analysis completes. pricingInfo is set by the hook.
        ══════════════════════════════════════════════════════════════════ */}
        {(step === 'pricing' || step === 'details') && pricingInfo && (
          <SectionCard>
            <SectionHeader
              icon={<DollarSign className="w-5 h-5" />}
              title="Presupuesto del anuncio"
              subtitle="El precio mínimo por visualización lo fija la duración de tu contenido"
            />

            {/* Pricing summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Duración</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pricingInfo.durationSeconds}
                  <span className="text-sm font-normal text-gray-500 ml-0.5">s</span>
                </p>
              </div>
              <div className="bg-[#03548C]/5 rounded-xl p-4 text-center border border-[#03548C]/15">
                <p className="text-xs font-semibold text-[#03548C]/60 uppercase tracking-wide mb-1">Precio mín / view</p>
                <p className="text-2xl font-bold text-[#03548C]">{formatCents(pricingInfo.minPricePerLike)}</p>
              </div>
            </div>

            {/* Price per view */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Precio por visualización <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Mínimo: {formatCents(pricingInfo.minPricePerLike)}.
                Un precio más alto puede priorizar tu anuncio en la plataforma.
              </p>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {getMultiplesOf10From(pricingInfo.minPricePerLike).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, pricePerLike: val }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
                      ${formData.pricePerLike === val
                        ? 'border-[#03548C] bg-[#03548C] text-white shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-[#03548C]/40 hover:text-[#03548C]'
                      }`}
                  >
                    {formatCents(val)}
                  </button>
                ))}
              </div>

              {/* Stepper input */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    pricePerLike: Math.max(pricingInfo.minPricePerLike, prev.pricePerLike - 10),
                  }))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition text-gray-600"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
                  <input
                    type="text"
                    readOnly
                    value={(formData.pricePerLike / 100).toFixed(2).replace('.', ',')}
                    className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-center font-bold text-gray-900
                      focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C] bg-gray-50 cursor-default"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, pricePerLike: prev.pricePerLike + 10 }))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition text-gray-600"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {formData.pricePerLike < pricingInfo.minPricePerLike && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  El precio mínimo es {formatCents(pricingInfo.minPricePerLike)}
                </p>
              )}
            </div>

            {/* Max views */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Eye className="inline w-4 h-4 mr-1.5 text-[#03548C] -mt-0.5" />
                Máximo de visualizaciones <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.maxViews || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxViews: Number(e.target.value) }))}
                onBlur={() => setFormData((prev) => ({ ...prev, maxViews: Math.max(1, prev.maxViews || 1) }))}
                min={1} max={10000000}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold
                  focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
                placeholder="Ej: 500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Mínimo 1 — máximo 10.000.000</p>
            </div>

            {/* Max views per user per day */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Eye className="inline w-4 h-4 mr-1.5 text-[#03548C] -mt-0.5" />
                Máximo de vistas por usuario al día <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.maxViewsPerUserPerDay || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxViewsPerUserPerDay: Number(e.target.value) }))}
                onBlur={() => setFormData((prev) => ({ ...prev, maxViewsPerUserPerDay: Math.max(1, prev.maxViewsPerUserPerDay || 1) }))}
                min={1} max={100}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold
                  focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
                placeholder="Ej: 10"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Límite de veces que un mismo usuario puede ver este anuncio en un día. Mínimo 1 — máximo 100</p>
            </div>

            {/* Total budget */}
            <div className="bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] rounded-xl p-5 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wide">Presupuesto total</p>
                  <p className="text-white/70 text-sm mt-0.5">
                    {formatCents(formData.pricePerLike)} × {formData.maxViews.toLocaleString('es-CO')} views
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold">{formatCents(totalBudgetCents)}</p>
                  <p className="text-white/50 text-xs">se descontará de tu saldo</p>
                </div>
              </div>
            </div>

            {step === 'pricing' && (
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={formData.pricePerLike < pricingInfo.minPricePerLike || formData.maxViews < 1}
                className="mt-4 w-full py-3 bg-[#03548C] text-white rounded-xl font-bold text-sm cursor-pointer
                  hover:bg-[#0b1440] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar con los detalles →
              </button>
            )}
          </SectionCard>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3 — DETAILS
        ══════════════════════════════════════════════════════════════════ */}
        {step === 'details' && (
          <>
            {/* Basic info */}
            <SectionCard>
              <SectionHeader icon={<Tag className="w-5 h-5" />} title="Información del anuncio" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
                    placeholder="Título de tu anuncio" required minLength={5} maxLength={100} disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm resize-none
                      focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
                    placeholder="Describe tu anuncio..." required minLength={10} maxLength={1000} disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                    <LinkIcon className="w-3.5 h-3.5" />
                    URL de destino <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setShowTargetUrlTip(true)}
                        onMouseLeave={() => setShowTargetUrlTip(false)}
                        onFocus={() => setShowTargetUrlTip(true)}
                        onBlur={() => setShowTargetUrlTip(false)}
                        className="text-gray-400 hover:text-[#03548C] transition-colors"
                        aria-label="Ayuda para: URL de destino"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                      {showTargetUrlTip && (
                        <div
                          role="tooltip"
                          className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-normal leading-relaxed text-white shadow-xl"
                        >
                          Será el destino al que irán los usuarios al ver el anuncio y darle al botón correspondiente.
                          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                      )}
                    </div>
                  </label>
                  <input
                    type="url" value={formData.targetUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, targetUrl: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                      focus:outline-none focus:ring-2 focus:ring-[#03548C]/40 focus:border-[#03548C]"
                    placeholder="https://ejemplo.com" maxLength={500} disabled={isSubmitting}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Categories */}
            <SectionCard>
              <SectionHeader
                icon={<Tag className="w-5 h-5" />}
                title="Categorías / Intereses"
                subtitle="Selecciona al menos una para segmentar correctamente tu anuncio"
              />
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando categorías...
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const selected = formData.categoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id} type="button"
                          onClick={() => toggleCategory(cat.id)}
                          disabled={isSubmitting}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
                            ${selected
                              ? 'border-[#03548C] bg-[#03548C] text-white shadow-sm shadow-blue-100'
                              : 'border-gray-200 text-gray-600 hover:border-[#03548C]/40 hover:text-[#03548C]'
                            } disabled:opacity-50`}
                        >
                          {selected && '✓ '}{cat.name}
                        </button>
                      );
                    })}
                  </div>
                  {formData.categoryIds.length === 0 && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Selecciona al menos una categoría
                    </p>
                  )}
                  {formData.categoryIds.length > 0 && (
                    <p className="text-xs text-[#03548C] mt-2 font-semibold">
                      {formData.categoryIds.length} categoría{formData.categoryIds.length !== 1 ? 's' : ''} seleccionada{formData.categoryIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </SectionCard>

            {/* Audience */}
            <SectionCard>
              <SectionHeader
                icon={<MapPin className="w-5 h-5" />}
                title="Audiencia objetivo"
                subtitle="Sin filtros, el anuncio llega a todos los usuarios del país"
              />
              <div className="space-y-5">
                {/* Age */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rango de edad</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" value={formData.targetAudience.ageRange[0]}
                      onChange={(e) => setFormData((p) => ({ ...p, targetAudience: { ...p.targetAudience, ageRange: [Number(e.target.value), p.targetAudience.ageRange[1]] } }))}
                      className="w-20 px-3 py-2 border-2 border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                      min={13} max={100} disabled={isSubmitting}
                    />
                    <span className="text-gray-400">a</span>
                    <input
                      type="number" value={formData.targetAudience.ageRange[1]}
                      onChange={(e) => setFormData((p) => ({ ...p, targetAudience: { ...p.targetAudience, ageRange: [p.targetAudience.ageRange[0], Number(e.target.value)] } }))}
                      className="w-20 px-3 py-2 border-2 border-gray-200 rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                      min={13} max={100} disabled={isSubmitting}
                    />
                    <span className="text-gray-500 text-sm">años</span>
                  </div>
                  {ageRangeInvalid && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      La edad mínima no puede ser mayor que la máxima
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Género</label>
                  <div className="flex gap-2">
                    {[{ v: 'ALL', l: 'Todos' }, { v: 'MALE', l: '♂ Masculino' }, { v: 'FEMALE', l: '♀ Femenino' }].map((g) => (
                      <button
                        key={g.v} type="button"
                        onClick={() => setFormData((p) => ({ ...p, targetAudience: { ...p.targetAudience, gender: g.v as any } }))}
                        disabled={isSubmitting}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                          ${formData.targetAudience.gender === g.v
                            ? 'border-[#03548C] bg-[#03548C]/10 text-[#03548C]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          } disabled:opacity-50`}
                      >
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                    Ubicaciones geográficas
                  </label>
                  <div className="space-y-2 mb-3">
                    <select
                      value={selectedDepartment || ''}
                      onChange={(e) => setSelectedDepartment(e.target.value || null)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                      disabled={loadingDepartments || isSubmitting}
                    >
                      <option value="">— Selecciona un departamento —</option>
                      {departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                    {selectedDepartment && (
                      <select
                        onChange={(e) => { if (e.target.value) { addMunicipality(e.target.value); e.target.value = ''; } }}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]/40"
                        disabled={loadingMunicipalities || isSubmitting}
                      >
                        <option value="">— Selecciona un municipio —</option>
                        {municipalities.map((m) => (
                          <option key={m.code} value={m.code} disabled={formData.targetAudience.municipalityCodes.includes(m.code)}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {selectedMunicipalitiesData.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMunicipalitiesData.map((m) => (
                        <span key={m.code} className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
                          📍 {m.name}, {m.departmentName}
                          <button type="button" onClick={() => removeMunicipality(m.code)} disabled={isSubmitting}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Sin filtro de ubicación → alcance nacional</p>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Error / creating state */}
            {uploadState.status === 'creating' && (
              <div className="flex items-center gap-3 bg-[#03548C]/5 border border-[#03548C]/20 rounded-xl px-5 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#03548C]" />
                <div>
                  <p className="text-sm font-bold text-[#0b1440]">Creando anuncio...</p>
                  <p className="text-xs text-[#03548C]/70">Esto puede tardar unos segundos</p>
                </div>
              </div>
            )}
            {uploadState.status === 'error' && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {uploadState.errorDetails && Object.keys(uploadState.errorDetails).length > 0 ? (
                    <ul className="space-y-1">
                      {Object.values(uploadState.errorDetails).map((msg, i) => (
                        <li key={i} className="text-sm font-semibold text-red-700">{msg}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm font-semibold text-red-700">{uploadState.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('file')}
                disabled={isSubmitting}
                className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm
                  hover:bg-gray-50 transition disabled:opacity-50 hover:bg-gray-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !pricingInfo || formData.pricePerLike < (pricingInfo?.minPricePerLike ?? 0) || ageRangeInvalid}
                className="flex-[2] py-3.5 bg-[#03548C] text-white rounded-xl font-bold text-sm
                  hover:bg-[#0b1440] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Creando anuncio...' : `Crear anuncio · ${formatCents(totalBudgetCents)}`}
              </button>
            </div>
          </>
        )}

      </form>
    </div>
  );
}