'use client';

import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { PerformanceChart } from '../PerformanceChart';
import AdsTable from '../AdsTable';
import type { DateRangeFilter } from '../analytics.types';

type AdMetric = 'all' | 'impressions' | 'clicks' | 'ctr';

interface AdsMetricsSectionProps {
  dateRange: DateRangeFilter;
}

export function AdsMetricsSection({ dateRange }: AdsMetricsSectionProps) {
  const [metric, setMetric] = useState<AdMetric>('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as AdMetric)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
        >
          <option value="all">Todas las métricas</option>
          <option value="impressions">Solo impresiones</option>
          <option value="clicks">Solo clicks</option>
          <option value="ctr">Solo CTR</option>
        </select>
      </div>

      <PerformanceChart
        metric={metric === 'all' ? undefined : metric}
        dateRange={dateRange}
      />
      <AdsTable dateRange={dateRange} />
    </div>
  );
}
