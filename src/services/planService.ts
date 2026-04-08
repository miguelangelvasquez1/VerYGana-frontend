import { EffectivePlanState } from "@/types/plan";
import apiClient from '@/lib/api/client';

/**
 * Obtiene el estado efectivo del anunciante autenticado.
 * GET /api/v1/plans/advertiser/me/state
 */
export const getEffectivePlanState = async (): Promise<EffectivePlanState> => {
  const response = await apiClient.get('/plans/commercial/state');
  return response.data;
};

/**
 * Registra una venta completada y recibe la comisión calculada.
 * POST /api/v1/plans/advertiser/me/sale
 */
export const processSale = async (saleAmount: number) => {
  const response = await apiClient.post('/plans/commercial/sale', {
    saleAmount,
  });
  return response.data;
};

/**
 * Registra una nueva inversión publicitaria.
 * POST /api/v1/plans/advertiser/me/invest
 */
export const createInvestment = async (params: {
  investmentAmount: number;
  allocatedToAds?: number;
  allocatedToGames?: number;
}) => {
  const response = await apiClient.post('/plans/commercial/invest', params);
  return response.data;
};