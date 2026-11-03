import { describe, expect, it } from 'vitest';
import {
  allowedMeasures,
  buildFindingBody,
  buildIncidentBody,
  changesAccount,
  companyNameMatches,
  expressRefusalAvailable,
  findingSchema,
  incidentSchema,
  measureAfterClassificationChange,
  type FindingFormValues,
} from '@/lib/compliance/findingForm';
import type { Manifestation } from '@/types/commercial/Declaration.types';
import type { FindingClassification } from '@/types/compliance/InformationRequest.types';

const CP = '11111111-1111-4111-8111-111111111111';
const REQ = '22222222-2222-4222-8222-222222222222';

function valid(overrides: Partial<FindingFormValues> = {}): FindingFormValues {
  return {
    commercialPublicId: CP,
    requestPublicId: '',
    factObserved: 'Hecho',
    evidence: '',
    classification: 'LACK_OF_UPDATE',
    severity: 'LOW',
    impact: 'Afectación',
    remediable: true,
    contractualBasis: 'Cláusula 3',
    measure: 'WARNING',
    measureScope: '',
    ...overrides,
  };
}

function paths(values: FindingFormValues): string[] {
  const r = findingSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

const manifestation = (status: Manifestation['status']) => ({ status }) as Manifestation;

describe('allowedMeasures (RN-4)', () => {
  it('error subsanable e inconsistencia aislada: solo sin medida y advertencia', () => {
    expect(allowedMeasures('SUBSANABLE_ERROR')).toEqual(['NONE', 'WARNING']);
    expect(allowedMeasures('ISOLATED_INCONSISTENCY')).toEqual(['NONE', 'WARNING']);
  });
  it('las otras tres permiten las cinco medidas', () => {
    for (const c of ['LACK_OF_UPDATE', 'VERIFIED_FALSE_INFO', 'EXPRESS_REFUSAL'] as FindingClassification[]) {
      expect(allowedMeasures(c)).toEqual(['NONE', 'WARNING', 'PREVENTIVE_RESTRICTION', 'SUSPENSION', 'TERMINATION_REFERRAL']);
    }
  });
  it('measureAfterClassificationChange vacía una medida no permitida y conserva una permitida', () => {
    expect(measureAfterClassificationChange('SUBSANABLE_ERROR', 'SUSPENSION')).toBe('');
    expect(measureAfterClassificationChange('SUBSANABLE_ERROR', 'WARNING')).toBe('WARNING');
    expect(measureAfterClassificationChange('VERIFIED_FALSE_INFO', 'SUSPENSION')).toBe('SUSPENSION');
    expect(measureAfterClassificationChange('SUBSANABLE_ERROR', '')).toBe('');
  });
});

describe('expressRefusalAvailable (RN-5)', () => {
  it('solo con una negativa expresa en el historial', () => {
    expect(expressRefusalAvailable([manifestation('MANIFESTED')])).toBe(false);
    expect(expressRefusalAvailable([manifestation('MANIFESTED'), manifestation('EXPRESS_REFUSAL')])).toBe(true);
    expect(expressRefusalAvailable([])).toBe(false);
    expect(expressRefusalAvailable(undefined)).toBe(false);
  });
});

describe('medidas que cambian la cuenta (RN-6, RN-7)', () => {
  it('changesAccount', () => {
    expect(changesAccount('PREVENTIVE_RESTRICTION')).toBe(true);
    expect(changesAccount('SUSPENSION')).toBe(true);
    expect(changesAccount('TERMINATION_REFERRAL')).toBe(false);
    expect(changesAccount('WARNING')).toBe(false);
    expect(changesAccount('NONE')).toBe(false);
    expect(changesAccount('')).toBe(false);
  });
  it('companyNameMatches ignora mayúsculas y espacios de los extremos', () => {
    expect(companyNameMatches('  acme sas ', 'Acme SAS')).toBe(true);
    expect(companyNameMatches('Acme', 'Acme SAS')).toBe(false);
    expect(companyNameMatches('Acme SAS', null)).toBe(false);
    expect(companyNameMatches('', null)).toBe(false);
    expect(companyNameMatches('', '')).toBe(false);
  });
});

describe('esquema del hallazgo (CA-16)', () => {
  it('válido', () => {
    expect(paths(valid())).toEqual([]);
  });
  it('cada campo obligatorio falla en su path', () => {
    expect(paths(valid({ factObserved: ' ' }))).toContain('factObserved');
    expect(paths(valid({ impact: '' }))).toContain('impact');
    expect(paths(valid({ contractualBasis: '' }))).toContain('contractualBasis');
    expect(paths(valid({ remediable: null }))).toContain('remediable');
    expect(paths(valid({ classification: '' }))).toContain('classification');
    expect(paths(valid({ severity: '' }))).toContain('severity');
    expect(paths(valid({ measure: '' }))).toContain('measure');
  });
  it('límites', () => {
    expect(paths(valid({ factObserved: 'a'.repeat(2001) }))).toContain('factObserved');
    expect(paths(valid({ evidence: 'a'.repeat(2001) }))).toContain('evidence');
    expect(paths(valid({ impact: 'a'.repeat(1001) }))).toContain('impact');
    expect(paths(valid({ contractualBasis: 'a'.repeat(1001) }))).toContain('contractualBasis');
    expect(paths(valid({ measureScope: 'a'.repeat(501) }))).toContain('measureScope');
  });
  it('una medida no permitida para la clasificación falla', () => {
    expect(paths(valid({ classification: 'SUBSANABLE_ERROR', measure: 'SUSPENSION' }))).toContain('measure');
    expect(paths(valid({ classification: 'SUBSANABLE_ERROR', measure: 'WARNING' }))).toEqual([]);
  });
});

describe('buildFindingBody', () => {
  it('sin claves vacías y sin requestPublicId si no viene', () => {
    const body = buildFindingBody(valid({ factObserved: ' Hecho ' }));
    expect(body).toEqual({
      commercialPublicId: CP,
      factObserved: 'Hecho',
      classification: 'LACK_OF_UPDATE',
      severity: 'LOW',
      impact: 'Afectación',
      remediable: true,
      contractualBasis: 'Cláusula 3',
      measure: 'WARNING',
    });
  });
  it('con requerimiento, evidencia y alcance', () => {
    const body = buildFindingBody(valid({ requestPublicId: REQ, evidence: ' ev ', measureScope: ' alcance ' }));
    expect(body.requestPublicId).toBe(REQ);
    expect(body.evidence).toBe('ev');
    expect(body.measureScope).toBe('alcance');
  });
  it('remediable false se conserva', () => {
    expect(buildFindingBody(valid({ remediable: false })).remediable).toBe(false);
  });
});

describe('incidencia (CA-17)', () => {
  const base = { commercialPublicId: CP, context: 'Contexto', description: 'Descripción', requestPublicId: '' };
  it('sin contexto o sin descripción falla', () => {
    expect(incidentSchema.safeParse(base).success).toBe(true);
    expect(incidentSchema.safeParse({ ...base, context: ' ' }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...base, description: '' }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...base, context: 'a'.repeat(101) }).success).toBe(false);
    expect(incidentSchema.safeParse({ ...base, description: 'a'.repeat(1001) }).success).toBe(false);
  });
  it('cuerpo recortado y requestPublicId solo si viene', () => {
    expect(buildIncidentBody({ ...base, context: ' Contexto ' })).toEqual({
      commercialPublicId: CP,
      context: 'Contexto',
      description: 'Descripción',
    });
    expect(buildIncidentBody({ ...base, requestPublicId: REQ }).requestPublicId).toBe(REQ);
  });
});
