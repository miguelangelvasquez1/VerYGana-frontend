import { describe, expect, it } from 'vitest';
import {
  establishmentHistory,
  latestSectionReview,
  resolveRutDocument,
  sortManifestationsDesc,
  summarizeSectionReviews,
  versionChangedDuringReview,
} from '@/lib/compliance/taxProfileReview';
import type { Manifestation } from '@/types/commercial/Declaration.types';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';
import type {
  ComplianceTaxProfileResponse,
  Establishment,
  SectionReview,
  TaxProfileSection,
} from '@/types/commercial/TaxProfile.types';

function review(section: TaxProfileSection, result: SectionReview['result']): SectionReview {
  return { section, result, notes: null, reviewedAt: '2026-05-01T10:00:00Z' };
}

function doc(id: number, status: ExpedienteDocument['status']): ExpedienteDocument {
  return {
    id,
    documentType: 'RUT',
    originalFileName: 'rut.pdf',
    sizeBytes: 10,
    status,
    uploadedAt: '2026-01-01T00:00:00Z',
    replacesDocumentId: null,
    supersededAt: null,
    reviewStatus: null,
    reviewedAt: null,
    reviewNotes: null,
    holderIdentification: null,
    issuedAt: null,
    expiresAt: null,
    expired: false,
    downloadUrl: null,
  };
}

describe('latestSectionReview', () => {
  it('devuelve la revisión de la sección o null', () => {
    const reviews = [review('A_RUT', 'VERIFIED'), review('C_VAT_INC', 'OBSERVED')];
    expect(latestSectionReview(reviews, 'C_VAT_INC')).toBe(reviews[1]);
    expect(latestSectionReview(reviews, 'E_INCOME')).toBeNull();
  });
});

describe('summarizeSectionReviews', () => {
  it('sin revisiones: ocho pendientes', () => {
    expect(summarizeSectionReviews([])).toEqual({ verified: 0, observed: 0, notApplicable: 0, pending: 8 });
  });

  it('cuenta por resultado', () => {
    const reviews: SectionReview[] = [
      review('A_RUT', 'VERIFIED'),
      review('B_REGIME_ACTIVITIES', 'VERIFIED'),
      review('C_VAT_INC', 'VERIFIED'),
      review('D_INVOICING_WITHHOLDING', 'VERIFIED'),
      review('E_INCOME', 'VERIFIED'),
      review('F_ESTABLISHMENTS', 'OBSERVED'),
      review('G_GROWTH_CAPACITY', 'NOT_APPLICABLE'),
    ];
    expect(summarizeSectionReviews(reviews)).toEqual({
      verified: 5,
      observed: 1,
      notApplicable: 1,
      pending: 1,
    });
  });

  it('una sección repetida cuenta una vez y una desconocida no cuenta', () => {
    const unknown = { ...review('A_RUT', 'VERIFIED'), section: 'Z_OTRA' as TaxProfileSection };
    const result = summarizeSectionReviews([review('A_RUT', 'VERIFIED'), review('A_RUT', 'OBSERVED'), unknown]);
    expect(result.verified + result.observed + result.notApplicable).toBe(1);
    expect(result.pending).toBe(7);
  });
});

describe('resolveRutDocument', () => {
  const documents = [doc(1, 'VALIDATED'), doc(2, 'SUPERSEDED')];

  it('sin rutDocumentId: none', () => {
    expect(resolveRutDocument({ rutDocumentId: null, status: 'success', documents })).toEqual({ kind: 'none' });
  });

  it('cargando y con error', () => {
    expect(resolveRutDocument({ rutDocumentId: 1, status: 'pending', documents: undefined })).toEqual({
      kind: 'loading',
    });
    expect(resolveRutDocument({ rutDocumentId: 1, status: 'error', documents: undefined })).toEqual({
      kind: 'error',
    });
  });

  it('vigente: available con ese documento', () => {
    expect(resolveRutDocument({ rutDocumentId: 1, status: 'success', documents })).toEqual({
      kind: 'available',
      document: documents[0],
    });
  });

  it('reemplazado o ausente: stale (D-5)', () => {
    expect(resolveRutDocument({ rutDocumentId: 2, status: 'success', documents })).toEqual({ kind: 'stale' });
    expect(resolveRutDocument({ rutDocumentId: 99, status: 'success', documents })).toEqual({ kind: 'stale' });
  });
});

describe('sortManifestationsDesc', () => {
  const m = (id: number, occurredAt: string): Manifestation => ({
    id,
    status: 'MANIFESTED',
    declarationVersion: '1',
    contractId: 1,
    contractVersion: 1,
    occurredAt,
    detail: null,
    actorLegalRepName: null,
  });

  it('por fecha desc, empate por id desc, sin mutar', () => {
    const input = [m(1, '2026-01-01T00:00:00Z'), m(3, '2026-03-01T00:00:00Z'), m(2, '2026-03-01T00:00:00Z')];
    const copy = [...input];
    expect(sortManifestationsDesc(input).map((x) => x.id)).toEqual([3, 2, 1]);
    expect(input).toEqual(copy);
  });
});

describe('establishmentHistory', () => {
  const e = (id: number, status: Establishment['status'], createdAt: string): Establishment => ({
    id,
    name: `Sede ${id}`,
    address: 'Dirección ficticia',
    municipalityCode: '11001',
    municipalityName: 'Bogotá',
    relation: 'OWNED',
    status,
    createdAt,
    closedAt: status === 'CLOSED' ? '2026-06-01T00:00:00Z' : null,
    closedReason: status === 'CLOSED' ? 'Cierre' : null,
  });

  it('activas primero, cerradas después, cada grupo por createdAt desc (CA-7)', () => {
    const input = [
      e(1, 'CLOSED', '2026-01-01T00:00:00Z'),
      e(2, 'ACTIVE', '2026-02-01T00:00:00Z'),
      e(3, 'CLOSED', '2026-03-01T00:00:00Z'),
      e(4, 'ACTIVE', '2026-04-01T00:00:00Z'),
    ];
    expect(establishmentHistory(input).map((x) => x.id)).toEqual([4, 2, 3, 1]);
  });
});

describe('versionChangedDuringReview', () => {
  const response = (currentVersion: number) =>
    ({ profile: { currentVersion } }) as unknown as ComplianceTaxProfileResponse;

  it('true si la versión vigente de la respuesta es otra (CA-28)', () => {
    expect(versionChangedDuringReview(2, response(3))).toBe(true);
    expect(versionChangedDuringReview(2, response(2))).toBe(false);
  });
});
