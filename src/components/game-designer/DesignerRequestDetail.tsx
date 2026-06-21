'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft, Loader2, RefreshCw, Save, Send, Globe, FileImage,
  BookOpen, Package, Gamepad2, Download, Archive,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import JSZip from 'jszip';
import {
  getDesignerRequestDetail,
  saveGameConfig,
  saveDesignerNotes,
  submitDesign,
  type DesignerBrandingDetail,
} from '@/services/GameDesignerService';
import type { BrandingStatus } from '@/services/BrandingRequestService';

// ─── RJSF widgets ────────────────────────────────────────────────────────────
import TextInputWidget from './rjsf/widgets/TextInputWidget';
import NumberInputWidget from './rjsf/widgets/NumberInputWidget';
import ColorPickerWidget from './rjsf/widgets/ColorPickerWidget';
import CheckboxWidget from './rjsf/widgets/CheckboxWidget';
import RadioWidget from './rjsf/widgets/RadioWidget';
import RangeWidget from './rjsf/widgets/RangeWidget';
import DecimalInputWidget from './rjsf/widgets/DecimalInputWidget';
import AssetWidget from './rjsf/widgets/AssetWidget';
import ImagePreviewWidget from './rjsf/widgets/ImagePreviewWidget';

// ─── RJSF templates ──────────────────────────────────────────────────────────
import FieldTemplate from './rjsf/templates/FieldTemplate';
import ObjectFieldTemplate from './rjsf/templates/ObjectFieldTemplate';
import ArrayFieldTemplate from './rjsf/templates/ArrayFieldTemplate';

const rjsfWidgets = {
  textInput: TextInputWidget,
  numberInput: NumberInputWidget,
  colorPicker: ColorPickerWidget,
  imagePreview: ImagePreviewWidget,
  checkbox: CheckboxWidget,
  radio: RadioWidget,
  range: RangeWidget,
  decimalInput: DecimalInputWidget,
  assetUpload: AssetWidget,
  switch: CheckboxWidget,
  slider: RangeWidget,
  color: ColorPickerWidget,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Partial<Record<BrandingStatus, { label: string; cls: string }>> = {
  APPROVED: { label: 'Listo para iniciar', cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  DESIGN_IN_PROGRESS: { label: 'En progreso', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  CHANGES_REQUESTED: { label: 'Cambios solicitados', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  PENDING_ADVERTISER_APPROVAL: { label: 'En revisión del anunciante', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  READY_TO_LAUNCH: { label: 'Aprobado ✓', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  LAUNCHED: { label: 'Activa', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

type Tab = 'brief' | 'resources' | 'config';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'brief', label: 'Brief de marca', icon: BookOpen },
  { id: 'resources', label: 'Recursos corporativos', icon: Package },
  { id: 'config', label: 'Configuración del juego', icon: Gamepad2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (cents: number | null) => {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
};

const genderLabel = (g: string | null) =>
  !g || g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Hombres' : 'Mujeres';

const fileSizeLabel = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-500 shrink-0 w-44">{label}</span>
    <span className="text-gray-900 font-medium min-w-0">{value ?? '—'}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  requestId: number;
  onBack: () => void;
}

export const DesignerRequestDetail: React.FC<Props> = ({ requestId, onBack }) => {
  const [detail, setDetail] = useState<DesignerBrandingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('brief');

  const [gameConfig, setGameConfig] = useState<Record<string, unknown>>({});
  const [configSaving, setConfigSaving] = useState(false);

  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [zipping, setZipping] = useState(false);

  const loadDetail = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const d = await getDesignerRequestDetail(requestId, signal);
      if (!signal?.aborted) {
        setDetail(d);
        setGameConfig(d.gameConfig ?? {});
        setNotes(d.designerNotes ?? '');
      }
    } catch (err: any) {
      if (err?.name !== 'CanceledError' && !signal?.aborted)
        setError('No se pudo cargar el detalle');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadDetail(ctrl.signal);
    return () => ctrl.abort();
  }, [requestId]);

  const handleConfigSubmit = async ({ formData }: { formData?: Record<string, unknown> }) => {
    if (!detail || !formData) return;
    setConfigSaving(true);
    try {
      await saveGameConfig(detail.id, formData);
      toast.success('Configuración guardada');
      setGameConfig(formData);
      // reload to pick up possible status change APPROVED → DESIGN_IN_PROGRESS
      const updated = await getDesignerRequestDetail(detail.id);
      setDetail(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!detail) return;
    setNotesSaving(true);
    try {
      await saveDesignerNotes(detail.id, notes);
      toast.success('Notas guardadas');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar las notas');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSubmitDesign = async () => {
    if (!detail) return;
    setSubmitting(true);
    try {
      await submitDesign(detail.id);
      toast.success('Diseño enviado al anunciante para revisión');
      setShowSubmitConfirm(false);
      const updated = await getDesignerRequestDetail(detail.id);
      setDetail(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar el diseño');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!detail) return;
    const validated = detail.corporateResources.filter(r => r.status === 'VALIDATED' && r.temporalUrl);
    if (validated.length === 0) {
      toast.error('No hay recursos disponibles para descargar');
      return;
    }

    setZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('recursos') ?? zip;

      await Promise.all(
        validated.map(async (res) => {
          const response = await fetch(res.temporalUrl!);
          if (!response.ok) throw new Error(`Error descargando ${res.originalFileName}`);
          const blob = await response.blob();
          folder.file(res.originalFileName, blob);
        })
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recursos-${detail.brandName.toLowerCase().replace(/\s+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${validated.length} archivos descargados`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar el ZIP');
    } finally {
      setZipping(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
          <ChevronLeft size={18} /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button onClick={() => loadDetail()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm cursor-pointer">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_LABEL[detail.status];
  const canSubmit = ['DESIGN_IN_PROGRESS', 'CHANGES_REQUESTED'].includes(detail.status);
  const hasConfig = Object.keys(gameConfig).length > 0;
  const isChangesRequested = detail.status === 'CHANGES_REQUESTED';
  const validatedResources = detail.corporateResources.filter(r => r.status === 'VALIDATED');

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0 mt-0.5">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{detail.brandName}</h2>
            <span className="text-gray-400 text-sm shrink-0">#{detail.id}</span>
            {statusMeta && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{detail.commercialName}</p>
        </div>
        <button onClick={() => loadDetail()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0" title="Actualizar">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* ── Feedback banner (CHANGES_REQUESTED) — always visible ── */}
      {isChangesRequested && detail.designerNotes && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-900 mb-1">Feedback del anunciante</p>
          <p className="text-sm text-orange-800 whitespace-pre-wrap">{detail.designerNotes}</p>
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                  active
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.id === 'resources' && validatedResources.length > 0 && (
                  <span className="ml-1 text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {validatedResources.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Brief de marca ── */}
        {activeTab === 'brief' && (
          <div className="p-5 space-y-4">
            <div className="space-y-2.5">
              <InfoRow label="Empresa" value={detail.commercialName} />
              <InfoRow label="Nombre de marca" value={detail.brandName} />
              <InfoRow label="Descripción" value={
                <span className="whitespace-pre-wrap text-sm leading-relaxed">{detail.brandDescription}</span>
              } />
              {detail.targetUrl && (
                <InfoRow label="URL de destino" value={
                  <a href={detail.targetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline break-all">
                    <Globe size={13} className="shrink-0" />{detail.targetUrl}
                  </a>
                } />
              )}
              {detail.campaignGoal && (
                <InfoRow label="Objetivo" value={GOAL_LABELS[detail.campaignGoal] ?? detail.campaignGoal} />
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Segmentación</p>
              <InfoRow label="Género" value={genderLabel(detail.targetGender)} />
              {(detail.minAge || detail.maxAge) && (
                <InfoRow label="Edad" value={`${detail.minAge ?? '—'} – ${detail.maxAge ?? '—'} años`} />
              )}
              {detail.categories.length > 0 && (
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-500 shrink-0 w-44">Categorías</span>
                  <div className="flex flex-wrap gap-1">
                    {detail.categories.map(c => (
                      <span key={c.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {detail.targetMunicipalities.length > 0 && (
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-500 shrink-0 w-44">Municipios</span>
                  <div className="flex flex-wrap gap-1">
                    {detail.targetMunicipalities.map(m => (
                      <span key={m.code} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">{m.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(detail.completionRewardCents != null || detail.maxRewardPerSessionCents != null) && (
              <div className="pt-4 border-t border-gray-100 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recompensas de referencia</p>
                {detail.completionRewardCents != null && (
                  <InfoRow label="Recomp. por sesión" value={formatCOP(detail.completionRewardCents)} />
                )}
                {detail.maxRewardPerSessionCents != null && (
                  <InfoRow label="Máx por sesión" value={formatCOP(detail.maxRewardPerSessionCents)} />
                )}
              </div>
            )}

            {detail.adminNotes && (
              <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <p className="text-xs text-amber-800">
                  <strong className="block mb-0.5">Nota del administrador</strong>
                  {detail.adminNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Recursos corporativos ── */}
        {activeTab === 'resources' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {validatedResources.length === 0
                  ? 'No hay recursos validados'
                  : `${validatedResources.length} recurso${validatedResources.length !== 1 ? 's' : ''} validado${validatedResources.length !== 1 ? 's' : ''}`}
              </p>
              {validatedResources.length > 0 && (
                <button
                  onClick={handleDownloadZip}
                  disabled={zipping}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {zipping ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Archive size={14} />
                  )}
                  {zipping ? 'Generando ZIP...' : 'Descargar ZIP'}
                </button>
              )}
            </div>

            {validatedResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Package size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No hay recursos corporativos validados aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {validatedResources.map(res => (
                  <div key={res.id} className="group">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {res.temporalUrl && !imgErrors.has(res.id) ? (
                        <>
                          <img
                            src={res.temporalUrl}
                            alt={res.originalFileName}
                            className="w-full h-full object-contain"
                            onError={() => setImgErrors(prev => new Set([...prev, res.id]))}
                          />
                          <a
                            href={res.temporalUrl}
                            download={res.originalFileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Descargar"
                          >
                            <Download size={22} className="text-white" />
                          </a>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileImage size={28} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{res.originalFileName}</p>
                    <p className="text-[10px] text-gray-400">{fileSizeLabel(res.sizeBytes)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Configuración del juego ── */}
        {activeTab === 'config' && (
          <div className="p-5 space-y-5">
            {/* RJSF form */}
            {!detail.gameSchema ? (
              <div className="py-8 text-center">
                <Gamepad2 size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">El esquema de configuración no está disponible para esta campaña.</p>
              </div>
            ) : (
              <div className="rjsf-wrapper">
                <Form
                  schema={detail.gameSchema.jsonSchema as any}
                  uiSchema={detail.gameSchema.uiSchema as any}
                  formData={gameConfig}
                  validator={validator}
                  widgets={rjsfWidgets}
                  templates={{
                    FieldTemplate,
                    ObjectFieldTemplate,
                    ArrayFieldTemplate,
                  }}
                  onChange={({ formData }) => setGameConfig(formData ?? {})}
                  onSubmit={handleConfigSubmit}
                  onError={() => toast.error('Revisa los campos del formulario')}
                >
                  <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                    <button
                      type="submit"
                      disabled={configSaving}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {configSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Guardar configuración
                    </button>
                  </div>
                </Form>
              </div>
            )}

            {/* Notas para el anunciante */}
            <div className="pt-5 border-t border-gray-100 space-y-2">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide text-xs">Notas para el anunciante</p>
              {isChangesRequested && (
                <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                  El feedback del anunciante aparece en el banner de arriba. Usa este campo para responder o dejar notas adicionales.
                </p>
              )}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Instrucciones para el anunciante, comentarios sobre la integración..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{notes.length}/1000</span>
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {notesSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Guardar notas
                </button>
              </div>
            </div>

            {/* Enviar para revisión */}
            {canSubmit && (
              <div className="pt-5 border-t border-gray-100">
                {!showSubmitConfirm ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">¿Listo para enviar al anunciante?</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        El anunciante revisará tu diseño y podrá aprobarlo o solicitar cambios.
                      </p>
                      {!hasConfig && (
                        <p className="text-xs text-amber-600 mt-1">
                          Debes guardar la configuración del juego antes de enviar.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      disabled={!hasConfig}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    >
                      <Send size={15} />
                      Enviar para revisión
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-gray-900">¿Confirmas el envío al anunciante?</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setShowSubmitConfirm(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSubmitDesign}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Confirmar envío
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
