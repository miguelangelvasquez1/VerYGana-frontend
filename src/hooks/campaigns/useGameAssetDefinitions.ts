// hooks/campaigns/useGameAssetDefinitions.ts
import { useQuery } from '@tanstack/react-query';
import { campaignService } from '@/services/campaignService';
import { campaignKeys } from './campaignKeys';

export function useGameAssetDefinitions(gameId: number | null) {
  return useQuery({
    queryKey: campaignKeys.assetDefinitions(gameId!),
    queryFn: () => campaignService.getGameAssetDefinitions(gameId!),
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000, // definiciones son casi estáticas
  });
}
