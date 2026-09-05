import { PlanCode } from "./Plan.types";
import { ContractStatus } from "./Contract.types";

export type PlanChangeRequestStatus =
  | "REQUESTED"
  | "CONTRACT_PENDING_REVIEW"
  | "CONTRACT_SIGNED"
  | "PAYMENT_PENDING"
  | "APPLIED"
  | "REJECTED"
  | "CANCELLED";

export interface PlanChangeRequestRequestDTO {
  targetPlanCode: PlanCode;
  intendedInvestmentAmountCents?: number;
}

export interface PlanChangeRequestResponseDTO {
  id: number;
  fromPlanCode: PlanCode | null;
  toPlanCode: PlanCode;
  requiredTopUpAmountCents: number | null;
  status: PlanChangeRequestStatus;
  contractId: number | null;
  contractStatus: ContractStatus | null;
  requestedAt: string;
  appliedAt: string | null;
  // URL pre-firmada al PDF del otrosí, con TTL corto (~5 min) — NO cachear.
  // Volver a pedir GET /plans/change-request/current cada vez que se abra la
  // vista o antes de reintentar la descarga. null = contrato aún no generado
  // o cancelado (al cancelar, el PDF se borra del almacenamiento).
  contractDownloadUrl: string | null;
  // Solo poblados cuando VerYGana rechazó la solicitud. Mientras
  // rejectionAcknowledgedAt sea null, GET /current sigue devolviendo esta
  // solicitud (status "REJECTED") para que el comercial lea el motivo;
  // tras dar por leído el rechazo, /current vuelve a devolver null.
  rejectionReason: string | null;
  rejectionAcknowledgedAt: string | null;
}

// OJO: pese al nombre histórico *Cents en otros DTO, GET
// /plans/change-request/preview devuelve estos montos en PESOS colombianos
// enteros, no en centavos (consistente con /plans/recharge/preview).
// Formatéalos directo (formatCOP/formatBudget), sin dividir por 100. El query
// param de entrada sí sigue en centavos (?intendedInvestmentAmountCents=...).
export interface PlanChangePreviewResponseDTO {
  fromPlanCode: PlanCode | null;
  toPlanCode: PlanCode;
  eligible: boolean;
  message: string;
  requiredTopUpAmountPesos: number | null;
  currentWalletBalancePesos: number;
  targetMonthlyPricePesos: number | null;
  targetMinInvestmentPesos: number | null;
  targetMaxInvestmentPesos: number | null;
  targetSaleCommissionPct: number;
}
