'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Loader2, RefreshCw, BookOpen, Package, Gamepad2, Braces } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDesignerRequestDetail,
  saveDraft,
  submitDesign,
  type DesignerBrandingDetail,
} from '@/services/GameDesignerService';
import type { BrandingStatus } from '@/services/BrandingRequestService';

import { BriefTab }        from './tabs/BriefTab';
import { ResourcesTab }    from './tabs/ResourcesTab';
import { ConfigTab }       from './tabs/ConfigTab';
import { JsonPreviewTab }  from './tabs/JsonPreviewTab';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Partial<Record<BrandingStatus, { label: string; cls: string }>> = {
  APPROVED:                   { label: 'Listo para iniciar',          cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  DESIGN_IN_PROGRESS:         { label: 'En progreso',                 cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  CHANGES_REQUESTED:          { label: 'Cambios solicitados',         cls: 'bg-orange-100 text-orange-800 border-orange-200' },
  PENDING_ADVERTISER_APPROVAL:{ label: 'En revisión del anunciante',  cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  READY_TO_LAUNCH:            { label: 'Aprobado ✓',                 cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  LAUNCHED:                   { label: 'Activa',                      cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

type Tab = 'brief' | 'resources' | 'config' | 'json';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'brief',     label: 'Brief de marca',        icon: BookOpen  },
  { id: 'resources', label: 'Recursos corporativos', icon: Package   },
  { id: 'config',    label: 'Configuración del juego', icon: Gamepad2 },
  { id: 'json',      label: 'Vista JSON',            icon: Braces    },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  requestId: number;
  onBack: () => void;
}

export const DesignerRequestDetail: React.FC<Props> = ({ requestId, onBack }) => {
  const [detail, setDetail]               = useState<DesignerBrandingDetail | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<Tab>('brief');
  const [gameConfig, setGameConfig]       = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting]       = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const saveDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadDetail = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const d = await getDesignerRequestDetail(requestId, signal);
      if (!signal?.aborted) {
        setDetail(d);
        setGameConfig(d.draftFormData ?? {});
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

  useEffect(() => () => {
    if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFormChange = ({ formData }: { formData?: Record<string, unknown> }) => {
    if (!detail) return;
    const data = formData ?? {};
    setGameConfig(data);
    if (!['APPROVED', 'DESIGN_IN_PROGRESS', 'CHANGES_REQUESTED'].includes(detail.status)) return;
    if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
    saveDraftTimerRef.current = setTimeout(async () => {
      try { await saveDraft(detail.id, data); } catch {}
    }, 1500);
  };

  const handleFormValidated = async ({ formData }: { formData?: Record<string, unknown> }) => {
    if (!detail || !formData) return;
    if (saveDraftTimerRef.current) {
      clearTimeout(saveDraftTimerRef.current);
      saveDraftTimerRef.current = null;
    }
    try { await saveDraft(detail.id, formData); } catch {}
    setShowSubmitConfirm(true);
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

  // ── Loading / error states ──────────────────────────────────────────────────

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

  // ── Derived values ──────────────────────────────────────────────────────────

  const statusMeta          = STATUS_LABEL[detail.status];
  const canSubmit           = ['DESIGN_IN_PROGRESS', 'CHANGES_REQUESTED'].includes(detail.status);
  const isChangesRequested  = detail.status === 'CHANGES_REQUESTED';
  const validatedCount      = detail.corporateResources.filter(r => r.status === 'VALIDATED').length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Header */}
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

      {/* Changes-requested feedback banner */}
      {isChangesRequested && detail.designerNotes && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-900 mb-1">Feedback del anunciante</p>
          <p className="text-sm text-orange-800 whitespace-pre-wrap">{detail.designerNotes}</p>
        </div>
      )}

      {/* Tab card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(tab => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
                  active
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.id === 'resources' && validatedCount > 0 && (
                  <span className="ml-1 text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {validatedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'brief'     && <BriefTab detail={detail} />}
        {activeTab === 'resources' && <ResourcesTab detail={detail} />}
        {activeTab === 'config'    && (
          <ConfigTab
            detail={detail}
            gameConfig={gameConfig}
            onFormChange={handleFormChange}
            onValidated={handleFormValidated}
            submitting={submitting}
            showSubmitConfirm={showSubmitConfirm}
            setShowSubmitConfirm={setShowSubmitConfirm}
            onSubmitDesign={handleSubmitDesign}
            canSubmit={canSubmit}
            isChangesRequested={isChangesRequested}
          />
        )}
        {activeTab === 'json'      && <JsonPreviewTab gameConfig={gameConfig} />}
      </div>
    </div>
  );
};
