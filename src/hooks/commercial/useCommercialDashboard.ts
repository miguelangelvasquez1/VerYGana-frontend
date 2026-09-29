'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getCommercialDashboardSummary } from '@/services/commercial/DashboardService';
import { DashboardPeriodType } from '@/types/commercial/Dashboard.types';

export const commercialDashboardKeys = {
  summary: (period: DashboardPeriodType) =>
    ['commercial-dashboard', 'summary', period] as const,
};

// Carga el resumen del panel de inicio. Al cambiar el periodo se re-consulta;
// `keepPreviousData` deja los datos anteriores visibles mientras llega el nuevo
// resultado para que no parpadee toda la pantalla.
export function useCommercialDashboard(period: DashboardPeriodType) {
  return useQuery({
    queryKey: commercialDashboardKeys.summary(period),
    queryFn: () => getCommercialDashboardSummary(period),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
