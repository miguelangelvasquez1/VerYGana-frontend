'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import { PetStoreMetrics } from '../PetStoreMetrics';
import type { DateRangeFilter } from '../analytics.types';

interface PremiumExtrasSectionProps {
  dateRange: DateRangeFilter;
}

// Métricas exclusivas Premium: visualizaciones de la página oficial del
// empresario y consumo en la tienda virtual de mascotas por producto patrocinado.
//
// La parte de mascotas ya está conectada; la de la página oficial sigue esperando
// su endpoint y por eso mantiene el "—".
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
          Rendimiento de tus productos dentro del juego de mascotas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <MetricStatCard
          title="Visualizaciones a página oficial"
          value="—"
          icon={Globe}
          subtitle="Pendiente de conectar su endpoint"
        />
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
