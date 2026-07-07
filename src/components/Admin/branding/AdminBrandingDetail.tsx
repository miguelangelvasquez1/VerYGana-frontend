'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCog,
  X,
  Globe,
  FileImage,
  Building2,
  User,
  BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminGetBrandingRequestDetail,
  adminGetDesigners,
  adminApproveBranding,
  adminRejectBranding,
  adminAssignDesigner,
  type AdminBrandingRequestDetail as AdminDetailData,
  type Designer,
  type BrandingStatus,
} from '@/services/BrandingRequestService';

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

const STATUS_META: Record<
  BrandingStatus,
  { label: string; badge: string; bannerBg: string; bannerBorder: string; bannerTitle: string; bannerText: string }
> = {
  DRAFT: { label: 'Borrador', badge: 'bg-gray-100 text-gray-700 border-gray-200', bannerBg: 'bg-gray-50', bannerBorder: 'border-gray-200', bannerTitle: 'text-gray-800', bannerText: 'text-gray-600' },
  PENDING_REVIEW: { label: 'En revisión', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', bannerBg: 'bg-amber-50', bannerBorder: 'border-amber-200', bannerTitle: 'text-amber-900', bannerText: 'text-amber-700' },
  APPROVED: { label: 'Aprobada', badge: 'bg-green-100 text-green-800 border-green-200', bannerBg: 'bg-green-50', bannerBorder: 'border-green-200', bannerTitle: 'text-green-900', bannerText: 'text-green-700' },
  REJECTED: { label: 'Rechazada', badge: 'bg-red-100 text-red-800 border-red-200', bannerBg: 'bg-red-50', bannerBorder: 'border-red-200', bannerTitle: 'text-red-900', bannerText: 'text-red-700' },
  DESIGN_IN_PROGRESS: { label: 'En diseño', badge: 'bg-blue-100 text-blue-800 border-blue-200', bannerBg: 'bg-blue-50', bannerBorder: 'border-blue-200', bannerTitle: 'text-blue-900', bannerText: 'text-blue-700' },
  PENDING_ADVERTISER_APPROVAL: { label: 'Pend. aprobación anunciante', badge: 'bg-purple-100 text-purple-800 border-purple-200', bannerBg: 'bg-purple-50', bannerBorder: 'border-purple-200', bannerTitle: 'text-purple-900', bannerText: 'text-purple-700' },
  CHANGES_REQUESTED: { label: 'Cambios solicitados', badge: 'bg-orange-100 text-orange-800 border-orange-200', bannerBg: 'bg-orange-50', bannerBorder: 'border-orange-200', bannerTitle: 'text-orange-900', bannerText: 'text-orange-700' },
  LAUNCHED: { label: 'Campaña activa', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bannerBg: 'bg-emerald-50', bannerBorder: 'border-emerald-200', bannerTitle: 'text-emerald-900', bannerText: 'text-emerald-700' },
  CANCELLED: { label: 'Cancelada', badge: 'bg-gray-100 text-gray-500 border-gray-200', bannerBg: 'bg-gray-50', bannerBorder: 'border-gray-200', bannerTitle: 'text-gray-700', bannerText: 'text-gray-500' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCOP = (cents: number | null): string => {
  if (cents == null) return '—';
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

const fileSizeLabel = (bytes: number): string => {
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

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{title}</h3>
    {children}
  </div>
);

const fieldCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';

// ─── Designer Selector ────────────────────────────────────────────────────────

const DesignerSelector: React.FC<{
  selectedUserId: number | null;
  onSelect: (userId: number) => void;
}> = ({ selectedUserId, onSelect }) => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetDesigners()
      .then(setDesigners)
      .catch(() => toast.error('No se pudieron cargar los diseñadores'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
        <Loader2 size={14} className="animate-spin" /> Cargando diseñadores...
      </div>
    );
  }

  if (designers.length === 0) {
    return <p className="text-sm text-gray-400 py-3">No hay diseñadores disponibles.</p>;
  }

  return (
    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
      {designers.map(d => (
        <label
          key={d.userId}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none ${
            selectedUserId === d.userId
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="designer"
            checked={selectedUserId === d.userId}
            onChange={() => onSelect(d.userId)}
            className="text-blue-600 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {d.name} {d.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {d.designerCode} · {d.campaignsDesigned} campaña{d.campaignsDesigned !== 1 ? 's' : ''}
              {d.canPublishDirectly && (
                <span className="ml-1.5 text-green-600 font-medium">· puede publicar</span>
              )}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
};

// ─── Approve Modal ────────────────────────────────────────────────────────────

const ApproveModal: React.FC<{
  requestId: number;
  brandName: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ requestId, brandName, onClose, onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) { toast.error('Selecciona un diseñador'); return; }
    setSubmitting(true);
    try {
      await adminApproveBranding(requestId, selectedUserId, adminNotes || undefined);
      toast.success('Solicitud aprobada y diseñador asignado');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al aprobar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">Aprobar solicitud</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-800">{brandName}</p>
            <p className="text-gray-500">#{requestId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Diseñador asignado <span className="text-red-500">*</span>
            </p>
            <DesignerSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Instrucciones para el anunciante o el diseñador..."
              className={fieldCls}
            />
            <span className="text-xs text-gray-400 float-right">{adminNotes.length}/1000</span>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUserId}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Aprobar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────

const RejectModal: React.FC<{
  requestId: number;
  brandName: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ requestId, brandName, onClose, onSuccess }) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNotes.trim()) { toast.error('El motivo es requerido'); return; }
    setSubmitting(true);
    try {
      await adminRejectBranding(requestId, adminNotes.trim());
      toast.success('Solicitud rechazada');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al rechazar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-600" />
            <h2 className="text-base font-semibold text-gray-900">Rechazar solicitud</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-800">{brandName}</p>
            <p className="text-gray-500">#{requestId}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Explica al anunciante por qué se rechaza la solicitud..."
              className={fieldCls}
            />
            <span className="text-xs text-gray-400 float-right">{adminNotes.length}/1000</span>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !adminNotes.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Rechazar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Reassign Modal ───────────────────────────────────────────────────────────

const ReassignModal: React.FC<{
  requestId: number;
  brandName: string;
  currentDesignerName: string | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ requestId, brandName, currentDesignerName, onClose, onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) { toast.error('Selecciona un diseñador'); return; }
    setSubmitting(true);
    try {
      await adminAssignDesigner(requestId, selectedUserId);
      toast.success('Diseñador reasignado');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al reasignar el diseñador');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">Reasignar diseñador</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-800">{brandName}</p>
            {currentDesignerName && (
              <p className="text-gray-500">Diseñador actual: {currentDesignerName}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Nuevo diseñador <span className="text-red-500">*</span>
            </p>
            <DesignerSelector selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUserId}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Reasignar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  requestId: number;
  onBack: () => void;
}

type ModalType = 'approve' | 'reject' | 'reassign' | null;

export const AdminBrandingDetail: React.FC<Props> = ({ requestId, onBack }) => {
  const [detail, setDetail] = useState<AdminDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  const loadDetail = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const d = await adminGetBrandingRequestDetail(requestId, signal);
      if (!signal?.aborted) setDetail(d);
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

  const handleModalSuccess = () => {
    setModal(null);
    loadDetail();
  };

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
  const canApproveReject = detail.status === 'PENDING_REVIEW';
  const canReassign = ['APPROVED', 'DESIGN_IN_PROGRESS'].includes(detail.status);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0 mt-0.5"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{detail.brandName}</h2>
            <span className="text-gray-400 text-sm shrink-0">#{detail.id}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${meta.badge}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {detail.commercialName} · Actualizado {formatDateTime(detail.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {canApproveReject && (
            <>
              <button
                onClick={() => setModal('approve')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                <CheckCircle size={15} /> Aprobar
              </button>
              <button
                onClick={() => setModal('reject')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                <XCircle size={15} /> Rechazar
              </button>
            </>
          )}
          {canReassign && (
            <button
              onClick={() => setModal('reassign')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <UserCog size={15} /> Reasignar diseñador
            </button>
          )}
          <button
            onClick={() => loadDetail()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div className={`rounded-xl border p-4 ${meta.bannerBg} ${meta.bannerBorder}`}>
        <p className={`font-semibold text-sm ${meta.bannerTitle}`}>{meta.label}</p>
        {detail.status === 'REJECTED' && detail.adminNotes && (
          <p className={`text-sm mt-1 ${meta.bannerText}`}>Motivo: {detail.adminNotes}</p>
        )}
      </div>

      {/* ── Anunciante ── */}
      <SectionCard title="Anunciante">
        <div className="space-y-2.5">
          <InfoRow
            label="Empresa"
            value={
              <span className="flex items-center gap-1.5">
                <Building2 size={14} className="text-gray-400 shrink-0" />
                {detail.commercialName}
              </span>
            }
          />
          {detail.campaignGoal && (
            <InfoRow
              label="Objetivo de campaña"
              value={GOAL_LABELS[detail.campaignGoal] ?? detail.campaignGoal}
            />
          )}
        </div>
      </SectionCard>

      {/* ── Marca y Juego ── */}
      <SectionCard title="Marca y juego">
        <div className="flex gap-4 mb-4">
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
        </div>
      </SectionCard>

      {/* ── Economía ── */}
      <SectionCard title="Economía">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-[11px] text-green-700 font-semibold uppercase tracking-wide">Presupuesto</p>
            <p className="text-base font-bold text-green-800 mt-1">{formatCOP(detail.budgetCents)}</p>
          </div>
          {detail.estimatedSessions != null && (
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-blue-700 font-semibold uppercase tracking-wide">Ses. estimadas</p>
              <p className="text-base font-bold text-blue-800 mt-1">
                ~{detail.estimatedSessions.toLocaleString('es-CO')}
              </p>
            </div>
          )}
          {detail.completionRewardCents != null && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-gray-600 font-semibold uppercase tracking-wide">Recomp. / sesión</p>
              <p className="text-base font-bold text-gray-800 mt-1">
                {formatCOP(detail.completionRewardCents)}
              </p>
            </div>
          )}
          {detail.maxRewardPerSessionCents != null && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[11px] text-gray-600 font-semibold uppercase tracking-wide">Máx / sesión</p>
              <p className="text-base font-bold text-gray-800 mt-1">
                {formatCOP(detail.maxRewardPerSessionCents)}
              </p>
            </div>
          )}
        </div>
        {(detail.averageRewardPerSessionCents != null || detail.scoreRewardFactor != null) && (
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 uppercase tracking-wide">
              <BarChart2 size={12} className="text-gray-400" />
              Estimación al momento de creación
            </p>
            {detail.averageRewardPerSessionCents != null && (
              <InfoRow label="Costo prom. / sesión" value={formatCOP(detail.averageRewardPerSessionCents)} />
            )}
            {detail.scoreRewardFactor != null && (
              <InfoRow label="Factor de puntaje" value={`×${detail.scoreRewardFactor}`} />
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Segmentación ── */}
      <SectionCard title="Segmentación">
        <div className="space-y-2.5">
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
              <span className="text-gray-500 shrink-0 w-44">Categorías</span>
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
              <span className="text-gray-500 shrink-0 w-44">Municipios</span>
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
      </SectionCard>

      {/* ── Recursos corporativos ── */}
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
                      onError={() => setImgErrors(prev => new Set([...prev, res.id]))}
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

      {/* ── Equipo y notas ── */}
      {(detail.assignedDesignerName || detail.reviewedByAdminName || detail.adminNotes) && (
        <SectionCard title="Equipo y notas">
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
          </div>
        </SectionCard>
      )}

      {/* ── Modals ── */}
      {modal === 'approve' && (
        <ApproveModal
          requestId={detail.id}
          brandName={detail.brandName}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal === 'reject' && (
        <RejectModal
          requestId={detail.id}
          brandName={detail.brandName}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal === 'reassign' && (
        <ReassignModal
          requestId={detail.id}
          brandName={detail.brandName}
          currentDesignerName={detail.assignedDesignerName}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};
