'use client';

import React from 'react';
import { Eye, Users, ArrowUpRight, ArrowDownRight, Minus, Percent, ExternalLink } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import { getPageVisitsReport } from '@/services/commercial/analyticsReportService';
import { useAnalyticsReport } from '../useAnalyticsReport';
import {
  DailySeriesChart,
  ReportError,
  ReportLoading,
  ReportSectionHeader,
  ReportTableCard,
} from '../reportUi';
import { NO_DATA, formatDateTime, formatInt, formatPct } from '../reportFormat';
import type { DateRangeFilter } from '../analytics.types';

interface ReferralMetricsSectionProps {
  dateRange: DateRangeFilter;
}

// Métricas de remisión: visitas a la página oficial del empresario atribuidas a
// los clics en el enlace de sus anuncios. Exclusivas del plan Premium.
export function ReferralMetricsSection({ dateRange }: ReferralMetricsSectionProps) {
  const { data, loading, error } = useAnalyticsReport(getPageVisitsReport, dateRange);

  const delta = data?.summary.deltaPct;
  const DeltaIcon = delta == null ? Minus : delta >= 0 ? ArrowUpRight : ArrowDownRight;
  const deltaColor =
    delta == null ? 'text-gray-400' : delta >= 0 ? 'text-emerald-600' : 'text-red-500';

  return (
    <div className="space-y-6">
      <ReportSectionHeader
        title="Métricas de remisión"
        subtitle="Visitas a tu página oficial generadas por los enlaces de tus anuncios."
        dateRange={dateRange}
      />

      {loading && <ReportLoading />}
      {error && !loading && <ReportError message={error} />}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricStatCard
              title="Visitas"
              value={formatInt(data.summary.totalVisits)}
              icon={Eye}
              subtitle={`${formatInt(data.summary.lifetimeVisits)} de por vida`}
            />
            <MetricStatCard
              title="Visitantes únicos"
              value={formatInt(data.summary.uniqueVisitors)}
              icon={Users}
            />
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    Δ vs período anterior
                  </p>
                  <p className={`mt-1 flex items-center gap-1 text-2xl font-bold ${deltaColor}`}>
                    <DeltaIcon className="w-5 h-5 shrink-0" />
                    {delta == null ? NO_DATA : formatPct(Math.abs(delta))}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatInt(data.summary.previousPeriodVisits)} visitas antes
                  </p>
                </div>
                <div className="p-2.5 rounded-xl shrink-0 bg-[#03548C]/10">
                  <Eye className="w-5 h-5 text-[#03548C]" />
                </div>
              </div>
            </div>
            <MetricStatCard
              title="Conversión desde anuncios"
              value={formatPct(data.summary.conversionRatePct)}
              icon={Percent}
              subtitle="Visitas por interacción con anuncios"
            />
          </div>

          <DailySeriesChart
            title="Visitas por día"
            data={data.visitsByDay}
            valuelabel="Visitas"
            emptyLabel="Sin visitas en este período."
          />

          <ReportTableCard title="Visitas por anuncio">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Anuncio</th>
                  <th className="px-4 py-3 font-semibold text-right">Visitas</th>
                  <th className="px-4 py-3 font-semibold text-right">Visitantes únicos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.visitsByAd.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-400">
                      Todavía no hay visitas atribuidas a tus anuncios.
                    </td>
                  </tr>
                ) : (
                  data.visitsByAd.map((row) => (
                    <tr key={row.adId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{row.adTitle}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatInt(row.visits)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatInt(row.uniqueVisitors)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ReportTableCard>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-sm font-semibold text-gray-900">Visitas recientes</h4>
            {data.recentVisits.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Sin visitas recientes.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.recentVisits.map((v, i) => (
                  <li key={`${v.adId}-${v.visitedAt}-${i}`} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#03548C]/10">
                      <ExternalLink className="h-4 w-4 text-[#03548C]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{v.adTitle}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(v.visitedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
