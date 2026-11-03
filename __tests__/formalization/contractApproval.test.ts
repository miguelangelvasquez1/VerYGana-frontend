import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import {
  approvalFingerprint,
  approveErrorMessage,
  nextApprovalAttempt,
  resolveApproveFailure,
} from '@/lib/formalization/contractApproval';
import type { OnboardingStatus } from '@/services/commercial/OnboardingService';

const GENERIC = 'No pudimos aprobar tu contrato. Intenta de nuevo';

const axiosError = (status: number, data: unknown) =>
  new AxiosError('fail', 'ERR', undefined, undefined, { status, data } as AxiosResponse);

const status = (over: Partial<OnboardingStatus>) => over as OnboardingStatus;

describe('nextApprovalAttempt (RN-8)', () => {
  const makeKey = () => {
    let n = 0;
    return vi.fn(() => `k${++n}`);
  };

  it('sin intento previo: clave nueva', () => {
    const newKey = makeKey();
    const attempt = nextApprovalAttempt(null, { declarationVersion: '1.0' }, newKey);
    expect(attempt.key).toBe('k1');
  });

  it('misma huella: misma clave sin generar otra (CA-12)', () => {
    const newKey = makeKey();
    const first = nextApprovalAttempt(null, { declarationVersion: '1.0' }, newKey);
    const second = nextApprovalAttempt(first, { declarationVersion: '1.0' }, newKey);
    expect(second.key).toBe(first.key);
    expect(newKey).toHaveBeenCalledTimes(1);
  });

  it('cambia decisión, motivo o versión: clave nueva (CA-12)', () => {
    const newKey = makeKey();
    const base = nextApprovalAttempt(null, { declarationVersion: '1.0' }, newKey);
    const accept = nextApprovalAttempt(base, { declarationVersion: '1.0', decision: 'ACCEPT' }, newKey);
    expect(accept.key).not.toBe(base.key);
    const refuse = nextApprovalAttempt(
      accept,
      { declarationVersion: '1.0', decision: 'REFUSE', refusalReason: 'a' },
      newKey,
    );
    expect(refuse.key).not.toBe(accept.key);
    const reason = nextApprovalAttempt(
      refuse,
      { declarationVersion: '1.0', decision: 'REFUSE', refusalReason: 'b' },
      newKey,
    );
    expect(reason.key).not.toBe(refuse.key);
    const version = nextApprovalAttempt(
      reason,
      { declarationVersion: '1.1', decision: 'REFUSE', refusalReason: 'b' },
      newKey,
    );
    expect(version.key).not.toBe(reason.key);
  });

  it('claves ausentes no cambian la huella', () => {
    expect(approvalFingerprint({ declarationVersion: '1.0' })).toBe(
      approvalFingerprint({ declarationVersion: '1.0', decision: undefined }),
    );
  });
});

describe('resolveApproveFailure (RN-9)', () => {
  it('sin estado o aún pendiente: mostrar error', () => {
    expect(resolveApproveFailure(null)).toBe('show-error');
    expect(resolveApproveFailure(status({ currentStep: 'BUSINESS_REVIEW_PENDING' }))).toBe('show-error');
  });
  it('pasos posteriores: avanzar (CA-13)', () => {
    for (const currentStep of ['VERYGANA_REVIEW_PENDING', 'SIGNATURE_PENDING', 'PAYMENT_PENDING'] as const) {
      expect(resolveApproveFailure(status({ currentStep }))).toBe('advance');
    }
  });
  it('completado', () => {
    expect(resolveApproveFailure(status({ completed: true, currentStep: 'PAYMENT_PENDING' }))).toBe('completed');
    expect(resolveApproveFailure(status({ currentStep: 'COMPLETED' }))).toBe('completed');
  });
  it('otro paso (D-1): avanzar', () => {
    expect(resolveApproveFailure(status({ currentStep: 'CONTRACT_PENDING' }))).toBe('advance');
  });
});

describe('approveErrorMessage', () => {
  it('400 y 422 con message: ese message', () => {
    expect(approveErrorMessage(axiosError(400, { message: 'Versión inválida' }))).toBe('Versión inválida');
    const msg = 'El contrato no está pendiente de revisión del empresario.';
    expect(approveErrorMessage(axiosError(422, { message: msg }))).toBe(msg);
  });
  it('500, red y errores no axios: genérico', () => {
    expect(approveErrorMessage(axiosError(500, { message: 'Unexpected error' }))).toBe(GENERIC);
    expect(approveErrorMessage(new AxiosError('Network Error'))).toBe(GENERIC);
    expect(approveErrorMessage(new Error('x'))).toBe(GENERIC);
    expect(approveErrorMessage(undefined)).toBe(GENERIC);
  });
});
