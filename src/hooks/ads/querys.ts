import { useQuery } from "@tanstack/react-query";
import { adKeys } from "./adKeys";
import { adService } from "@/services/adService";

// Hook para obtener lista de anuncios propia
export function useAds(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: adKeys.list(page, size),
    queryFn: () => adService.getMyAds(page, size),
    staleTime: 30 * 1000, // Los datos son frescos por 30 segundos
  });
}

// Hook para obtener un anuncio específico
export function useAd(adId: number | null) {
  return useQuery({
    queryKey: adKeys.detail(adId!),
    queryFn: () => adService.getAdById(adId!),
    enabled: !!adId, // Solo ejecuta si hay un ID
  });
}

// Hook para estadísticas de un anuncio
export function useAdStats(adId: number | null) {
  return useQuery({
    queryKey: adKeys.stats(adId!),
    queryFn: () => adService.getAdStats(adId!),
    enabled: !!adId,
  });
}

// Hook para anuncios activos (consumidores)
export function useActiveAds(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: ['ads', 'active', page, size],
    queryFn: () => adService.getActiveAds(page, size),
    staleTime: 60 * 1000, // Los anuncios activos son más estables
  });
}
