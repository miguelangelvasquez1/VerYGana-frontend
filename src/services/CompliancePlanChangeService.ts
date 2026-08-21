import apiClient from '@/lib/api/client';
import { PlanCode } from '@/types/finance/plans/Plan.types';
import { ContractStatus, ContractSummaryResponseDTO } from '@/types/finance/plans/Contract.types';
import { PlanChangeRequestStatus } from '@/types/finance/plans/PlanChange.types';

// Cola de compliance para solicitudes de cambio de plan — separada del
// ComplianceService.ts existente porque ese archivo usa el ContractStatus
// angosto de OnboardingService.ts (sin PENDING_SIGNATURE/SIGNED), mientras
// que un otrosí de cambio de plan sí puede llegar a esos estados.

export interface PlanChangeReviewListItemDTO {
  id: number;
  commercialId: number;
  companyName: string;
  email: string;
  fromPlanCode: PlanCode | null;
  toPlanCode: PlanCode;
  requiredTopUpAmountCents: number | null;
  status: PlanChangeRequestStatus;
  // usar este id para las acciones de aprobar/rechazar/marcar firmado.
  contractId: number | null;
  contractStatus: ContractStatus | null;
  requestedAt: string;
  appliedAt: string | null;
}

// Trae todas las solicitudes no terminales (todo menos APPLIED/REJECTED/CANCELLED) — no acepta filtro por estado.
export const getPlanChangeReviewQueue = async (): Promise<PlanChangeReviewListItemDTO[]> => {
  const res = await apiClient.get('/compliance/plan-changes');
  return res.data;
};

// Mismo endpoint que usa el detalle de contratos de onboarding
// (GET /compliance/contracts/{id}) — tipado contra el DTO ancho del lado
// comercial de cambio de plan, que es el que realmente describe la forma
// de respuesta para este tipo de contrato.
export const getPlanChangeContractForReview = async (contractId: number): Promise<ContractSummaryResponseDTO> => {
  const res = await apiClient.get(`/compliance/contracts/${contractId}`);
  return res.data;
};
