'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  RefreshCw,
  Target,
  Globe,
  DollarSign,
  User,
  Pencil,
  X,
  Save,
  FileImage,
  BarChart2,
  Eye,
  Upload,
  MessageSquare,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getBrandingRequestDetail,
  submitBrandingRequest,
  configureBranding,
  approveDesign,
  requestDesignChanges,
  postCommercialComment,
  getCommercialPreviewUrl,
  getUploadUrl,
  uploadFileToR2,
  confirmUpload,
  type BrandingRequestDetail as BrandingDetailData,
  type BrandingStatus,
  type BrandingConfigDto,
} from '@/services/BrandingRequestService';
import { CampaignTargetingSelector } from './CampaignTargetingSelector';
import { CommentsSection } from './CommentsSection';
import { useCampaignGoals } from '@/hooks/useCampaignGoals';

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

const CONFIG_EDITABLE_STATUSES: BrandingStatus[] = [
  'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'DESIGN_IN_PROGRESS', 'CHANGES_REQUESTED', 'PENDING_ADVERTISER_APPROVAL',
];

const UPLOAD_ALLOWED_STATUSES: BrandingStatus[] = [
  'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'DESIGN_IN_PROGRESS',
  'PENDING_ADVERTISER_APPROVAL', 'CHANGES_REQUESTED',
];

const COMMENTS_ALLOWED_STATUSES: BrandingStatus[] = [
  'APPROVED', 'DESIGN_IN_PROGRESS', 'PENDING_ADVERTISER_APPROVAL',
  'CHANGES_REQUESTED', 'LAUNCHED',
];

const PREVIEW_STATUSES: BrandingStatus[] = [
  'PENDING_ADVERTISER_APPROVAL', 'CHANGES_REQUESTED', 'LAUNCHED',
];

const STATUS_META: Record<
  BrandingStatus,
  { label: string; badge: string; bannerBg: string; bannerBorder: string; bannerTitle: string; bannerText: string; message: string }
> = {
  DRAFT:                       { label: 'Borrador',              badge: 'bg-gray-100 text-gray-700 border-gray-200',       bannerBg: 'bg-gray-50',   bannerBorder: 'border-gray-200',  bannerTitle: 'text-gray-800',  bannerText: 'text-gray-600',  message: 'Tu solicitud está en borrador. Puedes ajustar la configuración antes de enviarla al administrador.' },
  PENDING_REVIEW:              { label: 'En revisión',           badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', bannerBg: 'bg-amber-50',  bannerBorder: 'border-amber-200', bannerTitle: 'text-amber-900', bannerText: 'text-amber-700', message: 'Tu solicitud está siendo revisada por el equipo de administración.' },
  APPROVED:                    { label: 'Aprobada',              badge: 'bg-green-100 text-green-800 border-green-200',    bannerBg: 'bg-green-50',  bannerBorder: 'border-green-200', bannerTitle: 'text-green-900', bannerText: 'text-green-700', message: 'Tu solicitud fue aprobada. El diseñador trabajará en la integración de tu marca.' },
  REJECTED:                    { label: 'Rechazada',             badge: 'bg-red-100 text-red-800 border-red-200',          bannerBg: 'bg-red-50',    bannerBorder: 'border-red-200',   bannerTitle: 'text-red-900',   bannerText: 'text-red-700',   message: 'Tu solicitud fue rechazada por el administrador.' },
  DESIGN_IN_PROGRESS:          { label: 'En diseño',             badge: 'bg-blue-100 text-blue-800 border-blue-200',       bannerBg: 'bg-blue-50',   bannerBorder: 'border-blue-200',  bannerTitle: 'text-blue-900',  bannerText: 'text-blue-700',  message: 'El diseñador está integrando tu marca al juego.' },
  PENDING_ADVERTISER_APPROVAL: { label: 'Pendiente tu aprobación', badge: 'bg-purple-100 text-purple-800 border-purple-200', bannerBg: 'bg-purple-50', bannerBorder: 'border-purple-200', bannerTitle: 'text-purple-900', bannerText: 'text-purple-700', message: 'El diseñador ha completado la integración. Revisa el resultado y aprueba o solicita cambios.' },
  CHANGES_REQUESTED:           { label: 'Cambios solicitados',   badge: 'bg-orange-100 text-orange-800 border-orange-200', bannerBg: 'bg-orange-50', bannerBorder: 'border-orange-200', bannerTitle: 'text-orange-900', bannerText: 'text-orange-700', message: 'Solicitaste cambios al diseñador. Te notificaremos cuando estén listos.' },
  LAUNCHED:                    { label: 'Campaña activa',        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bannerBg: 'bg-emerald-50', bannerBorder: 'border-emerald-200', bannerTitle: 'text-emerald-900', bannerText: 'text-emerald-700', message: 'Aprobaste el diseño. Tu campaña de branding está activa y llegando a los jugadores.' },
  CANCELLED:                   { label: 'Cancelada',             badge: 'bg-gray-100 text-gray-500 border-gray-200',       bannerBg: 'bg-gray-50',   bannerBorder: 'border-gray-200',  bannerTitle: 'text-gray-700',  bannerText: 'text-gray-500',  message: 'Esta solicitud fue cancelada.' },
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'resumen' | 'recursos' | 'campaña' | 'comentarios';

const ALL_TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'resumen',     label: 'Resumen',      Icon: BarChart2 },
  { id: 'recursos',   label: 'Recursos',     Icon: FileImage },
  { id: 'campaña',    label: 'Campaña',      Icon: Settings },
  { id: 'comentarios', label: 'Comentarios', Icon: MessageSquare },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (cents: number | null): string => {
  if (cents === null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const genderLabel = (g: string | null): string =>
  !g || g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Hombres' : 'Mujeres';

const isoToLocal = (iso: string | null): string => iso ? iso.slice(0, 16) : '';

const fileSizeLabel = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Config form ──────────────────────────────────────────────────────────────

interface ConfigForm {
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  minAge: string;
  maxAge: string;
  maxSessionsPerUserPerDay: string;
  startDate: string;
  campaignGoal: string;
  categoryIds: number[];
  municipalityCodes: string[];
}

const detailToConfigForm = (d: BrandingDetailData): ConfigForm => ({
  targetGender: d.targetGender ?? 'ALL',
  minAge: d.minAge?.toString() ?? '',
  maxAge: d.maxAge?.toString() ?? '',
  maxSessionsPerUserPerDay: d.maxSessionsPerUserPerDay?.toString() ?? '',
  startDate: isoToLocal(d.startDate),
  campaignGoal: d.campaignGoal ?? '',
  categoryIds: d.categories.map(c => c.id),
  municipalityCodes: d.targetMunicipalities.map(m => m.code),
});

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-500 shrink-0 w-44">{label}</span>
    <span className="text-gray-900 font-medium min-w-0">{value ?? '—'}</span>
  </div>
);

const fieldCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  requestId: number;
  onBack: () => void;
}

export const BrandingRequestDetail: React.FC<Props> = ({ requestId, onBack }) => {
  const [detail, setDetail] = useState<BrandingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [editingConfig, setEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState<ConfigForm>({
    targetGender: 'ALL', minAge: '', maxAge: '', maxSessionsPerUserPerDay: '',
    startDate: '', campaignGoal: '', categoryIds: [], municipalityCodes: [],
  });
  const [saving, setSaving] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const { goals: campaignGoals } = useCampaignGoals();
  const [approvingDesign, setApprovingDesign] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const [sendingChanges, setSendingChanges] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const updateSlider = useCallback(() => {
    const bar = tabBarRef.current;
    if (!bar) return;
    const activeBtn = bar.querySelector<HTMLElement>('[data-active]');
    if (activeBtn) setSliderStyle({ left: activeBtn.offsetLeft - bar.scrollLeft, width: activeBtn.offsetWidth });
  }, []);

  useEffect(() => { updateSlider(); }, [activeTab, detail, updateSlider]);
  useEffect(() => {
    const bar = tabBarRef.current;
    if (!bar) return;
    bar.addEventListener('scroll', updateSlider, { passive: true });
    return () => bar.removeEventListener('scroll', updateSlider);
  }, [updateSlider]);


  const loadDetail = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const d = await getBrandingRequestDetail(requestId, signal);
      if (!signal?.aborted) { setDetail(d); setConfigForm(detailToConfigForm(d)); }
    } catch (err: any) {
      if (err?.name !== 'CanceledError' && !signal?.aborted)
        setError('No se pudo cargar el detalle de la solicitud');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadDetail(ctrl.signal);
    return () => ctrl.abort();
  }, [requestId]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detail) return;
    e.target.value = '';
    setUploading(true);
    try {
      const urlRes = await getUploadUrl(detail.id, { originalFileName: file.name, contentType: file.type, sizeBytes: file.size });
      await uploadFileToR2(urlRes.permission.uploadUrl, file);
      await confirmUpload(detail.id, urlRes.resourceId);
      toast.success(`${file.name} subido correctamente`);
      const updated = await getBrandingRequestDetail(detail.id);
      setDetail(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const dto: BrandingConfigDto = {};
      if (configForm.targetGender) dto.targetGender = configForm.targetGender;
      if (configForm.minAge) dto.minAge = Number(configForm.minAge);
      if (configForm.maxAge) dto.maxAge = Number(configForm.maxAge);
      if (configForm.maxSessionsPerUserPerDay) dto.maxSessionsPerUserPerDay = Number(configForm.maxSessionsPerUserPerDay);
      dto.startDate = configForm.startDate ? new Date(configForm.startDate).toISOString() : null;
      if (configForm.campaignGoal) dto.campaignGoal = configForm.campaignGoal;
      dto.categoryIds = configForm.categoryIds;
      dto.municipalityCodes = configForm.municipalityCodes;
      await configureBranding(detail.id, dto);
      toast.success('Configuración actualizada');
      setEditingConfig(false);
      const updated = await getBrandingRequestDetail(detail.id);
      setDetail(updated);
      setConfigForm(detailToConfigForm(updated));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingConfig(false);
    if (detail) setConfigForm(detailToConfigForm(detail));
  };

  const handleSubmit = async () => {
    if (!detail) return;
    setSubmitting(true);
    try {
      await submitBrandingRequest(detail.id, submitNote.trim() || undefined);
      toast.success('¡Solicitud enviada al equipo de revisión!');
      setSubmitNote('');
      const updated = await getBrandingRequestDetail(detail.id);
      setDetail(updated);
      setConfigForm(detailToConfigForm(updated));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!detail) return;
    setApprovingDesign(true);
    try {
      await approveDesign(detail.id);
      toast.success('¡Diseño aprobado! Tu campaña está lista para lanzarse.');
      const updated = await getBrandingRequestDetail(detail.id);
      setDetail(updated);
      setConfigForm(detailToConfigForm(updated));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al aprobar el diseño');
    } finally {
      setApprovingDesign(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!detail || !changesNote.trim()) return;
    setSendingChanges(true);
    try {
      await requestDesignChanges(detail.id);
      await postCommercialComment(detail.id, changesNote.trim());
      toast.success('Cambios solicitados. El diseñador recibirá tu feedback.');
      setShowChangesModal(false);
      setChangesNote('');
      const updated = await getBrandingRequestDetail(detail.id);
      setDetail(updated);
      setConfigForm(detailToConfigForm(updated));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al solicitar cambios');
    } finally {
      setSendingChanges(false);
    }
  };

  const handlePreview = async () => {
    if (!detail) return;
    setPreviewLoading(true);
    try {
      const url = await getCommercialPreviewUrl(detail.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.response?.status === 400 ? 'El diseñador aún no ha entregado el diseño' : 'No se pudo obtener la URL de preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
          <ChevronLeft size={18} /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button onClick={() => loadDetail()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm cursor-pointer hover:bg-red-700 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[detail.status];
  const canEditConfig = CONFIG_EDITABLE_STATUSES.includes(detail.status);
  const canPreview = PREVIEW_STATUSES.includes(detail.status);
  const canComment = COMMENTS_ALLOWED_STATUSES.includes(detail.status);
  const visibleTabs = canComment ? ALL_TABS : ALL_TABS.filter(t => t.id !== 'comentarios');

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{detail.brandName}</h2>
            <span className="text-gray-400 text-sm shrink-0">#{detail.id}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Actualizado {formatDateTime(detail.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${meta.badge}`}>
            {meta.label}
          </span>
          <div className="relative group">
            <button type="button" className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer ${meta.badge}`}>
              ?
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 space-y-1">
              <p className="font-semibold">{meta.label}</p>
              <p className="text-gray-300 leading-relaxed">{meta.message}</p>
              {detail.status === 'REJECTED' && detail.adminNotes && (
                <p className="text-red-300 mt-1">Motivo: {detail.adminNotes}</p>
              )}
            </div>
          </div>
        </div>
        {canPreview && detail.status !== 'PENDING_ADVERTISER_APPROVAL' && (
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Ver diseño
          </button>
        )}
        <button onClick={() => loadDetail()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0" title="Actualizar">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

{/* ── Submit (DRAFT) ── */}
      {detail.status === 'DRAFT' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div>
            <p className="font-semibold text-blue-900 text-sm">Enviar al equipo de revisión</p>
            <p className="text-xs text-blue-700 mt-0.5">Opcional: añade un mensaje para el diseñador.</p>
          </div>
          <textarea
            value={submitNote}
            onChange={e => setSubmitNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej: Logo actualizado, ya está listo para revisión..."
            className="w-full px-3 py-2 border border-blue-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Enviar solicitud
            </button>
          </div>
        </div>
      )}

      {/* ── Design Review Actions ── */}
      {detail.status === 'PENDING_ADVERTISER_APPROVAL' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="font-semibold text-purple-900 text-sm">El diseñador completó la integración de tu marca</p>
            <p className="text-xs text-purple-700 mt-0.5">Prueba el juego antes de aprobar o solicitar cambios.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
              Ver diseño
            </button>
            <button
              onClick={() => setShowChangesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
            >
              Solicitar cambios
            </button>
            <button
              onClick={handleApproveDesign}
              disabled={approvingDesign}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {approvingDesign && <Loader2 size={14} className="animate-spin" />}
              Aprobar diseño
            </button>
          </div>
        </div>
      )}

      {/* ── Main Card with Tabs ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="relative border-b border-gray-100">
          <div
            className="absolute bottom-0 h-0.5 bg-blue-600 transition-[left,width] duration-200 ease-out pointer-events-none z-10"
            style={{ left: sliderStyle.left, width: sliderStyle.width }}
          />
          <div ref={tabBarRef} className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleTabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-active={active || undefined}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium shrink-0 transition-colors ${
                    active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab: Resumen ── */}
        {activeTab === 'resumen' && (
          <div className="p-5 space-y-5">
            {/* Game + Brand */}
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
                <img
                  src={detail.gameFrontPageUrl}
                  alt={detail.gameName}
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Juego seleccionado</p>
                <p className="font-semibold text-gray-900">{detail.gameName}</p>
                <p className="text-xs text-gray-400 mt-0.5">Creado {formatDate(detail.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <InfoRow label="Nombre de marca" value={detail.brandName} />
              <InfoRow
                label="Descripción"
                value={<span className="whitespace-pre-wrap text-sm leading-relaxed">{detail.brandDescription}</span>}
              />
              {detail.targetUrl && (
                <InfoRow
                  label="URL de destino"
                  value={
                    <a href={detail.targetUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline break-all">
                      <Globe size={13} className="shrink-0" />{detail.targetUrl}
                    </a>
                  }
                />
              )}
              <InfoRow
                label="Presupuesto total"
                value={<span className="flex items-center gap-1 text-green-700"><DollarSign size={13} />{formatCOP(detail.budgetCents)}</span>}
              />
            </div>

            {/* Estimaciones */}
            {detail.estimatedSessions != null && (
              <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 uppercase tracking-wide">
                  <BarChart2 size={12} className="text-gray-400" /> Estimación al momento de creación
                </p>
                <div className="space-y-1.5">
                  <InfoRow label="Sesiones estimadas" value={`~${detail.estimatedSessions.toLocaleString('es-CO')} sesiones`} />
                  {detail.averageRewardPerSessionCents != null && (
                    <InfoRow label="Costo por sesión" value={formatCOP(detail.averageRewardPerSessionCents)} />
                  )}
                  {detail.scoreRewardFactor != null && (
                    <InfoRow label="Factor de puntaje" value={`×${detail.scoreRewardFactor}`} />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">Estimación orientativa sujeta a la participación real.</p>
              </div>
            )}

            {/* Equipo */}
            {(detail.assignedDesignerName || detail.reviewedByAdminName || (detail.adminNotes && detail.status !== 'REJECTED')) && (
              <div className="border-t border-gray-100 pt-5 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Equipo</p>
                {detail.assignedDesignerName && (
                  <InfoRow
                    label="Diseñador asignado"
                    value={
                      <span className="flex items-center gap-1.5">
                        <User size={14} className="text-gray-400 shrink-0" />
                        {detail.assignedDesignerName}
                        {detail.assignedDesignerCode && <span className="text-xs text-gray-500">({detail.assignedDesignerCode})</span>}
                      </span>
                    }
                  />
                )}
                {detail.reviewedByAdminName && (
                  <InfoRow
                    label="Revisado por"
                    value={<span className="flex items-center gap-1.5"><User size={14} className="text-gray-400 shrink-0" />{detail.reviewedByAdminName}</span>}
                  />
                )}
                {detail.adminNotes && detail.status !== 'REJECTED' && (
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                    <p className="text-xs text-amber-800"><strong className="block mb-0.5">Nota del administrador</strong>{detail.adminNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Recursos ── */}
        {activeTab === 'recursos' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {detail.corporateResources.length === 0 ? 'Sin archivos subidos' : `${detail.corporateResources.length} archivo(s)`}
              </p>
              {UPLOAD_ALLOWED_STATUSES.includes(detail.status) && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUploadFile} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'Subiendo…' : 'Subir archivo'}
                  </button>
                </>
              )}
            </div>

            {detail.corporateResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileImage size={40} className="mb-3 text-gray-300" />
                <p className="text-sm">No hay recursos subidos aún</p>
                {UPLOAD_ALLOWED_STATUSES.includes(detail.status) && (
                  <p className="text-xs mt-1 text-gray-400">Usa el botón de arriba para agregar archivos</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {detail.corporateResources.map(res => (
                  <div key={res.id}>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {res.status === 'VALIDATED' && res.temporalUrl && !imgErrors.has(res.id) ? (
                        <img
                          src={res.temporalUrl}
                          alt={res.originalFileName}
                          className="w-full h-full object-contain"
                          onError={() => setImgErrors(prev => new Set([...prev, res.id]))}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileImage size={28} className="text-gray-300" />
                        </div>
                      )}
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        res.status === 'VALIDATED' ? 'bg-green-600 text-white' : res.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-gray-400 text-white'
                      }`}>
                        {res.status === 'VALIDATED' ? 'OK' : res.status === 'PENDING' ? '…' : 'X'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{res.originalFileName}</p>
                    <p className="text-[10px] text-gray-400">{fileSizeLabel(res.sizeBytes)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Campaña ── */}
        {activeTab === 'campaña' && (
          <div className="p-5 space-y-4">
            {/* Warnings */}
{canEditConfig && !detail.hasCompleteTargeting && (
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <Target size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Segmentación incompleta</p>
                  <p className="text-xs text-amber-700 mt-0.5">Define los campos de segmentación para llegar a la audiencia adecuada.</p>
                </div>
              </div>
            )}

            {/* Config edit / view */}
            {editingConfig ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo de campaña</label>
                    <select value={configForm.campaignGoal} onChange={e => setConfigForm(f => ({ ...f, campaignGoal: e.target.value }))} className={fieldCls}>
                      <option value="">Sin objetivo definido</option>
                      {campaignGoals.map(g => <option key={g} value={g}>{GOAL_LABELS[g] ?? g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Género objetivo</label>
                    <select value={configForm.targetGender} onChange={e => setConfigForm(f => ({ ...f, targetGender: e.target.value as 'ALL' | 'MALE' | 'FEMALE' }))} className={fieldCls}>
                      <option value="ALL">Todos</option>
                      <option value="MALE">Hombres</option>
                      <option value="FEMALE">Mujeres</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sesiones máx / usuario / día</label>
                    <input type="number" min={1} value={configForm.maxSessionsPerUserPerDay} onChange={e => setConfigForm(f => ({ ...f, maxSessionsPerUserPerDay: e.target.value }))} placeholder="Ej: 3" className={fieldCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima</label>
                    <input type="number" min={13} max={100} value={configForm.minAge} onChange={e => setConfigForm(f => ({ ...f, minAge: e.target.value }))} placeholder="13" className={fieldCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edad máxima</label>
                    <input type="number" min={13} max={100} value={configForm.maxAge} onChange={e => setConfigForm(f => ({ ...f, maxAge: e.target.value }))} placeholder="100" className={fieldCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                    <input type="datetime-local" value={configForm.startDate} onChange={e => setConfigForm(f => ({ ...f, startDate: e.target.value }))} className={fieldCls} />
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <CampaignTargetingSelector
                    selectedCategoryIds={configForm.categoryIds}
                    selectedMunicipalityCodes={configForm.municipalityCodes}
                    onChangeCategoryIds={ids => setConfigForm(f => ({ ...f, categoryIds: ids }))}
                    onChangeMunicipalityCodes={codes => setConfigForm(f => ({ ...f, municipalityCodes: codes }))}
                    preloadedMunicipalities={detail.targetMunicipalities}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    <X size={14} /> Cancelar
                  </button>
                  <button onClick={handleSaveConfig} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Configuración actual</p>
                  {canEditConfig && (
                    <button onClick={() => setEditingConfig(true)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
                      <Pencil size={13} /> Editar
                    </button>
                  )}
                </div>
                {detail.campaignGoal != null && (
                  <InfoRow label="Objetivo" value={GOAL_LABELS[detail.campaignGoal] ?? detail.campaignGoal} />
                )}
                <InfoRow label="Género objetivo" value={genderLabel(detail.targetGender)} />
                <InfoRow
                  label="Edad objetivo"
                  value={detail.minAge || detail.maxAge ? `${detail.minAge ?? '—'} – ${detail.maxAge ?? '—'} años` : '—'}
                />
                <InfoRow label="Sesiones máx / día" value={detail.maxSessionsPerUserPerDay ?? '—'} />
                <InfoRow label="Fecha de inicio" value={formatDate(detail.startDate)} />
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
            )}
          </div>
        )}

        {/* ── Tab: Comentarios ── */}
        {activeTab === 'comentarios' && canComment && (
          <div className="p-5">
            <CommentsSection requestId={detail.id} />
          </div>
        )}
      </div>

      {/* ── Modal: Request Changes ── */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Solicitar cambios al diseñador</h2>
              <button onClick={() => { setShowChangesModal(false); setChangesNote(''); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe los cambios que necesitas <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={changesNote}
                  onChange={e => setChangesNote(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Ej: Ajusta los colores del logo a rojo y blanco..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <span className="text-xs text-gray-400 float-right">{changesNote.length}/1000</span>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowChangesModal(false); setChangesNote(''); }} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={sendingChanges || !changesNote.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sendingChanges && <Loader2 size={14} className="animate-spin" />}
                  Enviar feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
