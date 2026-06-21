import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getActivePricingConfigs,
  updatePricingConfig,
} from '@/services/admin/AdminPricingService';
import { PricingType } from '@/types/pricing/PricingConfig.types';

export const pricingKeys = {
  all: ['pricing'] as const,
  active: () => [...pricingKeys.all, 'active'] as const,
};

export function useActivePricingConfigs() {
  return useQuery({
    queryKey: pricingKeys.active(),
    queryFn: getActivePricingConfigs,
    staleTime: 60 * 1000,
  });
}

export function useUpdatePricingConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, value }: { type: PricingType; value: number }) =>
      updatePricingConfig(type, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pricingKeys.active() });
    },
  });
}
