import apiClient from '@/lib/api/client';
import { ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import { OpenRechargeResponseDTO, RechargePreviewResponseDTO } from '@/types/finance/plans/PlanRecharge.types';
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

// Recarga en curso del comercial (solo puede haber una). 204 → null. Es la
// fuente de verdad para retomar un flujo interrumpido: no hace falta guardar
// el contractId en el navegador.
export const getCurrentRecharge = async (): Promise<OpenRechargeResponseDTO | null> => {
  const response = await apiClient.get<OpenRechargeResponseDTO | ''>('/plans/recharge/current');
  return response.status === 204 || !response.data ? null : response.data;
};

// Verifica el pago contra Wompi. 204 → null: la recarga quedó pagada. 200 →
// sigue en curso, devuelve el objeto actualizado.
export const reconcileRecharge = async (contractId: number): Promise<OpenRechargeResponseDTO | null> => {
  const response = await apiClient.post<OpenRechargeResponseDTO | ''>(`/plans/recharge/${contractId}/reconcile`);
  return response.status === 204 || !response.data ? null : response.data;
};

// 400 si el contrato no está SIGNED. Se puede volver a llamar para retomar o
// reintentar el pago (genera un checkout nuevo).
export const rechargeCheckout = async (contractId: number): Promise<WompiCheckoutResponseDTO> => {
  const response = await apiClient.post<WompiCheckoutResponseDTO>(`/plans/recharge/${contractId}/checkout`);
  return response.data;
};

// Autocancelación de la recarga por parte del comercial. Funciona aunque ya
// se hubiera abierto el checkout. Devuelve el contrato con status "CANCELLED".
// 422 con `message` legible si la recarga ya estaba pagada, hay un pago en
// proceso o no se pudo verificar con la pasarela — mostrar ese message tal
// cual y re-consultar /plans/recharge/current.
export const cancelRecharge = async (contractId: number): Promise<ContractSummaryResponseDTO> => {
  const response = await apiClient.post<ContractSummaryResponseDTO>(`/plans/recharge/${contractId}/cancel`);
  return response.data;
};
