// hooks/ads/adminQueries.ts
import { useQuery } from '@tanstack/react-query';
import { adService } from '@/services/adService';

// Query keys para admin
export const adminAdKeys = {
  all: ['admin', 'ads'] as const,
  lists: () => [...adminAdKeys.all, 'list'] as const,
  list: (page: number, size: number, status?: string) => 
    [...adminAdKeys.lists(), { page, size, status }] as const,
  pending: (page: number, size: number) =>
    [...adminAdKeys.all, 'pending', { page, size }] as const,
};

// Hook para obtener anuncios pendientes (Admin)
export function usePendingAds(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: adminAdKeys.pending(page, size),
    queryFn: () => adService.getPendingAds(page, size),
    staleTime: 30 * 1000, // 30 segundos
  });
}

// Hook para obtener todos los anuncios (Admin) con filtros
export function useAllAdsAdmin(page: number = 0, size: number = 20, status?: string) {
  return useQuery({
    queryKey: adminAdKeys.list(page, size, status),
    queryFn: () => adService.getAllAds(page, size, status),
    staleTime: 30 * 1000,
  });
}