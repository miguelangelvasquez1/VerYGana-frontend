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
}
