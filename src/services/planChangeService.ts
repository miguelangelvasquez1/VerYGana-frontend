import apiClient from '@/lib/api/client';
import { ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import {
  PlanChangePreviewResponseDTO,
  PlanChangeRequestRequestDTO,
  PlanChangeRequestResponseDTO,
} from '@/types/finance/plans/PlanChange.types';
import { WompiCheckoutResponseDTO } from '@/types/finance/wompi/Wompi.types';

// Solo lectura, sin efectos secundarios — se puede llamar tan seguido como se
// quiera (ej. en cada tecla con debounce) sin duplicar solicitudes.
export const previewPlanChange = async (
  targetPlanCode: PlanCode,
  intendedInvestmentAmountCents?: number
): Promise<PlanChangePreviewResponseDTO> => {
  const response = await apiClient.get<PlanChangePreviewResponseDTO>('/plans/change-request/preview', {
    params: {
      targetPlanCode,
      ...(intendedInvestmentAmountCents ? { intendedInvestmentAmountCents } : {}),
    },
  });
  return response.data;
};

// Crea la solicitud Y genera el otrosí en un solo paso — contractStatus queda
// en PENDING_BUSINESS_REVIEW. La respuesta ya incluye contractDownloadUrl (PDF
// del otrosí) igual que GET /current; no hace falta guardarla aparte.
export const requestPlanChange = async (
  data: PlanChangeRequestRequestDTO
): Promise<PlanChangeRequestResponseDTO> => {
  const response = await apiClient.post<PlanChangeRequestResponseDTO>('/plans/change-request', data);
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

// El comercial da por leído el rechazo de VerYGana. Idempotente; devuelve 400
// si la solicitud no está en estado REJECTED. Tras el 200, GET /current vuelve
// a devolver null y el comercial puede crear una solicitud nueva desde cero.
export const acknowledgePlanChangeRejection = async (id: number): Promise<PlanChangeRequestResponseDTO> => {
  const response = await apiClient.post<PlanChangeRequestResponseDTO>(
    `/plans/change-request/${id}/acknowledge-rejection`
  );
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
