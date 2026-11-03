import { describe, expect, it } from 'vitest';
import {
  buildCancelBody,
  buildCreateRequestBody,
  buildReviewBody,
  cancelRequestSchema,
  createRequestSchema,
  extractDuplicateRequestId,
  requestActions,
  reviewRequestSchema,
  type CreateRequestFormValues,
} from '@/lib/compliance/informationRequestForm';
import type { InformationRequestStatus } from '@/types/compliance/InformationRequest.types';

const CP = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

function valid(overrides: Partial<CreateRequestFormValues> = {}): CreateRequestFormValues {
  return {
    commercialPublicId: CP,
    trigger: 'INCONSISTENCY',
    reason: 'Motivo',
    relationToOperation: 'Relación',
    dueDate: '',
    alertId: null,
    items: [
      {
        itemType: 'CLARIFICATION',
        documentType: '',
        fieldPath: '',
        establishmentId: '',
        description: 'Aclarar',
        acceptableResponse: '',
      },
    ],
    ...overrides,
  };
}

function paths(values: CreateRequestFormValues): string[] {
  const r = createRequestSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

describe('esquema de crear (RN-1)', () => {
  it('un envío válido pasa', () => {
    expect(createRequestSchema.safeParse(valid()).success).toBe(true);
  });

  it('sin motivo, sin relación o con espacios: error en su path', () => {
    expect(paths(valid({ reason: '  ' }))).toContain('reason');
    expect(paths(valid({ relationToOperation: '' }))).toContain('relationToOperation');
  });

  it('sin ítems', () => {
    expect(paths(valid({ items: [] }))).toContain('items');
  });

  it('Documento sin tipo y Campo sin ruta', () => {
    const base = valid().items[0];
    expect(paths(valid({ items: [{ ...base, itemType: 'DOCUMENT' }] }))).toContain('items.0.documentType');
    expect(paths(valid({ items: [{ ...base, itemType: 'FIELD' }] }))).toContain('items.0.fieldPath');
    expect(paths(valid({ items: [{ ...base, itemType: 'DOCUMENT', documentType: 'RUT' }] }))).toEqual([]);
  });

  it('límites 1000/1000/100/500/500', () => {
    const base = valid().items[0];
    expect(paths(valid({ reason: 'a'.repeat(1001) }))).toContain('reason');
    expect(paths(valid({ reason: 'a'.repeat(1000) }))).toEqual([]);
    expect(paths(valid({ relationToOperation: 'a'.repeat(1001) }))).toContain('relationToOperation');
    expect(paths(valid({ items: [{ ...base, itemType: 'FIELD', fieldPath: 'a'.repeat(101) }] }))).toContain(
      'items.0.fieldPath',
    );
    expect(paths(valid({ items: [{ ...base, description: 'a'.repeat(501) }] }))).toContain('items.0.description');
    expect(paths(valid({ items: [{ ...base, description: '' }] }))).toContain('items.0.description');
    expect(paths(valid({ items: [{ ...base, acceptableResponse: 'a'.repeat(501) }] }))).toContain(
      'items.0.acceptableResponse',
    );
  });
});

describe('buildCreateRequestBody (CA-8)', () => {
  it('recorta y omite claves vacías', () => {
    const body = buildCreateRequestBody(valid({ reason: '  Motivo  ' }));
    expect(body).toEqual({
      commercialPublicId: CP,
      trigger: 'INCONSISTENCY',
      reason: 'Motivo',
      relationToOperation: 'Relación',
      items: [{ itemType: 'CLARIFICATION', description: 'Aclarar' }],
    });
    expect(Object.keys(body)).not.toContain('dueDate');
    expect(Object.keys(body)).not.toContain('alertId');
  });

  it('conserva dueDate y alertId si vienen', () => {
    const body = buildCreateRequestBody(valid({ dueDate: '2026-12-01', alertId: 7 }));
    expect(body.dueDate).toBe('2026-12-01');
    expect(body.alertId).toBe(7);
  });

  it('cada campo solo viaja con el tipo al que aplica', () => {
    const base = valid().items[0];
    const doc = buildCreateRequestBody(
      valid({
        items: [
          { ...base, itemType: 'DOCUMENT', documentType: 'RUT', fieldPath: 'x', establishmentId: '5', acceptableResponse: ' ok ' },
        ],
      }),
    ).items[0];
    expect(doc).toEqual({
      itemType: 'DOCUMENT',
      documentType: 'RUT',
      establishmentId: 5,
      description: 'Aclarar',
      acceptableResponse: 'ok',
    });
    const field = buildCreateRequestBody(
      valid({ items: [{ ...base, itemType: 'FIELD', fieldPath: ' tax.regime ', documentType: 'RUT', establishmentId: '5' }] }),
    ).items[0];
    expect(field).toEqual({ itemType: 'FIELD', fieldPath: 'tax.regime', description: 'Aclarar' });
  });
});

describe('extractDuplicateRequestId (RN-2)', () => {
  it('devuelve el UUID del mensaje real de la API', () => {
    expect(
      extractDuplicateRequestId(`Ya hay un requerimiento abierto idéntico (${OTHER}). No se crea otro.`),
    ).toBe(OTHER);
  });
  it('sin UUID: null', () => {
    expect(extractDuplicateRequestId('Indique qué tipo de documento se pide.')).toBeNull();
    expect(extractDuplicateRequestId(undefined)).toBeNull();
  });
});

describe('revisar y anular (RN-3)', () => {
  it('INSUFFICIENT exige nota no vacía', () => {
    expect(reviewRequestSchema.safeParse({ result: 'INSUFFICIENT', notes: '' }).success).toBe(false);
    expect(reviewRequestSchema.safeParse({ result: 'INSUFFICIENT', notes: '   ' }).success).toBe(false);
    expect(reviewRequestSchema.safeParse({ result: 'INSUFFICIENT', notes: ' Falta ' }).success).toBe(true);
  });
  it('SUFFICIENT sin nota envía solo result', () => {
    expect(buildReviewBody({ result: 'SUFFICIENT', notes: '  ' })).toEqual({ result: 'SUFFICIENT' });
    expect(buildReviewBody({ result: 'INSUFFICIENT', notes: ' Falta ' })).toEqual({
      result: 'INSUFFICIENT',
      notes: 'Falta',
    });
  });
  it('anular sin motivo falla', () => {
    expect(cancelRequestSchema.safeParse({ reason: ' ' }).success).toBe(false);
    expect(cancelRequestSchema.safeParse({ reason: 'a'.repeat(1001) }).success).toBe(false);
    expect(buildCancelBody({ reason: ' Duplicado ' })).toEqual({ reason: 'Duplicado' });
  });
});

describe('requestActions', () => {
  const table: Record<InformationRequestStatus, { review: boolean; cancel: boolean; finding: boolean }> = {
    OPEN: { review: false, cancel: true, finding: true },
    RESPONDED: { review: true, cancel: true, finding: true },
    OBSERVED: { review: false, cancel: true, finding: true },
    CLOSED_SATISFIED: { review: false, cancel: false, finding: false },
    CLOSED_WITH_FINDING: { review: false, cancel: false, finding: false },
    CANCELLED: { review: false, cancel: false, finding: false },
  };
  for (const [status, expected] of Object.entries(table)) {
    it(status, () => {
      expect(requestActions(status as InformationRequestStatus)).toEqual(expected);
    });
  }
});
