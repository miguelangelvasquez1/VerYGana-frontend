'use client';

import React from 'react';
import { ClipboardList, Users, CheckCircle2 } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import type { DateRangeFilter } from '../analytics.types';

interface SurveysMetricsSectionProps {
  dateRange: DateRangeFilter;
}

export function SurveysMetricsSection({ dateRange }: SurveysMetricsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Estadísticas de encuestas
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({dateRange.startDate} — {dateRange.endDate})
          </span>
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Los datos se mostrarán aquí una vez conectado el endpoint de encuestas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricStatCard title="Encuestas activas" value="—" icon={ClipboardList} />
        <MetricStatCard title="Respuestas totales" value="—" icon={Users} />
        <MetricStatCard title="Tasa de finalización" value="—" icon={CheckCircle2} />
      </div>
    </div>
  );
}
