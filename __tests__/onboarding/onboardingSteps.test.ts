import { describe, expect, it } from 'vitest';
import { STEP_INDEX, STEP_LABELS } from '@/components/commercial/onboarding/onboardingSteps';

describe('pasos del asistente de onboarding', () => {
  it('el stepper tiene ocho burbujas con "Ficha tributaria" entre Documentos y Contrato', () => {
    expect(STEP_LABELS).toEqual([
      'Términos',
      'Identificación',
      'Diagnóstico',
      'Plan',
      'Documentos',
      'Ficha tributaria',
      'Contrato',
      'Pago',
    ]);
  });

  it('TAX_PROFILE_PENDING es el índice 5 y mueve contrato y pago', () => {
    expect(STEP_INDEX.TAX_PROFILE_PENDING).toBe(5);
    expect(STEP_LABELS[5]).toBe('Ficha tributaria');
    expect(STEP_INDEX.DOCUMENTS_PENDING).toBe(4);
    for (const s of [
      'CONTRACT_PENDING',
      'BUSINESS_REVIEW_PENDING',
      'VERYGANA_REVIEW_PENDING',
      'SIGNATURE_PENDING',
    ] as const) {
      expect(STEP_INDEX[s]).toBe(6);
    }
    expect(STEP_INDEX.PAYMENT_PENDING).toBe(7);
  });

  it('los pasos anteriores no cambian', () => {
    expect(STEP_INDEX.TERMS_PENDING).toBe(0);
    expect(STEP_INDEX.LEGAL_IDENTIFICATION_PENDING).toBe(1);
    expect(STEP_INDEX.DIAGNOSTIC_PENDING).toBe(2);
    expect(STEP_INDEX.CLASSIFICATION_PENDING).toBe(2);
    expect(STEP_INDEX.ADVISOR_CONTACT_PENDING).toBe(2);
    expect(STEP_INDEX.PLAN_PENDING).toBe(3);
  });
});
