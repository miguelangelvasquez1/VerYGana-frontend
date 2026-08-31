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

// Tipos de activo del comercial que el preview del cambio de plan puede
// reportar como excedidos respecto al plan destino.
export type PlanChangeAssetType = "PRODUCTS" | "ADS" | "BRANDED_GAMES" | "SURVEYS";

// Un activo que el comercial tiene por encima de lo que permite el plan
// destino. Los activos NO se pueden eliminar: el comercial espera a que
// finalicen o pide su cancelación al soporte de VerYGana. `message` viene
// en español, listo para mostrar tal cual.
export interface PlanChangeBlockerDTO {
  assetType: PlanChangeAssetType;
  assetLabel: string;          // "productos" | "anuncios" | "juegos brandeados" | "encuestas"
  currentCount: number;        // cuántos tiene activos ahora
  allowedByTargetPlan: number; // cuántos permite el plan destino (0 = no admite ese tipo)
  excessCount: number;         // cuántos sobran (deben finalizar) para poder cambiar
  message: string;             // texto de ayuda listo para mostrar
}

// OJO: pese al nombre histórico *Cents en otros DTO, GET
// /plans/change-request/preview devuelve estos montos en PESOS colombianos
// enteros, no en centavos (consistente con /plans/recharge/preview).
// Formatéalos directo (formatCOP/formatBudget), sin dividir por 100. El query
// param de entrada sí sigue en centavos (?intendedInvestmentAmountCents=...).
export interface PlanChangePreviewResponseDTO {
  fromPlanCode: PlanCode | null;
  toPlanCode: PlanCode;
  // `false` también cuando `blockers` no está vacío (activos que exceden el
  // plan destino), además del caso de bajar a BASIC con saldo publicitario > 0.
  eligible: boolean;
  // Describe TODO lo que falta ajustar cuando eligible=false (saldo y/o
  // activos). Listo para mostrar tal cual.
  message: string;
  requiredTopUpAmountPesos: number | null;
  currentWalletBalancePesos: number;
  targetMonthlyPricePesos: number | null;
  targetMinInvestmentPesos: number | null;
  targetMaxInvestmentPesos: number | null;
  targetSaleCommissionPct: number;
  // Vacío cuando todos los activos caben en el plan destino. Una fila por
  // tipo de activo excedido. Los activos NO se migran al nuevo plan.
  blockers: PlanChangeBlockerDTO[];
}
