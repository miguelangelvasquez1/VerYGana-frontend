import apiClient from '@/lib/api/client';
import { ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import {
  PlanChangeRequestRequestDTO,
  PlanChangeRequestResponseDTO,
} from '@/types/finance/plans/PlanChange.types';
import { WompiCheckoutResponseDTO } from '@/types/finance/wompi/Wompi.types';

// Crea la solicitud Y genera el otrosí en un solo paso — status queda en
// CONTRACT_PENDING_REVIEW. El downloadUrl del otrosí recién generado viaja
// en esta misma respuesta (no en GET /current), por eso se devuelve el dato
// crudo del backend en vez de recortarlo al DTO documentado.
export const requestPlanChange = async (
  data: PlanChangeRequestRequestDTO
): Promise<PlanChangeRequestResponseDTO & { contract?: { downloadUrl?: string } }> => {
  const response = await apiClient.post('/plans/change-request', data);
  return response.data;
};

export const getCurrentPlanChangeRequest = async (): Promise<PlanChangeRequestResponseDTO | null> => {
  const response = await apiClient.get<PlanChangeRequestResponseDTO | null>('/plans/change-request/current');
  return response.data;
};

// Solo permitido antes de que el contrato se firme.
export const cancelPlanChangeRequest = async (id: number): Promise<PlanChangeRequestResponseDTO> => {
  const response = await apiClient.post<PlanChangeRequestResponseDTO>(`/plans/change-request/${id}/cancel`);
  return response.data;
};

// El comercial aprueba el otrosí generado -> pasa a revisión de VerYGana.
export const approvePlanChangeContract = async (contractId: number): Promise<ContractSummaryResponseDTO> => {
  const response = await apiClient.post<ContractSummaryResponseDTO>(
    `/plans/change-request/contract/${contractId}/approve`
  );
  return response.data;
};

// Solo si requiredTopUpAmountCents > 0 y status === PAYMENT_PENDING.
export const topUpCheckout = async (id: number): Promise<WompiCheckoutResponseDTO> => {
  const response = await apiClient.post<WompiCheckoutResponseDTO>(`/plans/change-request/${id}/top-up-checkout`);
  return response.data;
};
