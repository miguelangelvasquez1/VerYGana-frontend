'use client';

import { useQuery } from '@tanstack/react-query';
import { getCampaignGoals } from '@/services/BrandingRequestService';

export const campaignGoalsKeys = {
  all: ['campaignGoals'] as const,
};

export function useCampaignGoals() {
  const query = useQuery({
    queryKey: campaignGoalsKeys.all,
    queryFn: () => getCampaignGoals(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });

  return {
    goals: query.data ?? [],
    loading: query.isLoading,
  };
}
