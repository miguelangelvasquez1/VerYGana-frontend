import { readApiError } from '@/lib/api/apiError';
import { FORMALIZATION_TEXTS } from '@/lib/labels/formalizationCommitment';
import type { OnboardingStatus } from '@/services/commercial/OnboardingService';
import type { ContractApproveRequest } from '@/types/commercial/Declaration.types';

// Sin 'use client': funciones puras que se prueban en Vitest (spec 015).

export interface ApprovalAttempt {
  key: string;
  fingerprint: string;
}

export type ApproveFailureAction = 'show-error' | 'advance' | 'completed';

// Orden y claves ausentes no cambian la huella.
export function approvalFingerprint(body: ContractApproveRequest): string {
  return JSON.stringify([
    body.declarationVersion ?? null,
    body.decision ?? null,
    body.refusalReason ?? null,
  ]);
}

// RN-8: la clave se conserva mientras el cuerpo sea el mismo; si cambia, es otro intento.
export function nextApprovalAttempt(
  previous: ApprovalAttempt | null,
  body: ContractApproveRequest,
  newKey: () => string,
): ApprovalAttempt {
  const fingerprint = approvalFingerprint(body);
  if (previous && previous.fingerprint === fingerprint) return previous;
  return { key: newKey(), fingerprint };
}

// RN-9: qué hacer tras un error al aprobar, según el estado releído.
export function resolveApproveFailure(status: OnboardingStatus | null): ApproveFailureAction {
  if (!status) return 'show-error';
  if (status.completed || status.currentStep === 'COMPLETED') return 'completed';
  if (status.currentStep === 'BUSINESS_REVIEW_PENDING') return 'show-error';
  return 'advance';
}

// Un 4xx con `message` (400 de validación, 422 de regla de negocio) se muestra tal cual.
export function approveErrorMessage(error: unknown): string {
  const { status, message } = readApiError(error);
  if (status !== undefined && status >= 400 && status < 500 && message) return message;
  return FORMALIZATION_TEXTS.approveGenericError;
}
