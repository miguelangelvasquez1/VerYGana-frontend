export type DeclarationCode = 'FORMALIZATION_COMMITMENT';
export type ManifestationStatus = 'MANIFESTED' | 'NOT_MANIFESTED' | 'EXPRESS_REFUSAL' | 'TECHNICAL_INCIDENT';
export type ManifestationDecision = 'ACCEPT' | 'REFUSE';
export type DisclosureContext = 'TAX_PROFILE' | 'CONTRACT_SHEET';

export interface Manifestation {
  id: number;
  status: ManifestationStatus;
  declarationVersion: string;
  contractId: number;
  contractVersion: number;
  occurredAt: string;
  detail: string | null;          // motivo de la negativa o descripción de la falla
  actorLegalRepName: string | null;
}
export interface DeclarationView {
  code: DeclarationCode;
  version: string;
  fullText: string;               // mostrar LITERAL y completo
  textHash: string;
  manifestation: Manifestation | null;
}
export interface ContractApproveRequest {
  declarationVersion?: string;    // la `version` que se mostró
  decision?: ManifestationDecision | null; // null/omitido = no marcó la casilla
  refusalReason?: string;         // máx 1000, solo con REFUSE
}
