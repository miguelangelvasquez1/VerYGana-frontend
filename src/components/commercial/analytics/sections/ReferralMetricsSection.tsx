'use client';

import React from 'react';
import { Eye, MousePointer, Percent } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import type { DateRangeFilter } from '../analytics.types';

interface ReferralMetricsSectionProps {
  dateRange: DateRangeFilter;
}

// Métricas de remisión: impresiones y clics generados por los enlaces/códigos
// de remisión del comerciante. Exclusivas del plan Premium.
export function ReferralMetricsSection({ dateRange }: ReferralMetricsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Métricas de remisión
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({dateRange.startDate} — {dateRange.endDate})
          </span>
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Los datos se mostrarán aquí una vez conectado el endpoint de remisión.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricStatCard title="Impresiones de remisión" value="—" icon={Eye} />
        <MetricStatCard title="Clics de remisión" value="—" icon={MousePointer} />
        <MetricStatCard title="CTR de remisión" value="—" icon={Percent} />
      </div>
    </div>
  );
}
