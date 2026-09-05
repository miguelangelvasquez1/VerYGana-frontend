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
  minInvestmentPesos: number | null;
  maxInvestmentPesos: number | null;
  currentWalletBalancePesos: number;
  estimatedCreditedAmountPesos: number;
  resultingWalletBalancePesos: number;
}
