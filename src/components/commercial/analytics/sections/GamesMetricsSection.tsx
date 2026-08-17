'use client';

import React from 'react';
import { Gamepad2, Users, Trophy } from 'lucide-react';
import { MetricStatCard } from '../MetricStatCard';
import type { DateRangeFilter } from '../analytics.types';

interface GamesMetricsSectionProps {
  dateRange: DateRangeFilter;
}

export function GamesMetricsSection({ dateRange }: GamesMetricsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Estadísticas de juegos
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({dateRange.startDate} — {dateRange.endDate})
          </span>
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Los datos se mostrarán aquí una vez conectado el endpoint de juegos patrocinados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricStatCard title="Juegos publicados" value="—" icon={Gamepad2} />
        <MetricStatCard title="Partidas jugadas" value="—" icon={Trophy} />
        <MetricStatCard title="Jugadores únicos" value="—" icon={Users} />
      </div>
    </div>
  );
}
