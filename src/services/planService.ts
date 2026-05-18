
import apiClient from '@/lib/api/client';
import { EffectivePlanStateResponseDTO, PlanPaymentRequestDTO, PlanPaymentStatusResponseDTO,  } from "@/types/finance/plans/Plan.types";
import { WompiCheckoutResponseDTO } from "@/types/finance/wompi/Wompi.types";

export const initiatePayment = async (request: PlanPaymentRequestDTO): Promise<WompiCheckoutResponseDTO> => {
  const response = await apiClient.post<WompiCheckoutResponseDTO>('/plans/checkout', request);
  return response.data;
};

export const getPaymentStatus = async (reference: string): Promise<PlanPaymentStatusResponseDTO> => {
  const response = await apiClient.get<PlanPaymentStatusResponseDTO>(`/plans/status/${reference}`);
  return response.data;
};

/**
 * Obtiene el estado efectivo del anunciante autenticado.
 * GET /api/v1/plans/advertiser/me/state
 */
export const getEffectivePlanState = async (): Promise<EffectivePlanStateResponseDTO> => {
  const response = await apiClient.get('/plans/commercial/state');
  return response.data;
};

