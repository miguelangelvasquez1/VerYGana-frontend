import React from 'react';
import type { Campaign, CampaignStatus } from '@/services/CampaignService';

// ─── Status metadata ──────────────────────────────────────────────────────────

export const STATUS_META: Record<
  CampaignStatus,
  { label: string; badge: string; bannerBg: string; bannerBorder: string; bannerTitle: string; bannerText: string; message: string }
> = {
  DRAFT:     { label: 'Borrador',   badge: 'bg-gray-100 text-gray-700 border-gray-200',       bannerBg: 'bg-gray-50',    bannerBorder: 'border-gray-200',    bannerTitle: 'text-gray-800',    bannerText: 'text-gray-600',    message: 'La campaña está lista para revisarse. Completa la configuración de sesiones máximas y actívala cuando quieras que empiece a llegar a los jugadores.' },
  ACTIVE:    { label: 'Activa',     badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bannerBg: 'bg-emerald-50', bannerBorder: 'border-emerald-200', bannerTitle: 'text-emerald-900', bannerText: 'text-emerald-700', message: 'La campaña está activa y llegando a los jugadores.' },
  PAUSED:    { label: 'Pausada',    badge: 'bg-amber-100 text-amber-800 border-amber-200',     bannerBg: 'bg-amber-50',   bannerBorder: 'border-amber-200',   bannerTitle: 'text-amber-900',   bannerText: 'text-amber-700',   message: 'La campaña está pausada. No se les muestra a los jugadores hasta que la reactives.' },
  COMPLETED: { label: 'Finalizada', badge: 'bg-blue-100 text-blue-800 border-blue-200',        bannerBg: 'bg-blue-50',    bannerBorder: 'border-blue-200',    bannerTitle: 'text-blue-900',    bannerText: 'text-blue-700',    message: 'La campaña finalizó su ciclo.' },
  CANCELLED: { label: 'Cancelada',  badge: 'bg-gray-100 text-gray-500 border-gray-200',        bannerBg: 'bg-gray-50',    bannerBorder: 'border-gray-200',    bannerTitle: 'text-gray-700',    bannerText: 'text-gray-500',    message: 'Esta campaña fue cancelada.' },
};

export const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['PAUSED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const missingTargetingFields = (c: Campaign): string[] => {
  const missing: string[] = [];
  if (c.categories.length === 0) missing.push('categorías');
  if (c.minAge == null || c.maxAge == null) missing.push('rango de edad');
  if (c.targetGender == null) missing.push('género objetivo');
  if (c.maxSessionsPerUserPerDay == null) missing.push('sesiones máx / usuario / día');
  return missing;
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCOP = (cents: number | null | undefined): string => {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
};

export const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatDuration = (rawSeconds: number | null | undefined): string => {
  const seconds = rawSeconds ?? 0;
  if (seconds < 60) return `${seconds} s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
};

export const genderLabel = (g: string | null): string =>
  !g || g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Hombres' : 'Mujeres';

// ─── Shared UI ────────────────────────────────────────────────────────────────

export const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-500 shrink-0 w-48">{label}</span>
    <span className="text-gray-900 font-medium min-w-0">{value ?? '—'}</span>
  </div>
);

export const fieldCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface AudienceForm {
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  minAge: string;
  maxAge: string;
  categoryIds: number[];
  municipalityCodes: string[];
  maxSessionsPerUserPerDay: string;
}

export const campaignToAudienceForm = (c: Campaign): AudienceForm => ({
  targetGender: c.targetGender ?? 'ALL',
  minAge: c.minAge?.toString() ?? '',
  maxAge: c.maxAge?.toString() ?? '',
  categoryIds: c.categories.map(cat => cat.id),
  municipalityCodes: c.targetMunicipalities.map(m => m.code),
  maxSessionsPerUserPerDay: c.maxSessionsPerUserPerDay?.toString() ?? '',
});
