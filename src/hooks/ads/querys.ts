import { useQuery } from "@tanstack/react-query";
import { adKeys } from "./adKeys";
import { adService } from "@/services/adService";

// La `contentUrl` de un anuncio BLOCKED es una URL prefirmada que caduca a los
// ~5 min. Cuando hay alguno visible, re-pedimos por debajo de ese plazo para que
// el media no empiece a dar 403 con la vista abierta.
const BLOCKED_MEDIA_REFRESH_MS = 4 * 60 * 1000;

// Hook para obtener lista de anuncios propia
export function useAds(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: adKeys.list(page, size),
    queryFn: () => adService.getMyAds(page, size),
    staleTime: 30 * 1000, // Los datos son frescos por 30 segundos
    refetchInterval: (query) =>
      query.state.data?.content?.some((ad) => ad.status === 'BLOCKED')
        ? BLOCKED_MEDIA_REFRESH_MS
        : false,
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

// Hook para anuncios activos (consumidores)
export function useActiveAds(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: ['ads', 'active', page, size],
    queryFn: () => adService.getActiveAds(page, size),
    staleTime: 60 * 1000, // Los anuncios activos son más estables
  });
}

export function useAdDetails(adId: number | null) {
  return useQuery({
    queryKey: adKeys.detail(adId!),
    queryFn: () => adService.getAdDetails(adId!),
    enabled: !!adId,
    // Si el anuncio está BLOCKED su `contentUrl` prefirmada caduca a los ~5 min;
    // refrescamos el detalle mientras el modal siga abierto.
    refetchInterval: (query) =>
      query.state.data?.status === 'BLOCKED' ? BLOCKED_MEDIA_REFRESH_MS : false,
  });
}

export function useAdLikes(adId: number | null, page: number) {
  return useQuery({
    queryKey: adKeys.likes(adId!, page),
    queryFn: () => adService.getAdLikes(adId!, page),
    enabled: !!adId,
  });
}