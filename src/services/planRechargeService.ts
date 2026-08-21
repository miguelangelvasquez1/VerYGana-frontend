import apiClient from '@/lib/api/client';
import { ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import { WompiCheckoutResponseDTO } from '@/types/finance/wompi/Wompi.types';

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
