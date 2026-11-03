import type { OnboardingStep } from "@/services/commercial/OnboardingService";

export const STEP_LABELS = [
  "Términos",
  "Identificación",
  "Diagnóstico",
  "Plan",
  "Documentos",
  "Ficha tributaria",
  "Contrato",
  "Pago",
];

export type WizardStep = Exclude<OnboardingStep, "COMPLETED">;

// Clasificación se muestra como parte de "Diagnóstico" y Firma como parte de
// "Contrato" — comparten el mismo índice del stepper que su paso anterior en
// vez de tener su propia burbuja.
// ADVISOR_CONTACT_PENDING (Ruta D) es terminal: se renderiza como pantalla
// completa sin stepper (ver el return temprano junto a `underReview` en el
// asistente), así que este índice nunca se usa — solo existe para satisfacer el
// tipo Record<WizardStep, number>.
export const STEP_INDEX: Record<WizardStep, number> = {
  TERMS_PENDING: 0,
  LEGAL_IDENTIFICATION_PENDING: 1,
  DIAGNOSTIC_PENDING: 2,
  CLASSIFICATION_PENDING: 2,
  ADVISOR_CONTACT_PENDING: 2,
  PLAN_PENDING: 3,
  DOCUMENTS_PENDING: 4,
  TAX_PROFILE_PENDING: 5,
  CONTRACT_PENDING: 6,
  BUSINESS_REVIEW_PENDING: 6,
  VERYGANA_REVIEW_PENDING: 6,
  SIGNATURE_PENDING: 6,
  PAYMENT_PENDING: 7,
};
