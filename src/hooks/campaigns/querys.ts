import { useQuery } from "@tanstack/react-query";
import { campaignKeys } from "./campaignKeys";
import { campaignService } from "@/services/campaignService";
import { gamesApi } from "@/services/games-campaigns/gameService";

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

// hooks/campaigns/queries.ts
export function useGameSchema(gameId: number | null) {
  return useQuery({
    queryKey: ['game-schema', gameId],
    queryFn: () => {
      if (!gameId) throw new Error('Game ID is required');
      return gamesApi.getGameSchema(gameId);
    },
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000,
  });
}