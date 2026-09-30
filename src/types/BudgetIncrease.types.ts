/**
 * Aumento de presupuesto de un activo (anuncio, encuesta o campaña).
 * Todos los montos van en centavos.
 */

/** Respuesta común de POST /ads|surveys|campaigns/{id}/increase-budget. */
export interface BudgetIncreaseResponse {
  assetId: number;
  /** Monto descontado de la wallet por este aumento. */
  chargedCents: number;
  /** Presupuesto total del activo después del aumento. */
  totalBudgetCents: number;
  /** Presupuesto aún no consumido del activo después del aumento. */
  remainingBudgetCents: number;
  /** Estado del activo después del aumento. */
  status: string;
  /** true si el activo estaba COMPLETED y el aumento lo volvió a poner en circulación. */
  reopened: boolean;
  /** Saldo de la wallet después del cobro. */
  walletBalanceCents: number;
}

/**
 * Cada request lleva la capacidad que el cliente ve hoy (`expected*`). Es la protección contra el
 * doble cobro: solo un aumento cambia esa capacidad, así que un envío repetido (doble clic,
 * reintento tras perder la respuesta, otra pestaña) ya no la encuentra igual y el backend
 * responde 409 sin cobrar.
 */
export interface IncreaseAdBudgetRequest {
  expectedMaxLikes: number;
  additionalLikes: number;
}

export interface IncreaseSurveyBudgetRequest {
  expectedMaxResponses: number;
  additionalResponses: number;
}

export interface IncreaseCampaignBudgetRequest {
  expectedBudgetCents: number;
  additionalBudgetCents: number;
}

/** Estados en los que el backend admite aumentar el presupuesto (anuncios, encuestas y campañas). */
export const BUDGET_INCREASE_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED'] as const;

export const canIncreaseBudget = (status: string | null | undefined): boolean =>
  !!status && (BUDGET_INCREASE_STATUSES as readonly string[]).includes(status);
