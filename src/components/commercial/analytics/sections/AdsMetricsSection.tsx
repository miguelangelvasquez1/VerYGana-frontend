'use client';

import React from 'react';
import { Megaphone, Heart, Wallet, TrendingUp } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import { getAdsReport } from '@/services/commercial/analyticsReportService';
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
  formatInt,
  formatPct,
  statusChipClass,
  statusLabel,
} from '../reportFormat';
import type { DateRangeFilter } from '../analytics.types';

interface AdsMetricsSectionProps {
  dateRange: DateRangeFilter;
}

export function AdsMetricsSection({ dateRange }: AdsMetricsSectionProps) {
  const { data, loading, error } = useAnalyticsReport(getAdsReport, dateRange);

  return (
    <div className="space-y-6">
      <ReportSectionHeader
        title="Estadísticas de anuncios"
        subtitle="Interacciones, recompensas y presupuesto de tus anuncios en el período."
        dateRange={dateRange}
      />

      {loading && <ReportLoading />}
      {error && !loading && <ReportError message={error} />}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <MetricStatCard
              title="Anuncios activos"
              value={formatInt(data.summary.activeAds)}
              icon={Megaphone}
              subtitle={`${formatInt(data.summary.totalAds)} en total · ${formatInt(
                data.summary.pausedAds,
              )} pausados`}
            />
            <MetricStatCard
              title="Interacciones"
              value={formatInt(data.summary.interactions)}
              icon={Heart}
              subtitle={`${formatInt(data.summary.lifetimeInteractions)} likes de por vida`}
            />
            <MetricStatCard
              title="Presupuesto gastado"
              value={formatCOP(data.summary.spentBudgetCents)}
              icon={Wallet}
              subtitle={`de ${formatCOP(data.summary.totalBudgetCents)} · quedan ${formatCOP(
                data.summary.remainingBudgetCents,
              )}`}
            />
            <MetricStatCard
              title="% avance promedio"
              value={formatPct(data.summary.avgCompletionRatePct)}
              icon={TrendingUp}
              subtitle="Avance medio de tus anuncios"
            />
            <MetricStatCard
              title="Recompensas pagadas"
              value={formatCOP(data.summary.rewardPaidCents)}
              icon={Wallet}
              subtitle="A usuarios que dieron like en el período"
            />
          </div>

          <DailySeriesChart
            title="Interacciones por día"
            data={data.interactionsByDay}
            valuelabel="Interacciones"
            emptyLabel="Sin interacciones en este período."
          />

          <ReportTableCard title="Rendimiento por anuncio">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Anuncio</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Interacciones</th>
                  <th className="px-4 py-3 font-semibold w-48">Avance</th>
                  <th className="px-4 py-3 font-semibold text-right">Recompensa / like</th>
                  <th className="px-4 py-3 font-semibold text-right">Presupuesto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.perAd.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                      No tienes anuncios en este período.
                    </td>
                  </tr>
                ) : (
                  data.perAd.map((ad) => (
                    <tr key={ad.adId} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900">{ad.title}</span>
                        <span className="block text-xs text-gray-400">
                          Creado {formatDate(ad.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusChipClass(
                            ad.status,
                          )}`}
                        >
                          {statusLabel(ad.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatInt(ad.interactions)}
                        <span className="block text-xs text-gray-400">
                          {formatInt(ad.lifetimeLikes)} / {formatInt(ad.maxLikes)} de por vida
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={ad.completionRatePct} className="flex-1" />
                          <span className="w-12 shrink-0 text-right text-xs text-gray-500 tabular-nums">
                            {formatPct(ad.completionRatePct)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCOP(ad.rewardPerLikeCents)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCOP(ad.spentBudgetCents)}
                        <span className="block text-xs text-gray-400">
                          de {formatCOP(ad.totalBudgetCents)}
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
