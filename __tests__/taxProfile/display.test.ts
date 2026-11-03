import { describe, expect, it } from 'vitest';
import {
  commitmentDisplay,
  nextVersionMessage,
  sectionReviewDisplay,
  sortVersionsDesc,
  vigentRutDocuments,
} from '@/lib/taxProfile/display';
import type { Manifestation } from '@/types/commercial/Declaration.types';
import type { SectionReview, VersionSummary } from '@/types/commercial/TaxProfile.types';

const manifestation = (status: Manifestation['status']): Manifestation => ({
  id: 1,
  status,
  declarationVersion: 'v2',
  contractId: 10,
  contractVersion: 1,
  occurredAt: '2026-10-28T03:00:00Z',
  detail: null,
  actorLegalRepName: 'Persona de Prueba',
});

describe('commitmentDisplay', () => {
  it('sin registro: texto fijo y sin insignia', () => {
    const d = commitmentDisplay(null);
    expect(d.text).toBe('Aún no registrado. Se manifiesta al aprobar el contrato');
    expect(d.badge).toBeNull();
    expect(d.pendingClarification).toBe(false);
  });

  it('MANIFESTED: fecha en hora de Colombia, nombre y versión', () => {
    const d = commitmentDisplay(manifestation('MANIFESTED'));
    expect(d.text).toContain('Manifestado el');
    expect(d.text).toContain('27');
    expect(d.text).toContain('por Persona de Prueba');
    expect(d.text).toContain('versión v2');
    expect(d.badge).toEqual({ label: 'Manifestado', tone: 'green' });
    expect(d.pendingClarification).toBe(false);
  });

  it('los otros tres llevan su insignia y aclaración pendiente', () => {
    const nm = commitmentDisplay(manifestation('NOT_MANIFESTED'));
    const er = commitmentDisplay(manifestation('EXPRESS_REFUSAL'));
    const ti = commitmentDisplay(manifestation('TECHNICAL_INCIDENT'));
    expect(nm.badge).toEqual({ label: 'Sin manifestar — pendiente de aclaración', tone: 'orange' });
    expect(er.badge).toEqual({ label: 'No aceptado', tone: 'red' });
    expect(ti.badge).toEqual({ label: 'Falla técnica — pendiente de aclaración', tone: 'gray' });
    for (const d of [nm, er, ti]) expect(d.pendingClarification).toBe(true);
  });

  it('los cinco resultados son distintos y la falla técnica no se confunde con la negativa (RN-2)', () => {
    const all = [
      commitmentDisplay(null),
      commitmentDisplay(manifestation('MANIFESTED')),
      commitmentDisplay(manifestation('NOT_MANIFESTED')),
      commitmentDisplay(manifestation('EXPRESS_REFUSAL')),
      commitmentDisplay(manifestation('TECHNICAL_INCIDENT')),
    ];
    const keys = all.map((d) => `${d.text}|${d.badge?.label ?? ''}|${d.badge?.tone ?? ''}`);
    expect(new Set(keys).size).toBe(5);
    const er = commitmentDisplay(manifestation('EXPRESS_REFUSAL'));
    const ti = commitmentDisplay(manifestation('TECHNICAL_INCIDENT'));
    expect(ti.badge?.tone).not.toBe(er.badge?.tone);
    expect(ti.badge?.label).not.toBe(er.badge?.label);
  });
});

describe('sectionReviewDisplay', () => {
  const reviews: SectionReview[] = [
    { section: 'E_INCOME', result: 'OBSERVED', notes: 'Falta aclarar el periodo', reviewedAt: '2026-10-20T10:00:00Z' },
  ];
  it('revisión observada con nota', () => {
    const d = sectionReviewDisplay(reviews, 'E_INCOME');
    expect(d.badge).toEqual({ label: 'Observada', tone: 'orange' });
    expect(d.notes).toBe('Falta aclarar el periodo');
  });
  it('sin revisión: pendiente', () => {
    const d = sectionReviewDisplay(reviews, 'A_RUT');
    expect(d.badge).toEqual({ label: 'Pendiente de revisión', tone: 'gray' });
    expect(d.notes).toBeNull();
  });
});

describe('sortVersionsDesc', () => {
  it('ordena de la más reciente a la más antigua sin mutar', () => {
    const input: VersionSummary[] = [
      { versionNumber: 1, submittedAt: 'a' },
      { versionNumber: 3, submittedAt: 'c' },
      { versionNumber: 2, submittedAt: 'b' },
    ];
    const sorted = sortVersionsDesc(input);
    expect(sorted.map((v) => v.versionNumber)).toEqual([3, 2, 1]);
    expect(input.map((v) => v.versionNumber)).toEqual([1, 3, 2]);
  });
});

describe('vigentRutDocuments', () => {
  const doc = (id: number, documentType: string, status: string) => ({
    id,
    documentType,
    status,
  });
  it('solo RUT validados', () => {
    const result = vigentRutDocuments([
      doc(1, 'RUT', 'VALIDATED'),
      doc(2, 'RUT', 'SUPERSEDED'),
      doc(3, 'RUT', 'PENDING'),
      doc(4, 'OTRO', 'VALIDATED'),
      doc(5, 'CAMARA_COMERCIO', 'VALIDATED'),
    ]);
    expect(result.map((d) => d.id)).toEqual([1]);
  });
});

describe('nextVersionMessage', () => {
  it('anuncia la versión siguiente', () => {
    expect(nextVersionMessage(3)).toBe(
      'Se creará la versión 4. La anterior queda en el historial',
    );
  });
});
