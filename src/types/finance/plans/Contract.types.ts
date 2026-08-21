// Estado completo del contrato en el backend — el `ContractStatus` que vive
// dentro de OnboardingService.ts solo cubre los 4 valores previos a la firma
// (nunca observó PENDING_SIGNATURE/SIGNED porque el wizard de onboarding
// sigue el paso por OnboardingStatus.currentStep, no por contract.status).
// Este es el enum completo, usado por recarga y cambio de plan.
export type ContractStatus =
  | "PENDING_BUSINESS_REVIEW"
  | "PENDING_VERYGANA_REVIEW"
  | "APPROVED"
  | "PENDING_SIGNATURE"
  | "SIGNED"
  | "REJECTED";

export interface ContractSummaryResponseDTO {
  contractId: number;
  version: number;
  status: ContractStatus;
  generatedAt: string;
  businessApprovedAt: string | null;
  veryganaReviewedAt: string | null;
  veryganaDecisionNotes: string | null;
  esignatureSentAt: string | null;
  esignatureSignedAt: string | null;
  downloadUrl: string;
  // Siempre vacío para recarga/cambio de plan — no aplica mostrar esa sección.
  documents: unknown[];
}
