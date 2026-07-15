import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { Campaign } from '@/services/CampaignService';
import { InfoRow, formatCOP, formatDate } from '../campaignDetail.shared';

const GOAL_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Reconocimiento de marca',
  WEBSITE_TRAFFIC: 'Tráfico al sitio web',
  APP_INSTALLS: 'Instalaciones de app',
  PRODUCT_PROMOTION: 'Promoción de producto',
};

interface Props {
  campaign: Campaign;
  spentPct: number;
}

export const ResumenTab: React.FC<Props> = ({ campaign, spentPct }) => (
  <div className="p-5 space-y-5">
    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCOP(campaign.spentCents)}</p>
        <p className="text-xs text-gray-400">de {formatCOP(campaign.budgetCents)}</p>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full transition-all" style={{ width: `${spentPct}%` }} />
      </div>
      <p className="text-[11px] text-gray-400">{spentPct}% del presupuesto utilizado</p>
    </div>

    <div className="space-y-2.5">
      {campaign.campaignGoal && (
        <InfoRow label="Objetivo de campaña" value={GOAL_LABELS[campaign.campaignGoal] ?? campaign.campaignGoal} />
      )}
      <InfoRow label="Fecha de inicio" value={formatDate(campaign.startDate)} />
      <InfoRow label="Fecha de fin" value={formatDate(campaign.endDate)} />
      <InfoRow label="Creada" value={formatDate(campaign.createdAt)} />
    </div>

    {/* Estimaciones */}
    {campaign.estimatedSessions != null && (
      <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
        <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 uppercase tracking-wide">
          <BarChart2 size={12} className="text-gray-400" /> Estimación con presupuesto restante
        </p>
        <div className="space-y-1.5">
          <InfoRow label="Sesiones estimadas" value={`~${campaign.estimatedSessions.toLocaleString('es-CO')} sesiones`} />
          {campaign.costPerSessionCents != null && (
            <InfoRow label="Costo por sesión" value={formatCOP(campaign.costPerSessionCents)} />
          )}
        </div>
        <p className="text-[11px] text-gray-400 leading-snug">Estimación orientativa sujeta a la participación real.</p>
      </div>
    )}
  </div>
);
