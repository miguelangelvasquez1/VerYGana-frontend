'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  XCircle,
  X,
  DollarSign,
  BarChart2,
  Target,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCampaignDetail,
  updateCampaign,
  updateCampaignStatus,
  type Campaign,
  type CampaignStatus,
  type UpdateCampaignDto,
} from '@/services/CampaignService';
import { getCommercialPreviewUrl } from '@/services/BrandingRequestService';
import {
  STATUS_META,
  VALID_TRANSITIONS,
  missingTargetingFields,
  formatDateTime,
  campaignToAudienceForm,
  type AudienceForm,
} from './campaignDetail.shared';
import { ResumenTab } from './tabs/ResumenTab';
import { RendimientoTab } from './tabs/RendimientoTab';
import { AudienciaTab } from './tabs/AudienciaTab';

type Tab = 'resumen' | 'rendimiento' | 'audiencia';

const ALL_TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'resumen',       label: 'Resumen',      Icon: DollarSign },
  { id: 'rendimiento',   label: 'Rendimiento',  Icon: BarChart2 },
  { id: 'audiencia',     label: 'Audiencia',    Icon: Target },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  campaignId: number;
  onBack: () => void;
}

export const CampaignDetail: React.FC<Props> = ({ campaignId, onBack }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  const [editingAudience, setEditingAudience] = useState(false);
  const [audienceForm, setAudienceForm] = useState<AudienceForm>({
    targetGender: 'ALL', minAge: '', maxAge: '', categoryIds: [], municipalityCodes: [],
    maxSessionsPerUserPerDay: '',
  });
  const [savingAudience, setSavingAudience] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadCampaign = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const found = await getCampaignDetail(campaignId, signal);
      if (!signal?.aborted) {
        setCampaign(found);
        setAudienceForm(campaignToAudienceForm(found));
      }
    } catch (err: any) {
      if (err?.name !== 'CanceledError' && !signal?.aborted)
        setError('No se pudo cargar el detalle de la campaña');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadCampaign(ctrl.signal);
    return () => ctrl.abort();
  }, [campaignId]);

  const handleSaveAudience = async () => {
    if (!campaign) return;
    setSavingAudience(true);
    try {
      const dto: UpdateCampaignDto = {
        categoryIds: audienceForm.categoryIds,
        targetAudience: {
          gender: audienceForm.targetGender,
          municipalityCodes: audienceForm.municipalityCodes,
          ...(audienceForm.minAge ? { minAge: Number(audienceForm.minAge) } : {}),
          ...(audienceForm.maxAge ? { maxAge: Number(audienceForm.maxAge) } : {}),
        },
      };
      if (audienceForm.maxSessionsPerUserPerDay) dto.maxSessionsPerUserPerDay = Number(audienceForm.maxSessionsPerUserPerDay);
      await updateCampaign(campaign.id, dto);
      toast.success('Audiencia actualizada');
      setEditingAudience(false);
      await loadCampaign();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar la audiencia');
    } finally {
      setSavingAudience(false);
    }
  };

  const cancelEditAudience = () => {
    setEditingAudience(false);
    if (campaign) setAudienceForm(campaignToAudienceForm(campaign));
  };

  const handlePreview = async () => {
    if (!campaign) return;
    setPreviewLoading(true);
    try {
      const url = await getCommercialPreviewUrl(campaign.brandingRequestId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err?.response?.status === 400 ? 'El diseñador aún no ha entregado el diseño' : 'No se pudo obtener la URL de preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStatusChange = async (status: CampaignStatus) => {
    if (!campaign) return;
    setStatusUpdating(true);
    try {
      await updateCampaignStatus(campaign.id, status);
      toast.success(
        status === 'ACTIVE' ? '¡Campaña activada!' : status === 'PAUSED' ? 'Campaña pausada' : 'Campaña cancelada'
      );
      setConfirmCancel(false);
      await loadCampaign();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar el estado de la campaña');
    } finally {
      setStatusUpdating(false);
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

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
          <ChevronLeft size={18} /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button onClick={() => loadCampaign()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm cursor-pointer hover:bg-red-700 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[campaign.status];
  const validTargets = VALID_TRANSITIONS[campaign.status];
  const canActivate = validTargets.includes('ACTIVE');
  const missingFields = missingTargetingFields(campaign);
  const activateBlocked = canActivate && missingFields.length > 0;
  const budgetCents = campaign.budgetCents ?? 0;
  const spentCents = campaign.spentCents ?? 0;
  const spentPct = budgetCents > 0 ? Math.min(100, Math.round((spentCents / budgetCents) * 100)) : 0;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{campaign.brandName ?? `Campaña #${campaign.id}`}</h2>
            <span className="text-gray-400 text-sm shrink-0">#{campaign.id}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{campaign.gameTitle ?? '—'} · Actualizada {formatDateTime(campaign.updatedAt)}</p>
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
            </div>
          </div>
        </div>
        {campaign.status !== 'COMPLETED' && campaign.status !== 'CANCELLED' && (
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            Ver diseño
          </button>
        )}
        <button onClick={() => loadCampaign()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0" title="Actualizar">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      {/* ── Status banner + actions ── */}
      <div className={`${meta.bannerBg} border ${meta.bannerBorder} rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between`}>
        <div>
          <p className={`font-semibold text-sm ${meta.bannerTitle}`}>{meta.label}</p>
          <p className={`text-xs mt-0.5 ${meta.bannerText}`}>{meta.message}</p>
          {activateBlocked && (
            <p className="text-xs mt-1 text-orange-700 font-medium">
              Completa {missingFields.join(', ')} en la pestaña Audiencia para poder activarla.
            </p>
          )}
        </div>
        {validTargets.length > 0 && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {validTargets.includes('ACTIVE') && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                disabled={statusUpdating || activateBlocked}
                title={activateBlocked ? `Completa ${missingFields.join(', ')} antes de activar` : undefined}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {statusUpdating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {campaign.status === 'PAUSED' ? 'Reactivar' : 'Activar'}
              </button>
            )}
            {validTargets.includes('PAUSED') && (
              <button
                onClick={() => handleStatusChange('PAUSED')}
                disabled={statusUpdating}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {statusUpdating ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
                Pausar
              </button>
            )}
            {validTargets.includes('CANCELLED') && (
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={statusUpdating}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle size={14} />
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Main Card with Tabs ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative border-b border-gray-100">
          <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ALL_TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium shrink-0 transition-colors border-b-2 ${
                    active ? 'text-blue-600 border-blue-600' : 'text-gray-500 hover:text-gray-700 border-transparent'
                  }`}
                >
                  <tab.Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'resumen' && <ResumenTab campaign={campaign} spentPct={spentPct} />}

        {activeTab === 'rendimiento' && <RendimientoTab campaign={campaign} />}

        {activeTab === 'audiencia' && (
          <AudienciaTab
            campaign={campaign}
            editing={editingAudience}
            form={audienceForm}
            onChangeForm={setAudienceForm}
            saving={savingAudience}
            onEdit={() => setEditingAudience(true)}
            onCancel={cancelEditAudience}
            onSave={handleSaveAudience}
          />
        )}
      </div>

      {/* ── Modal: Confirm Cancel ── */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Cancelar campaña</h2>
              <button onClick={() => setConfirmCancel(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                La campaña dejará de mostrarse a los jugadores y no podrá reactivarse. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setConfirmCancel(false)}
                  disabled={statusUpdating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Volver
                </button>
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={statusUpdating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {statusUpdating && <Loader2 size={14} className="animate-spin" />}
                  Sí, cancelar campaña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
