import { PlanCode } from "./Plan.types";

// OJO: pese al nombre histórico, GET /plans/recharge/preview devuelve estos
// montos en PESOS colombianos enteros, no en centavos. Formatéalos directo
// (formatBudget), sin dividir por 100. El query param de entrada sí sigue en
// centavos (?amountCents=...).
export interface RechargePreviewResponseDTO {
  planCode: PlanCode | null;
  eligible: boolean;
  message: string;
  requestedAmountPesos: number;
  vatAmountPesos: number;
  totalToPayPesos: number;
  minInvestmentPesos: number | null;
  maxInvestmentPesos: number | null;
  currentWalletBalancePesos: number;
  estimatedCreditedAmountPesos: number;
  resultingWalletBalancePesos: number;
  // Recarga en curso del comercial (misma forma que GET /plans/recharge/current),
  // o null si no hay ninguna.
  openRecharge: OpenRechargeResponseDTO | null;
}

// SIGN: falta firmar · PAY: firmada, falta pagar · RETRY_PAYMENT: el último
// pago fue rechazado · WAIT_PAYMENT: hay un pago procesándose (solo lo
// devuelve /reconcile).
export type RechargeNextAction = 'SIGN' | 'PAY' | 'RETRY_PAYMENT' | 'WAIT_PAYMENT';

// Recarga en curso — GET /plans/recharge/current. Montos en PESOS, no en
// centavos. `message` viene listo para mostrar. Si no se paga antes de
// `expiresAt`, el backend la cancela sola.
export interface OpenRechargeResponseDTO {
  contractId: number;
  status: string;
  nextAction: RechargeNextAction;
  message: string;
  amountPesos: number;
  vatAmountPesos: number;
  totalToPayPesos: number;
  generatedAt: string;
  signedAt: string | null;
  expiresAt: string;
  paymentAttempted: boolean;
}
