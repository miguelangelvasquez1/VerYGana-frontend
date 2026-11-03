import { describe, expect, it } from 'vitest';
import {
  INITIAL_DECISION_STATE,
  buildApproveRequest,
  decisionReducer,
  shouldShowManifestationEvidence,
  type CommitmentDecisionState,
} from '@/lib/formalization/commitmentDecision';
import type { DeclarationView, Manifestation } from '@/types/commercial/Declaration.types';

const view = (manifestation: Manifestation | null = null): DeclarationView => ({
  code: 'FORMALIZATION_COMMITMENT',
  version: '1.0',
  fullText: 'texto',
  textHash: 'h',
  manifestation,
});

const manifestation = (over: Partial<Manifestation> = {}): Manifestation => ({
  id: 1,
  status: 'MANIFESTED',
  declarationVersion: '1.0',
  contractId: 7,
  contractVersion: 1,
  occurredAt: '2026-10-27T22:00:00Z',
  detail: null,
  actorLegalRepName: null,
  ...over,
});

const accept: CommitmentDecisionState = { decision: 'ACCEPT', refusalReason: '' };
const refuse = (reason: string): CommitmentDecisionState => ({ decision: 'REFUSE', refusalReason: reason });

describe('estado inicial (RN-1)', () => {
  it('vacío y congelado', () => {
    expect(INITIAL_DECISION_STATE).toEqual({ decision: null, refusalReason: '' });
    expect(Object.isFrozen(INITIAL_DECISION_STATE)).toBe(true);
  });
});

describe('decisionReducer (RN-3)', () => {
  it('toggleAccept marca y desmarca', () => {
    expect(decisionReducer(INITIAL_DECISION_STATE, { type: 'toggleAccept', checked: true }).decision).toBe('ACCEPT');
    expect(decisionReducer(accept, { type: 'toggleAccept', checked: false }).decision).toBeNull();
  });

  it('confirmRefusal recorta el motivo; en blanco queda vacío', () => {
    expect(
      decisionReducer(INITIAL_DECISION_STATE, { type: 'confirmRefusal', reason: '  Lo revisaré con mi contador.  ' }),
    ).toEqual({ decision: 'REFUSE', refusalReason: 'Lo revisaré con mi contador.' });
    expect(decisionReducer(INITIAL_DECISION_STATE, { type: 'confirmRefusal', reason: '   ' })).toEqual({
      decision: 'REFUSE',
      refusalReason: '',
    });
  });

  it('con REFUSE, toggleAccept no cambia nada', () => {
    const state = refuse('x');
    expect(decisionReducer(state, { type: 'toggleAccept', checked: true })).toEqual(state);
  });

  it('undoRefusal vuelve al estado inicial', () => {
    expect(decisionReducer(refuse('x'), { type: 'undoRefusal' })).toEqual(INITIAL_DECISION_STATE);
  });

  it('no muta el estado anterior', () => {
    const state = Object.freeze({ ...accept });
    decisionReducer(state, { type: 'toggleAccept', checked: false });
    decisionReducer(state, { type: 'confirmRefusal', reason: 'a' });
    decisionReducer(state, { type: 'undoRefusal' });
    expect(state).toEqual(accept);
  });
});

describe('shouldShowManifestationEvidence (RN-5)', () => {
  it('solo MANIFESTED, misma versión y mismo contrato', () => {
    expect(shouldShowManifestationEvidence(manifestation(), '1.0', 7)).toBe(true);
  });
  it('otra versión, otro contrato, otro estado o nula: no', () => {
    expect(shouldShowManifestationEvidence(manifestation({ declarationVersion: '0.9' }), '1.0', 7)).toBe(false);
    expect(shouldShowManifestationEvidence(manifestation({ contractId: 8 }), '1.0', 7)).toBe(false);
    for (const status of ['NOT_MANIFESTED', 'EXPRESS_REFUSAL', 'TECHNICAL_INCIDENT'] as const) {
      expect(shouldShowManifestationEvidence(manifestation({ status }), '1.0', 7)).toBe(false);
    }
    expect(shouldShowManifestationEvidence(null, '1.0', 7)).toBe(false);
  });
});

describe('buildApproveRequest (RN-6, RN-7)', () => {
  it('sin decisión: solo la versión, sin clave decision (CA-3)', () => {
    const body = buildApproveRequest({ view: view(), showEvidence: false, state: INITIAL_DECISION_STATE });
    expect(body).toEqual({ declarationVersion: '1.0' });
    expect('decision' in body).toBe(false);
  });

  it('ACCEPT (CA-4)', () => {
    expect(buildApproveRequest({ view: view(), showEvidence: false, state: accept })).toEqual({
      declarationVersion: '1.0',
      decision: 'ACCEPT',
    });
  });

  it('REFUSE con y sin motivo (CA-5)', () => {
    expect(buildApproveRequest({ view: view(), showEvidence: false, state: refuse('porque sí') })).toEqual({
      declarationVersion: '1.0',
      decision: 'REFUSE',
      refusalReason: 'porque sí',
    });
    const body = buildApproveRequest({ view: view(), showEvidence: false, state: refuse('') });
    expect(body).toEqual({ declarationVersion: '1.0', decision: 'REFUSE' });
    expect('refusalReason' in body).toBe(false);
  });

  it('tras deshacer, sin decision ni refusalReason (CA-6)', () => {
    const state = decisionReducer(refuse('x'), { type: 'undoRefusal' });
    expect(buildApproveRequest({ view: view(), showEvidence: false, state })).toEqual({ declarationVersion: '1.0' });
  });

  it('sin texto: {} aunque haya decisión (CA-8)', () => {
    expect(buildApproveRequest({ view: null, showEvidence: false, state: accept })).toEqual({});
    expect(buildApproveRequest({ view: null, showEvidence: false, state: refuse('x') })).toEqual({});
  });

  it('con evidencia vigente: sin decision (CA-9)', () => {
    const body = buildApproveRequest({ view: view(manifestation()), showEvidence: true, state: accept });
    expect(body).toEqual({ declarationVersion: '1.0' });
    expect('decision' in body).toBe(false);
  });
});
