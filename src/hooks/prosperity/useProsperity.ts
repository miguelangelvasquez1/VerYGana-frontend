'use client';

import { useCallback } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import * as CommercialProsperity from '@/services/commercial/ProsperityService';
import * as AdminProsperity from '@/services/admin/AdminProsperityService';

// Saldo de Prosperidad (MP-05). El resumen del empresario se comparte entre
// la tarjeta del dashboard, la página propia, el ítem del menú y los labels
// de recarga/cambio de plan — react-query lo pide una sola vez.
export const prosperityKeys = {
  summary: ['prosperity', 'summary'] as const,
  movements: (page: number, size: number) => ['prosperity', 'movements', page, size] as const,
  admin: (publicId: string) => ['admin', 'prosperity', publicId] as const,
  adminSummary: (publicId: string) => ['admin', 'prosperity', publicId, 'summary'] as const,
  adminMovements: (publicId: string, page: number, size: number) =>
    ['admin', 'prosperity', publicId, 'movements', page, size] as const,
};

export const PROSPERITY_PAGE_SIZE = 20;

// ─── Empresario ──────────────────────────────────────────────────────────────

export function useProsperitySummary(enabled = true) {
  return useQuery({
    queryKey: prosperityKeys.summary,
    queryFn: CommercialProsperity.getSummary,
    staleTime: 60_000,
    enabled,
    retry: 1,
  });
}

export function useProsperityMovements(page: number, size = PROSPERITY_PAGE_SIZE) {
  return useQuery({
    queryKey: prosperityKeys.movements(page, size),
    queryFn: () => CommercialProsperity.getMovements(size, page),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useAdminProsperitySummary(publicId: string | null) {
  return useQuery({
    queryKey: prosperityKeys.adminSummary(publicId ?? ''),
    queryFn: () => AdminProsperity.getSummary(publicId!),
    enabled: !!publicId,
    staleTime: 15_000,
  });
}

export function useAdminProsperityMovements(
  publicId: string | null,
  page: number,
  size = PROSPERITY_PAGE_SIZE,
) {
  return useQuery({
    queryKey: prosperityKeys.adminMovements(publicId ?? '', page, size),
    queryFn: () => AdminProsperity.getMovements(publicId!, size, page),
    enabled: !!publicId,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

// Recarga resumen + Libro Mayor tras una reversión o un ajuste.
export function useInvalidateAdminProsperity() {
  const queryClient = useQueryClient();
  return useCallback(
    (publicId: string) =>
      queryClient.invalidateQueries({ queryKey: prosperityKeys.admin(publicId) }),
    [queryClient],
  );
}
