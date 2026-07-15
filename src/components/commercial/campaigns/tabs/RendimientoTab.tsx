'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, BarChart2 } from 'lucide-react';
import type { Campaign } from '@/services/CampaignService';
import { formatDuration } from '../campaignDetail.shared';

// ─── Chart tokens (sequential blue — magnitude comparison, single hue) ────────
const BAR_FILL = '#2a78d6';
const GRID_STROKE = '#e1e0d9';
const AXIS_TICK = '#898781';

interface Props {
  campaign: Campaign;
}

const ActivityTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <p className="text-sm font-semibold text-gray-900">{Number(value).toLocaleString('es-CO')}</p>
      <p className="text-xs text-gray-500">{name}</p>
    </div>
  );
};

export const RendimientoTab: React.FC<Props> = ({ campaign }) => {
  const sessionsPlayed = campaign.sessionsPlayed ?? 0;
  const completedSessions = campaign.completedSessions ?? 0;
  const uniquePlayersCount = campaign.uniquePlayersCount ?? 0;
  const completionPct = sessionsPlayed > 0 ? Math.min(100, Math.round((completedSessions / sessionsPlayed) * 100)) : 0;
  const hasActivity = sessionsPlayed > 0 || completedSessions > 0 || uniquePlayersCount > 0;

  const chartData = [
    { name: 'Sesiones jugadas', value: sessionsPlayed },
    { name: 'Completadas', value: completedSessions },
    { name: 'Jugadores únicos', value: uniquePlayersCount },
  ];

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Sesiones</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{sessionsPlayed.toLocaleString('es-CO')}</p>
        </div>
        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Completadas</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{completedSessions.toLocaleString('es-CO')}</p>
        </div>
        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Jugadores únicos</p>
          <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1.5">
            <Users size={16} className="text-gray-400" />{uniquePlayersCount.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">Tiempo total</p>
          <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1.5">
            <Clock size={16} className="text-gray-400" />{formatDuration(campaign.totalPlayTimeSeconds)}
          </p>
        </div>
      </div>

      {/* Tasa de finalización — meter: fill in the accent, track a lighter step of the same ramp */}
      {sessionsPlayed > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-blue-800">Tasa de finalización</p>
            <p className="text-sm font-bold text-blue-800">{completionPct}%</p>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Comparación de actividad — bar chart, single sequential hue (magnitude, not identity) */}
      <div className="border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
          <BarChart2 size={13} className="text-gray-400" /> Actividad de la campaña
        </p>
        {hasActivity ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: AXIS_TICK, fontSize: 12 }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: AXIS_TICK, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => Number(v).toLocaleString('es-CO')}
                width={48}
              />
              <Tooltip cursor={{ fill: 'rgba(42,120,214,0.06)' }} content={<ActivityTooltip />} />
              <Bar dataKey="value" fill={BAR_FILL} radius={[4, 4, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BarChart2 size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Aún no hay actividad registrada para esta campaña.</p>
          </div>
        )}
      </div>
    </div>
  );
};
