// hooks/campaigns/useGames.ts
import { useQuery } from '@tanstack/react-query';
import { campaignService } from '@/services/campaignService';

export function useGames(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: ['games', page, size],
    queryFn: () => campaignService.getGames(page, size),
    staleTime: 60 * 1000,
  });
}
