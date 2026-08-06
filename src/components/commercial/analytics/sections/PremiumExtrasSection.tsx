'use client';

import React from 'react';
import { Globe, PawPrint } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import type { DateRangeFilter } from '../analytics.types';

interface PremiumExtrasSectionProps {
  dateRange: DateRangeFilter;
}

// Métricas exclusivas Premium: visualizaciones de la página oficial del
// empresario y consumo en la tienda virtual de mascotas por producto patrocinado.
export function PremiumExtrasSection({ dateRange }: PremiumExtrasSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Métricas Premium
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({dateRange.startDate} — {dateRange.endDate})
          </span>
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Los datos se mostrarán aquí una vez conectados sus endpoints correspondientes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricStatCard
          title="Visualizaciones a página oficial"
          value="—"
          icon={Globe}
          subtitle="Visitas a la página oficial del empresario"
        />
        <MetricStatCard
          title="Consumos en tienda de mascotas"
          value="—"
          icon={PawPrint}
          subtitle="Por producto patrocinado en la tienda virtual"
        />
      </div>
    </div>
  );
}
