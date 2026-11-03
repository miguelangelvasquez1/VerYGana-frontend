import { z } from 'zod';

import type { Manifestation } from '@/types/commercial/Declaration.types';
import type {
  ContractualMeasure,
  FindingClassification,
  FindingRequest,
  IncidentRequest,
} from '@/types/compliance/InformationRequest.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export const FINDING_CLASSIFICATIONS = [
  'SUBSANABLE_ERROR',
  'LACK_OF_UPDATE',
  'ISOLATED_INCONSISTENCY',
  'VERIFIED_FALSE_INFO',
  'EXPRESS_REFUSAL',
] as const satisfies readonly FindingClassification[];

export const FINDING_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const CONTRACTUAL_MEASURES = [
  'NONE',
  'WARNING',
  'PREVENTIVE_RESTRICTION',
  'SUSPENSION',
  'TERMINATION_REFERRAL',
] as const satisfies readonly ContractualMeasure[];

const LIMITED_CLASSIFICATIONS: readonly FindingClassification[] = ['SUBSANABLE_ERROR', 'ISOLATED_INCONSISTENCY'];
const LIMITED_MEASURES: readonly ContractualMeasure[] = ['NONE', 'WARNING'];

// RN-4: un error subsanable o una inconsistencia aislada no justifican restringir ni suspender.
export function allowedMeasures(classification: FindingClassification): readonly ContractualMeasure[] {
  return LIMITED_CLASSIFICATIONS.includes(classification) ? LIMITED_MEASURES : CONTRACTUAL_MEASURES;
}

export function measureAfterClassificationChange(
  classification: FindingClassification,
  currentMeasure: ContractualMeasure | '',
): ContractualMeasure | '' {
  if (currentMeasure === '') return '';
  return allowedMeasures(classification).includes(currentMeasure) ? currentMeasure : '';
}

// RN-5: la negativa expresa solo se ofrece si el historial del compromiso la tiene. Sin historial, no.
export function expressRefusalAvailable(history: readonly Manifestation[] | undefined): boolean {
  return history?.some((m) => m.status === 'EXPRESS_REFUSAL') ?? false;
}

// RN-6: estas dos medidas cambian el estado de la cuenta al instante. La remisión a terminación no (RN-7).
export function changesAccount(measure: ContractualMeasure | ''): boolean {
  return measure === 'PREVENTIVE_RESTRICTION' || measure === 'SUSPENSION';
}

export function companyNameMatches(typed: string, companyName: string | null): boolean {
  if (!companyName || !companyName.trim()) return false;
  return typed.trim().toLowerCase() === companyName.trim().toLowerCase();
}

const REQUIRED = 'Este campo es obligatorio.';
const tooLong = (max: number) => `Máximo ${max} caracteres.`;

function requiredText(max: number) {
  return z.string().trim().min(1, REQUIRED).max(max, tooLong(max));
}

function optionalText(max: number) {
  return z.string().trim().max(max, tooLong(max));
}

// Select sin elegir: el formulario arranca con '' y la validación lo exige.
function requiredChoice<T extends readonly [string, ...string[]]>(values: T) {
  return z.union([z.enum(values), z.literal('')]).refine((v) => v !== '', REQUIRED);
}

export const findingSchema = z
  .object({
    commercialPublicId: z.string(),
    requestPublicId: z.string(),
    factObserved: requiredText(2000),
    evidence: optionalText(2000),
    classification: requiredChoice(FINDING_CLASSIFICATIONS),
    severity: requiredChoice(FINDING_SEVERITIES),
    impact: requiredText(1000),
    remediable: z.boolean().nullable(),
    contractualBasis: requiredText(1000),
    measure: requiredChoice(CONTRACTUAL_MEASURES),
    measureScope: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.remediable === null) {
      ctx.addIssue({ code: 'custom', path: ['remediable'], message: 'Indica si es subsanable.' });
    }
    if (
      value.classification !== '' &&
      value.measure !== '' &&
      !allowedMeasures(value.classification).includes(value.measure)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['measure'],
        message: 'Esta medida no está permitida para la clasificación elegida.',
      });
    }
  });

export type FindingFormValues = z.infer<typeof findingSchema>;

// Se llama con valores ya validados (clasificación, gravedad, medida y subsanable elegidos).
export function buildFindingBody(values: FindingFormValues): FindingRequest {
  const body: FindingRequest = {
    commercialPublicId: values.commercialPublicId,
    factObserved: values.factObserved.trim(),
    classification: values.classification as FindingClassification,
    severity: values.severity as FindingRequest['severity'],
    impact: values.impact.trim(),
    remediable: values.remediable === true,
    contractualBasis: values.contractualBasis.trim(),
    measure: values.measure as ContractualMeasure,
  };
  if (values.requestPublicId) body.requestPublicId = values.requestPublicId;
  if (values.evidence.trim()) body.evidence = values.evidence.trim();
  if (values.measureScope.trim()) body.measureScope = values.measureScope.trim();
  return body;
}

export const incidentSchema = z.object({
  commercialPublicId: z.string(),
  context: requiredText(100),
  description: requiredText(1000),
  requestPublicId: z.string(),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;

export function buildIncidentBody(values: IncidentFormValues): IncidentRequest {
  const body: IncidentRequest = {
    commercialPublicId: values.commercialPublicId,
    context: values.context.trim(),
    description: values.description.trim(),
  };
  if (values.requestPublicId) body.requestPublicId = values.requestPublicId;
  return body;
}
