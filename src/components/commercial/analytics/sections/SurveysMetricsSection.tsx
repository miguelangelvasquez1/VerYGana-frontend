'use client';

import React from 'react';
import { ClipboardList, Users, CheckCircle2, CalendarRange } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import { getSurveysReport } from '@/services/commercial/analyticsReportService';
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
  formatDate,
  formatInt,
  formatPct,
  statusChipClass,
  statusLabel,
} from '../reportFormat';
import type { DateRangeFilter } from '../analytics.types';

interface SurveysMetricsSectionProps {
  dateRange: DateRangeFilter;
}

export function SurveysMetricsSection({ dateRange }: SurveysMetricsSectionProps) {
  const { data, loading, error } = useAnalyticsReport(getSurveysReport, dateRange);

  return (
    <div className="space-y-6">
      <ReportSectionHeader
        title="Estadísticas de encuestas"
        subtitle="Sesiones, respuestas y finalización de tus encuestas en el período."
        dateRange={dateRange}
      />

      {loading && <ReportLoading />}
      {error && !loading && <ReportError message={error} />}

      {data && !loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricStatCard
              title="Encuestas activas"
              value={formatInt(data.summary.activeSurveys)}
              icon={ClipboardList}
              subtitle={`${formatInt(data.summary.totalSurveys)} en total · ${formatInt(
                data.summary.pausedSurveys,
              )} pausadas`}
            />
            <MetricStatCard
              title="Respuestas totales"
              value={formatInt(data.summary.totalResponses)}
              icon={Users}
              subtitle="Acumuladas de por vida"
            />
            <MetricStatCard
              title="Tasa de finalización"
              value={formatPct(data.summary.completionRatePct)}
              icon={CheckCircle2}
              subtitle={`${formatInt(data.summary.completedSessions)} de ${formatInt(
                data.summary.startedSessions,
              )} sesiones`}
            />
            <MetricStatCard
              title="Respuestas del período"
              value={formatInt(data.summary.responsesInPeriod)}
              icon={CalendarRange}
              subtitle="Completadas dentro del rango"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricStatCard
              title="Sesiones iniciadas"
              value={formatInt(data.summary.startedSessions)}
              icon={ClipboardList}
            />
            <MetricStatCard
              title="Sesiones abandonadas"
              value={formatInt(data.summary.abandonedSessions)}
              icon={ClipboardList}
            />
            <MetricStatCard
              title="Sesiones expiradas"
              value={formatInt(data.summary.expiredSessions)}
              icon={ClipboardList}
            />
            <MetricStatCard
              title="Promedio por encuesta activa"
              value={
                data.summary.avgResponsesPerActiveSurvey != null
                  ? formatInt(Math.round(data.summary.avgResponsesPerActiveSurvey))
                  : '—'
              }
              icon={Users}
              subtitle="Respuestas promedio"
            />
          </div>

          <DailySeriesChart
            title="Respuestas por día"
            data={data.responsesByDay}
            valuelabel="Respuestas"
            emptyLabel="Sin respuestas en este período."
          />

          <ReportTableCard title="Rendimiento por encuesta">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Encuesta</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Preguntas</th>
                  <th className="px-4 py-3 font-semibold w-52">Cupo</th>
                  <th className="px-4 py-3 font-semibold text-right">Sesiones</th>
                  <th className="px-4 py-3 font-semibold text-right">Finalización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.perSurvey.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                      No tienes encuestas en este período.
                    </td>
                  </tr>
                ) : (
                  data.perSurvey.map((s) => (
                    <tr key={s.surveyId} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900">{s.title}</span>
                        <span className="block text-xs text-gray-400">
                          Creada {formatDate(s.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusChipClass(
                            s.status,
                          )}`}
                        >
                          {statusLabel(s.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatInt(s.questionCount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={s.fillRatePct} className="flex-1" />
                          <span className="w-20 shrink-0 text-right text-xs text-gray-500 tabular-nums">
                            {formatInt(s.responseCount)} / {formatInt(s.maxResponses)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatInt(s.completedSessions)} / {formatInt(s.startedSessions)}
                        <span className="block text-xs text-gray-400">
                          {formatInt(s.abandonedSessions)} abandonadas
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPct(s.completionRatePct)}
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
