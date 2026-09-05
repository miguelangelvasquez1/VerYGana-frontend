import apiClient from '@/lib/api/client';
import { ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import { RechargePreviewResponseDTO } from '@/types/finance/plans/PlanRecharge.types';
import { WompiCheckoutResponseDTO } from '@/types/finance/wompi/Wompi.types';

// Solo lectura, sin efectos secundarios — se puede llamar tan seguido como se
// quiera (ej. en cada tecla con debounce) sin duplicar contratos.
export const previewRecharge = async (amountCents: number): Promise<RechargePreviewResponseDTO> => {
  const response = await apiClient.get<RechargePreviewResponseDTO>('/plans/recharge/preview', {
    params: { amountCents },
  });
  return response.data;
};

// Recarga STANDARD/PREMIUM — el contrato generado llega directo a
// PENDING_SIGNATURE (sin pasar por revisión humana), apenas se solicita.
export const requestRecharge = async (amountCents: number): Promise<ContractSummaryResponseDTO> => {
  const response = await apiClient.post<ContractSummaryResponseDTO>('/plans/recharge/request', { amountCents });
  return response.data;
};

export const getRechargeContract = async (contractId: number): Promise<ContractSummaryResponseDTO> => {
  const response = await apiClient.get<ContractSummaryResponseDTO>(`/plans/recharge/${contractId}`);
  return response.data;
};

// 400 si el contrato no está SIGNED.
export const rechargeCheckout = async (contractId: number): Promise<WompiCheckoutResponseDTO> => {
  const response = await apiClient.post<WompiCheckoutResponseDTO>(`/plans/recharge/${contractId}/checkout`);
  return response.data;
};

// Autocancelación de la recarga por parte del comercial. Solo mientras el
// contrato siga en un estado cancelable (APPROVED | PENDING_SIGNATURE | SIGNED)
// y aún no haya generado un pago. Devuelve el contrato con status "CANCELLED".
// 4xx (BusinessException) con `message` legible si la recarga ya generó un
// pago, el contrato ya no está en un estado cancelable o no es de tipo
// recarga — mostrar ese message tal cual.
export const cancelRecharge = async (contractId: number): Promise<ContractSummaryResponseDTO> => {
  const response = await apiClient.post<ContractSummaryResponseDTO>(`/plans/recharge/${contractId}/cancel`);
  return response.data;
};
