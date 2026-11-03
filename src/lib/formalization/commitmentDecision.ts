import type {
  ContractApproveRequest,
  DeclarationView,
  Manifestation,
  ManifestationDecision,
} from '@/types/commercial/Declaration.types';

// Sin 'use client': funciones puras que se prueban en Vitest (spec 015).

export interface CommitmentDecisionState {
  decision: ManifestationDecision | null;
  refusalReason: string;
}

export type DecisionAction =
  | { type: 'toggleAccept'; checked: boolean }
  | { type: 'confirmRefusal'; reason: string }
  | { type: 'undoRefusal' };

// RN-1: la casilla siempre arranca vacía; nada de la API ni del almacenamiento entra aquí.
export const INITIAL_DECISION_STATE: CommitmentDecisionState = Object.freeze({
  decision: null,
  refusalReason: '',
});

export function decisionReducer(
  state: CommitmentDecisionState,
  action: DecisionAction,
): CommitmentDecisionState {
  switch (action.type) {
    case 'toggleAccept':
      // Con una negativa la casilla está deshabilitada.
      if (state.decision === 'REFUSE') return state;
      return { decision: action.checked ? 'ACCEPT' : null, refusalReason: '' };
    case 'confirmRefusal':
      return { decision: 'REFUSE', refusalReason: action.reason.trim() };
    case 'undoRefusal':
      return INITIAL_DECISION_STATE;
  }
}

// RN-5: evidencia solo si es MANIFESTED, del texto vigente y del contrato que se aprueba.
export function shouldShowManifestationEvidence(
  manifestation: Manifestation | null,
  currentVersion: string,
  contractId: number,
): boolean {
  return (
    manifestation !== null &&
    manifestation.status === 'MANIFESTED' &&
    manifestation.declarationVersion === currentVersion &&
    manifestation.contractId === contractId
  );
}

// RN-6 y RN-7: el cuerpo de la aprobación.
export function buildApproveRequest({
  view,
  showEvidence,
  state,
}: {
  view: DeclarationView | null;
  showEvidence: boolean;
  state: CommitmentDecisionState;
}): ContractApproveRequest {
  if (!view) return {};
  const body: ContractApproveRequest = { declarationVersion: view.version };
  if (showEvidence || state.decision === null) return body;
  body.decision = state.decision;
  if (state.decision === 'REFUSE' && state.refusalReason) body.refusalReason = state.refusalReason;
  return body;
}
