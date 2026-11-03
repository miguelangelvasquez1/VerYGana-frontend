'use client';

import { useReducer } from 'react';

import {
  INITIAL_DECISION_STATE,
  buildApproveRequest,
  decisionReducer,
  shouldShowManifestationEvidence,
} from '@/lib/formalization/commitmentDecision';
import { useDeclaration } from './useTaxProfile';

// Compromiso de formalización del paso "Revisa tu contrato" (spec 015).
// RN-1: el reductor arranca siempre vacío; nada de `query.data` entra a la decisión.
export function useFormalizationCommitment(contractId: number) {
  const query = useDeclaration('FORMALIZATION_COMMITMENT', 'CONTRACT_SHEET', { enabled: true });
  const [state, dispatch] = useReducer(decisionReducer, INITIAL_DECISION_STATE);

  const showEvidence = query.data
    ? shouldShowManifestationEvidence(query.data.manifestation, query.data.version, contractId)
    : false;

  const buildRequest = () =>
    buildApproveRequest({ view: query.data ?? null, showEvidence, state });

  return { query, state, dispatch, showEvidence, buildRequest };
}
