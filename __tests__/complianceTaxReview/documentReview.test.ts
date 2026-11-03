import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  buildDocumentReviewBody,
  createDocumentReviewSchema,
  documentReviewDefaults,
  documentReviewErrorOutcome,
  requiresHolder,
  type DocumentReviewFormValues,
} from '@/lib/compliance/documentReview';
import type { CommercialDocumentType, ExpedienteDocument } from '@/types/commercial/Expediente.types';

const GENERIC = 'No pudimos guardar la revisión. Intenta de nuevo.';

function values(overrides: Partial<DocumentReviewFormValues> = {}): DocumentReviewFormValues {
  return {
    result: 'ACCEPTED',
    holderIdentification: '',
    issuedAt: '',
    hasValidity: false,
    expiresAt: '',
    notes: '',
    ...overrides,
  };
}

function issuesOf(type: CommercialDocumentType, v: DocumentReviewFormValues) {
  const result = createDocumentReviewSchema(type).safeParse(v);
  return result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

function axiosError(status: number | null, data?: unknown): AxiosError {
  const config = { headers: { Authorization: 'Bearer token-ficticio' } } as unknown as InternalAxiosRequestConfig;
  const response = status === null ? undefined : { status, data, statusText: '', headers: {}, config };
  return new AxiosError('Request failed', status === null ? 'ERR_NETWORK' : 'ERR_BAD_REQUEST', config, {}, response);
}

function makeDoc(overrides: Partial<ExpedienteDocument> = {}): ExpedienteDocument {
  return {
    id: 1,
    documentType: 'RUT',
    originalFileName: 'rut.pdf',
    sizeBytes: 10,
    status: 'VALIDATED',
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
    ...overrides,
  };
}

describe('requiresHolder', () => {
  it('cuatro tipos lo exigen y tres no', () => {
    for (const t of ['RUT', 'CAMARA_COMERCIO', 'CERTIFICACION_BANCARIA', 'CEDULA_REPRESENTANTE'] as const) {
      expect(requiresHolder(t)).toBe(true);
    }
    for (const t of ['PERMISO_SECTORIAL', 'MARCA_REGISTRADA', 'OTRO'] as const) {
      expect(requiresHolder(t)).toBe(false);
    }
  });
});

describe('createDocumentReviewSchema', () => {
  it('resultado vacío', () => {
    expect(issuesOf('OTRO', values({ result: '' }))).toEqual([
      { path: 'result', message: 'Elige el resultado de la revisión.' },
    ]);
  });

  it('CA-14: ACCEPTED sin titular en los cuatro tipos', () => {
    for (const t of ['RUT', 'CAMARA_COMERCIO', 'CERTIFICACION_BANCARIA', 'CEDULA_REPRESENTANTE'] as const) {
      for (const holder of ['', '   ']) {
        expect(issuesOf(t, values({ holderIdentification: holder }))).toEqual([
          { path: 'holderIdentification', message: 'Escribe el NIT o la cédula del titular.' },
        ]);
      }
    }
    expect(issuesOf('OTRO', values())).toEqual([]);
    expect(issuesOf('RUT', values({ result: 'OBSERVED', notes: 'nota' }))).toEqual([]);
  });

  it('el titular admite 30 y rechaza 31 tras recortar', () => {
    expect(issuesOf('RUT', values({ holderIdentification: '1'.repeat(30) }))).toEqual([]);
    expect(issuesOf('RUT', values({ holderIdentification: ` ${'1'.repeat(30)} ` }))).toEqual([]);
    expect(issuesOf('RUT', values({ holderIdentification: '1'.repeat(31) }))).toEqual([
      { path: 'holderIdentification', message: 'Máximo 30 caracteres' },
    ]);
  });

  it('CA-15: OBSERVED y REJECTED exigen notas', () => {
    for (const result of ['OBSERVED', 'REJECTED'] as const) {
      for (const notes of ['', '  ']) {
        expect(issuesOf('OTRO', values({ result, notes }))).toEqual([
          { path: 'notes', message: 'Escribe la observación o el motivo del rechazo.' },
        ]);
      }
    }
    expect(issuesOf('OTRO', values({ result: 'ACCEPTED', notes: '' }))).toEqual([]);
    expect(issuesOf('OTRO', values({ result: 'ACCEPTED', notes: 'a'.repeat(1001) }))).toEqual([
      { path: 'notes', message: 'Máximo 1000 caracteres' },
    ]);
  });

  it('CA-16: vigencia comprobable', () => {
    expect(
      issuesOf('OTRO', values({ hasValidity: true, issuedAt: '2026-05-10', expiresAt: '2026-05-09' })),
    ).toEqual([{ path: 'expiresAt', message: 'El vencimiento no puede ser anterior a la expedición.' }]);
    expect(
      issuesOf('OTRO', values({ hasValidity: true, issuedAt: '2026-05-10', expiresAt: '2026-05-10' })),
    ).toEqual([]);
    expect(issuesOf('OTRO', values({ hasValidity: true, issuedAt: '2026-05-10', expiresAt: '' }))).toEqual([
      { path: 'expiresAt', message: 'Escribe la fecha de vencimiento.' },
    ]);
    expect(
      issuesOf('OTRO', values({ hasValidity: false, issuedAt: '2026-05-10', expiresAt: '2026-05-09' })),
    ).toEqual([]);
  });
});

describe('buildDocumentReviewBody', () => {
  it('sin vigencia comprobable no manda expiresAt aunque esté escrito (CA-16)', () => {
    const body = buildDocumentReviewBody(values({ hasValidity: false, expiresAt: '2027-01-01' }));
    expect(body).not.toHaveProperty('expiresAt');
  });

  it('con todo vacío salvo el resultado: solo result (RN-5)', () => {
    const body = buildDocumentReviewBody(values());
    expect(body).toEqual({ result: 'ACCEPTED' });
    expect(Object.keys(body)).toEqual(['result']);
  });

  it('recorta titular y notas y manda las fechas', () => {
    expect(
      buildDocumentReviewBody(
        values({
          result: 'OBSERVED',
          holderIdentification: ' 123 ',
          issuedAt: '2026-01-01',
          hasValidity: true,
          expiresAt: '2027-01-01',
          notes: ' falta ',
        }),
      ),
    ).toEqual({
      result: 'OBSERVED',
      holderIdentification: '123',
      issuedAt: '2026-01-01',
      expiresAt: '2027-01-01',
      notes: 'falta',
    });
  });

  it('nunca una clave con cadena vacía', () => {
    const body = buildDocumentReviewBody(values({ holderIdentification: '  ', notes: ' ', issuedAt: '' }));
    for (const v of Object.values(body)) expect(v).not.toBe('');
  });
});

describe('documentReviewDefaults', () => {
  it('precarga titular, expedición y vencimiento del documento (D-6)', () => {
    expect(
      documentReviewDefaults(
        makeDoc({
          reviewStatus: 'ACCEPTED',
          reviewNotes: 'ok',
          holderIdentification: '900',
          issuedAt: '2026-01-01',
          expiresAt: '2027-01-01',
        }),
      ),
    ).toEqual({
      result: '',
      notes: '',
      holderIdentification: '900',
      issuedAt: '2026-01-01',
      hasValidity: true,
      expiresAt: '2027-01-01',
    });
  });

  it('un documento sin revisar: todo vacío', () => {
    expect(documentReviewDefaults(makeDoc())).toEqual({
      result: '',
      notes: '',
      holderIdentification: '',
      issuedAt: '',
      hasValidity: false,
      expiresAt: '',
    });
  });
});

describe('documentReviewErrorOutcome', () => {
  it('400 con message: tal cual y se relee la lista (CA-17, RN-6, D-7)', () => {
    const mismatch = 'El titular del documento no corresponde al empresario. Márquelo como OBSERVED o REJECTED.';
    expect(documentReviewErrorOutcome(axiosError(400, { message: mismatch }))).toEqual({
      message: mismatch,
      refetch: true,
    });
    const notCurrent = 'Solo se revisan documentos vigentes del expediente.';
    expect(documentReviewErrorOutcome(axiosError(400, { message: notCurrent }))).toEqual({
      message: notCurrent,
      refetch: true,
    });
  });

  it('500 y red: texto genérico sin relectura', () => {
    expect(documentReviewErrorOutcome(axiosError(500, { message: 'Unexpected error' }))).toEqual({
      message: GENERIC,
      refetch: false,
    });
    expect(documentReviewErrorOutcome(axiosError(null))).toEqual({ message: GENERIC, refetch: false });
    expect(documentReviewErrorOutcome(new Error('boom'))).toEqual({ message: GENERIC, refetch: false });
  });
});
