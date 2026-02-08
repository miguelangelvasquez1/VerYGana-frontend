import { useQuery } from "@tanstack/react-query";
import { campaignKeys } from "./campaignKeys";
import { campaignService } from "@/services/campaignService";

export function useCampaigns(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: campaignKeys.list(page, size),
    queryFn: () => campaignService.getMyCampaigns(page, size),
    staleTime: 30 * 1000,
  });
}

export function useGameAssetDefinitions(gameId: number | null) {
  return useQuery({
    queryKey: campaignKeys.assetDefinitions(gameId!),
    queryFn: () => campaignService.getGameAssetDefinitions(gameId!),
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000, // definiciones son casi estáticas
  });
}

export function useGames(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: ['games', page, size],
    queryFn: () => campaignService.getGames(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook para obtener las definiciones de configuración de un juego
 */
export function useGameConfigDefinitions(gameId: number | null) {
  return useQuery({
    queryKey: ['game-config-definitions', gameId],
    queryFn: async () => campaignService.getGameConfigDefinitions(gameId!),
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}