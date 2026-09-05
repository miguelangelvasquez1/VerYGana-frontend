'use client';

import React from 'react';
import { Gamepad2, Users, Trophy, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import { getGamesReport } from '@/services/commercial/analyticsReportService';
import { useAnalyticsReport } from '../useAnalyticsReport';
import {
  DailySeriesChart,
  ProgressBar,
  ReportError,
  ReportLoading,
  ReportSectionHeader,
  ReportTableCard,
} from '../reportUi';
import {
  formatCOP,
  formatDate,
  formatDuration,
  formatInt,
  formatPct,
  statusChipClass,
  statusLabel,
} from '../reportFormat';
import type { DateRangeFilter } from '../analytics.types';

interface GamesMetricsSectionProps {
  dateRange: DateRangeFilter;
}

export function GamesMetricsSection({ dateRange }: GamesMetricsSectionProps) {
  const { data, loading, error } = useAnalyticsReport(getGamesReport, dateRange);

  return (
    <div className="space-y-6">
      <ReportSectionHeader
        title="Estadísticas de juegos"
        subtitle="Actividad de tus campañas de juegos patrocinados en el período."
        dateRange={dateRange}
      />

      {loading && <ReportLoading />}
      {error && !loading && <ReportError message={error} />}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <MetricStatCard
              title="Campañas publicadas"
              value={formatInt(data.summary.publishedCampaigns)}
              icon={Gamepad2}
              subtitle={`${formatInt(data.summary.totalCampaigns)} en total · ${formatInt(
                data.summary.pausedCampaigns,
              )} pausadas`}
            />
            <MetricStatCard
              title="Partidas jugadas"
              value={formatInt(data.summary.sessionsPlayed)}
              icon={Trophy}
              subtitle={`${formatInt(data.summary.lifetimeSessionsPlayed)} de por vida`}
            />
            <MetricStatCard
              title="Jugadores únicos"
              value={formatInt(data.summary.uniquePlayers)}
              icon={Users}
            />
            <MetricStatCard
              title="Tasa de finalización"
              value={formatPct(data.summary.completionRatePct)}
              icon={CheckCircle2}
              subtitle={`${formatInt(data.summary.completedSessions)} partidas completadas`}
            />
            <MetricStatCard
              title="Tiempo de juego total"
              value={formatDuration(data.summary.totalPlayTimeSeconds)}
              icon={Clock}
              subtitle={`${formatDuration(
                data.summary.avgSessionDurationSeconds,
              )} por partida en promedio`}
            />
            <MetricStatCard
              title="Presupuesto gastado"
              value={formatCOP(data.summary.spentBudgetCents)}
              icon={Wallet}
              subtitle={`de ${formatCOP(data.summary.totalBudgetCents)} · ${formatCOP(
                data.summary.rewardsPaidCents,
              )} en recompensas`}
            />
          </div>

          <DailySeriesChart
            title="Partidas por día"
            data={data.playsByDay}
            valuelabel="Partidas"
            emptyLabel="Sin partidas en este período."
          />

          <ReportTableCard title="Rendimiento por campaña">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Juego</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Partidas</th>
                  <th className="px-4 py-3 font-semibold text-right">Jugadores</th>
                  <th className="px-4 py-3 font-semibold w-44">Finalización</th>
                  <th className="px-4 py-3 font-semibold text-right">Tiempo</th>
                  <th className="px-4 py-3 font-semibold text-right">Presupuesto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.perCampaign.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      No tienes campañas de juegos en este período.
                    </td>
                  </tr>
                ) : (
                  data.perCampaign.map((c) => (
                    <tr key={c.campaignId} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900">{c.gameTitle}</span>
                        {(c.startDate || c.endDate) && (
                          <span className="block text-xs text-gray-400">
                            {formatDate(c.startDate)} – {formatDate(c.endDate)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusChipClass(
                            c.status,
                          )}`}
                        >
                          {statusLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatInt(c.completedSessions)} / {formatInt(c.sessionsPlayed)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatInt(c.uniquePlayers)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={c.completionRatePct} className="flex-1" />
                          <span className="w-12 shrink-0 text-right text-xs text-gray-500 tabular-nums">
                            {formatPct(c.completionRatePct)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatDuration(c.totalPlayTimeSeconds)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCOP(c.spentCents)}
                        <span className="block text-xs text-gray-400">
                          de {formatCOP(c.budgetCents)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ReportTableCard>
        </>
      )}
    </div>
  );
}
