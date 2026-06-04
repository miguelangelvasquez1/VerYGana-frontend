import apiClient from '@/lib/api/client';
import { PricingConfigDTO, PricingType } from '@/types/pricing/PricingConfig.types';

const BASE = '/admin/pricing-configs';

export const getActivePricingConfigs = async (): Promise<PricingConfigDTO[]> => {
  const res = await apiClient.get<PricingConfigDTO[]>(BASE);
  return res.data;
};

export const updatePricingConfig = async (
  type: PricingType,
  value: number
): Promise<PricingConfigDTO> => {
  const res = await apiClient.patch<PricingConfigDTO>(`${BASE}/${type}`, null, {
    params: { value },
  });
  return res.data;
};
