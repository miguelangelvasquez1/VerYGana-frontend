'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  Target,
  Globe,
  DollarSign,
  User,
  Pencil,
  X,
  Save,
  FileImage,
  BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getBrandingRequestDetail,
  getCampaignGoals,
  configureBranding,
  approveDesign,
  requestDesignChanges,
  type BrandingRequestDetail as BrandingDetailData,
  type BrandingStatus,
  type BrandingConfigDto,
} from '@/services/BrandingRequestService';
import { CampaignTargetingSelector } from './CampaignTargetingSelector';

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIG_EDITABLE_STATUSES: BrandingStatus[] = [
  'DRAFT',
  'APPROVED',
  'DESIGN_IN_PROGRESS',
  'CHANGES_REQUESTED',
];

const STATUS_META: Record<
  BrandingStatus,
  {
    label: string;
    badge: string;
    bannerBg: string;
    bannerBorder: string;
    bannerTitle: string;
    bannerText: string;
    message: string;
  }
> = {
  DRAFT: {
    label: 'Borrador',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    bannerBg: 'bg-gray-50', bannerBorder: 'border-gray-200',
    bannerTitle: 'text-gray-800', bannerText: 'text-gray-600',
    message: 'Tu solicitud está en borrador. Puedes ajustar la configuración antes de enviarla al administrador.',
  },
  PENDING_REVIEW: {
    label: 'En revisión',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bannerBg: 'bg-amber-50', bannerBorder: 'border-amber-200',
    bannerTitle: 'text-amber-900', bannerText: 'text-amber-700',
    message: 'Tu solicitud está siendo revisada por el equipo de administración.',
  },
  APPROVED: {
    label: 'Aprobada',
    badge: 'bg-green-100 text-green-800 border-green-200',
    bannerBg: 'bg-green-50', bannerBorder: 'border-green-200',
    bannerTitle: 'text-green-900', bannerText: 'text-green-700',
    message: 'Tu solicitud fue aprobada. Puedes continuar ajustando la configuración de campaña mientras el diseñador trabaja en la integración.',
  },
  REJECTED: {
    label: 'Rechazada',
    badge: 'bg-red-100 text-red-800 border-red-200',
    bannerBg: 'bg-red-50', bannerBorder: 'border-red-200',
    bannerTitle: 'text-red-900', bannerText: 'text-red-700',
    message: 'Tu solicitud fue rechazada por el administrador.',
  },
  DESIGN_IN_PROGRESS: {
    label: 'En diseño',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    bannerBg: 'bg-blue-50', bannerBorder: 'border-blue-200',
    bannerTitle: 'text-blue-900', bannerText: 'text-blue-700',
    message: 'El diseñador está integrando tu marca al juego. Aún puedes ajustar la configuración de campaña.',
  },
  PENDING_ADVERTISER_APPROVAL: {
    label: 'Pendiente tu aprobación',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    bannerBg: 'bg-purple-50', bannerBorder: 'border-purple-200',
    bannerTitle: 'text-purple-900', bannerText: 'text-purple-700',
    message: 'El diseñador ha completado la integración. Comunícate con el equipo de soporte para revisar y aprobar el resultado.',
  },
  CHANGES_REQUESTED: {
    label: 'Cambios solicitados',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    bannerBg: 'bg-orange-50', bannerBorder: 'border-orange-200',
    bannerTitle: 'text-orange-900', bannerText: 'text-orange-700',
    message: 'El diseñador ha solicitado cambios en la configuración de campaña.',
  },
  READY_TO_LAUNCH: {
    label: 'Listo para lanzar',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    bannerBg: 'bg-teal-50', bannerBorder: 'border-teal-200',
    bannerTitle: 'text-teal-900', bannerText: 'text-teal-700',
    message: 'Todo está listo. Tu campaña comenzará en la fecha de inicio configurada.',
  },
  LAUNCHED: {
    label: 'Activa',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bannerBg: 'bg-emerald-50', bannerBorder: 'border-emerald-200',
    bannerTitle: 'text-emerald-900', bannerText: 'text-emerald-700',
    message: 'Tu campaña de branding está activa y llegando a los jugadores.',
  },
  CANCELLED: {
    label: 'Cancelada',
    badge: 'bg-gray-100 text-gray-500 border-gray-200',
    bannerBg: 'bg-gray-50', bannerBorder: 'border-gray-200',
    bannerTitle: 'text-gray-700', bannerText: 'text-gray-500',
    message: 'Esta solicitud fue cancelada.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (cents: number | null): string => {
  if (cents === null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const genderLabel = (g: string | null): string =>
  !g || g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Hombres' : 'Mujeres';

const isoToLocal = (iso: string | null): string =>
  iso ? iso.slice(0, 16) : '';

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
    <span className="text-gray-500 shrink-0 w-40">{label}</span>
    <span className="text-gray-900 font-medium min-w-0">{value ?? '—'}</span>
  </div>
);

const SectionCard: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, action, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const fieldCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  requestId: number;
  onBack: () => void;
}

export const BrandingRequestDetail: React.FC<Props> = ({ requestId, onBack }) => {
  const [detail, setDetail] = useState<BrandingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState<ConfigForm>({
    targetGender: 'ALL',
    minAge: '',
    maxAge: '',
    maxSessionsPerUserPerDay: '',
    startDate: '',
    campaignGoal: '',
    categoryIds: [],
    municipalityCodes: [],
  });
  const [saving, setSaving] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [campaignGoals, setCampaignGoals] = useState<string[]>([]);
  const [approvingDesign, setApprovingDesign] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const [sendingChanges, setSendingChanges] = useState(false);

  useEffect(() => {
    getCampaignGoals()
      .then(setCampaignGoals)
      .catch(() => {});
  }, []);

  const loadDetail = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const d = await getBrandingRequestDetail(requestId, signal);
      if (!signal?.aborted) {
        setDetail(d);
        setConfigForm(detailToConfigForm(d));
      }
    } catch (err: any) {
      if (err?.name !== 'CanceledError' && !signal?.aborted) {
        setError('No se pudo cargar el detalle de la solicitud');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadDetail(ctrl.signal);
    return () => ctrl.abort();
  }, [requestId]);

  const handleSaveConfig = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const dto: BrandingConfigDto = {};
      if (configForm.targetGender) dto.targetGender = configForm.targetGender;
      if (configForm.minAge) dto.minAge = Number(configForm.minAge);
      if (configForm.maxAge) dto.maxAge = Number(configForm.maxAge);
      if (configForm.maxSessionsPerUserPerDay)
        dto.maxSessionsPerUserPerDay = Number(configForm.maxSessionsPerUserPerDay);
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
      await requestDesignChanges(detail.id, changesNote.trim());
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

  // ── Loading / Error ────────────────────────────────────────────────────────

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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
        >
          <ChevronLeft size={18} /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => loadDetail()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm cursor-pointer hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[detail.status];
  const canEditConfig = CONFIG_EDITABLE_STATUSES.includes(detail.status);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{detail.brandName}</h2>
            <span className="text-gray-400 text-sm shrink-0">#{detail.id}</span>
          </div>
          <p className="text-sm text-gray-500">Actualizado {formatDateTime(detail.updatedAt)}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${meta.badge}`}>
          {meta.label}
        </span>
        <button
          onClick={() => loadDetail()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          title="Actualizar"
        >
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* ── Status Banner ── */}
      <div className={`rounded-xl border p-4 ${meta.bannerBg} ${meta.bannerBorder}`}>
        <p className={`font-semibold text-sm ${meta.bannerTitle}`}>{meta.label}</p>
        <p className={`text-sm mt-0.5 ${meta.bannerText}`}>{meta.message}</p>
        {detail.status === 'REJECTED' && detail.adminNotes && (
          <p className={`text-sm mt-2 font-medium ${meta.bannerTitle}`}>
            Motivo: {detail.adminNotes}
          </p>
        )}
        {detail.status === 'CHANGES_REQUESTED' && detail.designerNotes && (
          <p className={`text-sm mt-2 font-medium ${meta.bannerTitle}`}>
            Nota del diseñador: {detail.designerNotes}
          </p>
        )}
      </div>

      {/* ── Design Review Actions ── */}
      {detail.status === 'PENDING_ADVERTISER_APPROVAL' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="font-semibold text-purple-900 text-sm">El diseñador ha completado la integración de tu marca</p>
            <p className="text-xs text-purple-700 mt-0.5">
              Revisa el resultado y aprueba el diseño o solicita cambios al diseñador.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
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

      {/* ── Incomplete Warnings ── */}
      {canEditConfig && !detail.hasCompleteRewardConfig && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Configuración de recompensas incompleta</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Configura la recompensa por sesión para que los jugadores puedan ganar puntos por ver tu marca.
            </p>
          </div>
        </div>
      )}
      {canEditConfig && !detail.hasCompleteTargeting && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Target size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Segmentación incompleta</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Puedes definir género, edad y municipios objetivo para llegar a la audiencia adecuada.
            </p>
          </div>
        </div>
      )}

      {/* ── Brand & Game ── */}
      <SectionCard title="Marca y juego">
        <div className="flex gap-4 mb-5">
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
            <img
              src={detail.gameFrontPageUrl}
              alt={detail.gameName}
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Juego seleccionado</p>
            <p className="font-semibold text-gray-900">{detail.gameName}</p>
            <p className="text-xs text-gray-500 mt-1">Creado {formatDate(detail.createdAt)}</p>
          </div>
        </div>
        <div className="space-y-2.5">
          <InfoRow label="Nombre de marca" value={detail.brandName} />
          <InfoRow
            label="Descripción"
            value={
              <span className="whitespace-pre-wrap text-sm leading-relaxed">
                {detail.brandDescription}
              </span>
            }
          />
          {detail.targetUrl && (
            <InfoRow
              label="URL de destino"
              value={
                <a
                  href={detail.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline break-all"
                >
                  <Globe size={13} className="shrink-0" />
                  {detail.targetUrl}
                </a>
              }
            />
          )}
          <InfoRow
            label="Presupuesto total"
            value={
              <span className="flex items-center gap-1 text-green-700">
                <DollarSign size={13} className="shrink-0" />
                {formatCOP(detail.budgetCents)}
              </span>
            }
          />
        </div>

        {detail.estimatedSessions != null && (
          <div className="mt-4 p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 uppercase tracking-wide">
              <BarChart2 size={12} className="text-gray-400" />
              Estimación al momento de creación
            </p>
            <div className="space-y-1.5 text-sm">
              <InfoRow
                label="Sesiones estimadas"
                value={`~${detail.estimatedSessions.toLocaleString('es-CO')} sesiones`}
              />
              {detail.averageRewardPerSessionCents != null && (
                <InfoRow
                  label="Costo por sesión"
                  value={formatCOP(detail.averageRewardPerSessionCents)}
                />
              )}
              {detail.scoreRewardFactor != null && (
                <InfoRow
                  label="Factor de puntaje"
                  value={`×${detail.scoreRewardFactor}`}
                />
              )}
            </div>
            <p className="text-[11px] text-gray-400 leading-snug">
              Estimación orientativa sujeta a la participación real de usuarios.
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── Corporate Resources ── */}
      <SectionCard title={`Recursos corporativos (${detail.corporateResources.length})`}>
        {detail.corporateResources.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay recursos subidos.</p>
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
                      onError={() =>
                        setImgErrors(prev => new Set([...prev, res.id]))
                      }
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileImage size={28} className="text-gray-300" />
                    </div>
                  )}
                  <span
                    className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      res.status === 'VALIDATED'
                        ? 'bg-green-600 text-white'
                        : res.status === 'PENDING'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {res.status === 'VALIDATED' ? 'OK' : res.status === 'PENDING' ? '...' : 'X'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 truncate">{res.originalFileName}</p>
                <p className="text-[10px] text-gray-400">{fileSizeLabel(res.sizeBytes)}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Campaign Config ── */}
      <SectionCard
        title="Configuración de campaña"
        action={
          canEditConfig && !editingConfig ? (
            <button
              onClick={() => setEditingConfig(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
            >
              <Pencil size={13} />
              Editar
            </button>
          ) : undefined
        }
      >
        {editingConfig ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo de campaña</label>
                <select
                  value={configForm.campaignGoal}
                  onChange={e => setConfigForm(f => ({ ...f, campaignGoal: e.target.value }))}
                  className={fieldCls}
                >
                  <option value="">Sin objetivo definido</option>
                  {campaignGoals.map(g => (
                    <option key={g} value={g}>{GOAL_LABELS[g] ?? g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género objetivo</label>
                <select
                  value={configForm.targetGender}
                  onChange={e =>
                    setConfigForm(f => ({
                      ...f,
                      targetGender: e.target.value as 'ALL' | 'MALE' | 'FEMALE',
                    }))
                  }
                  className={fieldCls}
                >
                  <option value="ALL">Todos</option>
                  <option value="MALE">Hombres</option>
                  <option value="FEMALE">Mujeres</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sesiones máx / usuario / día
                </label>
                <input
                  type="number"
                  min={1}
                  value={configForm.maxSessionsPerUserPerDay}
                  onChange={e => setConfigForm(f => ({ ...f, maxSessionsPerUserPerDay: e.target.value }))}
                  placeholder="Ej: 3"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima</label>
                <input
                  type="number"
                  min={13}
                  max={100}
                  value={configForm.minAge}
                  onChange={e => setConfigForm(f => ({ ...f, minAge: e.target.value }))}
                  placeholder="13"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad máxima</label>
                <input
                  type="number"
                  min={13}
                  max={100}
                  value={configForm.maxAge}
                  onChange={e => setConfigForm(f => ({ ...f, maxAge: e.target.value }))}
                  placeholder="100"
                  className={fieldCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input
                  type="datetime-local"
                  value={configForm.startDate}
                  onChange={e => setConfigForm(f => ({ ...f, startDate: e.target.value }))}
                  className={fieldCls}
                />
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
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X size={14} />
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {detail.campaignGoal != null && (
              <InfoRow
                label="Objetivo de campaña"
                value={GOAL_LABELS[detail.campaignGoal] ?? detail.campaignGoal}
              />
            )}
            <InfoRow label="Género objetivo" value={genderLabel(detail.targetGender)} />
            <InfoRow
              label="Edad objetivo"
              value={
                detail.minAge || detail.maxAge
                  ? `${detail.minAge ?? '—'} – ${detail.maxAge ?? '—'} años`
                  : '—'
              }
            />
            <InfoRow label="Sesiones máx / día" value={detail.maxSessionsPerUserPerDay ?? '—'} />
            <InfoRow label="Fecha de inicio" value={formatDate(detail.startDate)} />
            {detail.categories.length > 0 && (
              <div className="flex gap-3 text-sm">
                <span className="text-gray-500 shrink-0 w-40">Categorías</span>
                <div className="flex flex-wrap gap-1">
                  {detail.categories.map(c => (
                    <span
                      key={c.id}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {detail.targetMunicipalities.length > 0 && (
              <div className="flex gap-3 text-sm">
                <span className="text-gray-500 shrink-0 w-40">Municipios</span>
                <div className="flex flex-wrap gap-1">
                  {detail.targetMunicipalities.map(m => (
                    <span
                      key={m.code}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Team ── */}
      {(detail.assignedDesignerName || detail.reviewedByAdminName) && (
        <SectionCard title="Equipo">
          <div className="space-y-2.5">
            {detail.assignedDesignerName && (
              <InfoRow
                label="Diseñador asignado"
                value={
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-gray-400 shrink-0" />
                    {detail.assignedDesignerName}
                    {detail.assignedDesignerCode && (
                      <span className="text-xs text-gray-500">({detail.assignedDesignerCode})</span>
                    )}
                  </span>
                }
              />
            )}
            {detail.reviewedByAdminName && (
              <InfoRow
                label="Revisado por"
                value={
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-gray-400 shrink-0" />
                    {detail.reviewedByAdminName}
                  </span>
                }
              />
            )}
            {detail.adminNotes && detail.status !== 'REJECTED' && (
              <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <p className="text-xs text-amber-800">
                  <strong className="block mb-0.5">Nota del administrador</strong>
                  {detail.adminNotes}
                </p>
              </div>
            )}
            {detail.designerNotes && detail.status !== 'CHANGES_REQUESTED' && (
              <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <p className="text-xs text-blue-800">
                  <strong className="block mb-0.5">Nota del diseñador</strong>
                  {detail.designerNotes}
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Request Design Changes Modal ── */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Solicitar cambios al diseñador</h2>
              <button
                onClick={() => { setShowChangesModal(false); setChangesNote(''); }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
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
                  placeholder="Ej: Por favor ajusta los colores del logo a rojo y blanco..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <span className="text-xs text-gray-400 float-right">{changesNote.length}/1000</span>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setShowChangesModal(false); setChangesNote(''); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
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
