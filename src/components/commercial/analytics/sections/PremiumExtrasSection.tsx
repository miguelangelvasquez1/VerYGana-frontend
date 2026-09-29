'use client';

import React from 'react';
import type { DateRangeFilter } from '../analytics.types';
import { PetStoreMetrics } from '../PetStoreMetrics';

interface PremiumExtrasSectionProps {
  dateRange: DateRangeFilter;
}

// Métricas exclusivas Premium: consumo en la tienda virtual de mascotas por
// producto patrocinado. Las visualizaciones de la página oficial viven ahora en
// la pestaña "Remisión".
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
          Rendimiento de tus productos dentro del juego de mascotas. Las visitas a
          tu página oficial están en la pestaña <span className="font-medium">Remisión</span>.
        </p>
      </div>

      <div>
        <div className="mb-3">
          <h4 className="text-base font-semibold text-gray-900">Tienda de mascotas</h4>
          {/* Explícito a propósito: quien abre un panel de métricas asume que mide
              alcance, y aquí no hay impresiones porque el juego no las reporta. */}
          <p className="text-sm text-gray-500">
            Estas cifras miden ventas, no visualizaciones.
          </p>
        </div>
        <PetStoreMetrics dateRange={dateRange} />
      </div>
    </div>
  );
}
