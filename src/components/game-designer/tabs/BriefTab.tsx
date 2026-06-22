'use client';

import React from 'react';
import { Globe, Gamepad2 } from 'lucide-react';
import type { DesignerBrandingDetail } from '@/services/GameDesignerService';

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

const formatCOP = (cents: number | null) => {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(cents / 100);
};

const genderLabel = (g: string | null) =>
  !g || g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Hombres' : 'Mujeres';

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex gap-3 text-sm">
    <span className="text-gray-500 shrink-0 w-44">{label}</span>
    <span className="text-gray-900 font-medium min-w-0">{value ?? '—'}</span>
  </div>
);

interface Props {
  detail: DesignerBrandingDetail;
}

export const BriefTab: React.FC<Props> = ({ detail }) => (
  <div className="p-5 space-y-4">

    {/* Juego */}
    <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
      {detail.gameFrontPageUrl ? (
        <img
          src={detail.gameFrontPageUrl}
          alt={detail.gameName}
          className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
          <Gamepad2 size={24} className="text-gray-400" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Juego a brandear</p>
        <p className="text-base font-semibold text-gray-900">{detail.gameName}</p>
        <p className="text-xs text-gray-400 mt-0.5">ID #{detail.gameId}</p>
      </div>
    </div>

    {/* Marca */}
    <div className="space-y-2.5">
      <InfoRow label="Empresa" value={detail.commercialName} />
      <InfoRow label="Nombre de marca" value={detail.brandName} />
      <InfoRow label="Descripción" value={
        <span className="whitespace-pre-wrap text-sm leading-relaxed">{detail.brandDescription}</span>
      } />
      {detail.targetUrl && (
        <InfoRow label="URL de destino" value={
          <a href={detail.targetUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline break-all"
          >
            <Globe size={13} className="shrink-0" />{detail.targetUrl}
          </a>
        } />
      )}
      {detail.campaignGoal && (
        <InfoRow label="Objetivo" value={GOAL_LABELS[detail.campaignGoal] ?? detail.campaignGoal} />
      )}
    </div>

    {/* Segmentación */}
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
              <span key={c.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
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
              <span key={m.code} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Recompensas */}
    {(detail.completionRewardCents != null ||
      detail.maxRewardPerSessionCents != null ||
      detail.maxSessionsPerUserPerDay != null) && (
      <div className="pt-4 border-t border-gray-100 space-y-2.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recompensas de referencia</p>
        {detail.completionRewardCents != null && (
          <InfoRow label="Recomp. por completar" value={formatCOP(detail.completionRewardCents)} />
        )}
        {detail.maxRewardPerSessionCents != null && (
          <InfoRow label="Máx por sesión" value={formatCOP(detail.maxRewardPerSessionCents)} />
        )}
        {detail.maxSessionsPerUserPerDay != null && (
          <InfoRow label="Sesiones máx / día" value={`${detail.maxSessionsPerUserPerDay}`} />
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
);

export default BriefTab;
