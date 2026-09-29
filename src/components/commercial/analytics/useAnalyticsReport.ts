'use client';

import { useEffect, useState } from 'react';
import type { DateRangeFilter } from './analytics.types';
import { reportErrorMessage } from './reportFormat';

interface ReportState<T> {
  data: T | null;
  loading: boolean;
  /** Mensaje ya resuelto (usa el `message` del 400 del backend cuando aplica). */
  error: string | null;
}

/**
 * Trae un reporte del panel de analíticas para el rango dado. Cancela la
 * request anterior al cambiar el rango y traduce el error 400 "sin permiso"
 * (`{ message }`) a texto mostrable.
 */
export function useAnalyticsReport<T>(
  fetcher: (range: DateRangeFilter, signal: AbortSignal) => Promise<T>,
  dateRange: DateRangeFilter,
): ReportState<T> {
  const [state, setState] = useState<ReportState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetcher(dateRange, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Error cargando reporte de analíticas:', err);
        setState({ data: null, loading: false, error: reportErrorMessage(err) });
      });

    return () => controller.abort();
    // `fetcher` se asume estable (import de módulo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate]);

  return state;
}
