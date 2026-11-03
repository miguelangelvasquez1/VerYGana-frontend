import { describe, expect, it } from 'vitest';
import {
  addableDocumentTypes,
  currentDocumentOfType,
  documentNameById,
  groupExpediente,
  shouldShowLoadError,
  supportSelectorState,
  vigentSupportIds,
} from '@/lib/expediente/expediente';
import { COMMERCIAL_DOCUMENT_TYPE_LABELS } from '@/lib/labels/taxCompliance';
import type {
  CommercialDocumentStatus,
  CommercialDocumentType,
  ExpedienteDocument,
} from '@/types/commercial/Expediente.types';

let nextId = 1;
function doc(
  documentType: CommercialDocumentType,
  status: CommercialDocumentStatus,
  extra: Partial<ExpedienteDocument> = {},
): ExpedienteDocument {
  const id = extra.id ?? nextId++;
  return {
    id,
    documentType,
    originalFileName: `archivo-${id}.pdf`,
    sizeBytes: 100,
    status,
    uploadedAt: '2026-10-01T10:00:00-05:00',
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
    ...extra,
  };
}

const ALL_TYPES = Object.keys(COMMERCIAL_DOCUMENT_TYPE_LABELS) as CommercialDocumentType[];

describe('groupExpediente', () => {
  it('ordena los grupos como el diccionario y omite los tipos sin documentos', () => {
    const groups = groupExpediente([
      doc('OTRO', 'VALIDATED'),
      doc('CAMARA_COMERCIO', 'VALIDATED'),
      doc('RUT', 'VALIDATED'),
    ]);
    expect(groups.map((g) => g.type)).toEqual(['RUT', 'CAMARA_COMERCIO', 'OTRO']);
  });

  it('vigentes más reciente primero, historial por supersededAt descendente', () => {
    const groups = groupExpediente([
      doc('RUT', 'SUPERSEDED', { id: 1, supersededAt: '2026-08-01T00:00:00Z' }),
      doc('RUT', 'SUPERSEDED', { id: 2, supersededAt: '2026-09-01T00:00:00Z' }),
      doc('RUT', 'VALIDATED', { id: 3, uploadedAt: '2026-09-01T00:00:00Z' }),
      doc('RUT', 'VALIDATED', { id: 4, uploadedAt: '2026-10-01T00:00:00Z' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].current.map((d) => d.id)).toEqual([4, 3]); // D-6: ambos
    expect(groups[0].history.map((d) => d.id)).toEqual([2, 1]);
  });

  it('CA-1: PENDING y ORPHANED no aparecen', () => {
    const groups = groupExpediente([doc('RUT', 'PENDING'), doc('OTRO', 'ORPHANED')]);
    expect(groups).toEqual([]);
  });
});

describe('addableDocumentTypes', () => {
  it('solo los tipos sin vigente; uno con solo reemplazados sí', () => {
    const docs = [doc('RUT', 'VALIDATED'), doc('OTRO', 'SUPERSEDED')];
    const addable = addableDocumentTypes(docs);
    expect(addable).not.toContain('RUT');
    expect(addable).toContain('OTRO');
    expect(addable).toContain('CAMARA_COMERCIO');
  });

  it('CA-3: con los siete vigentes, ninguno', () => {
    expect(addableDocumentTypes(ALL_TYPES.map((t) => doc(t, 'VALIDATED')))).toEqual([]);
  });
});

describe('currentDocumentOfType', () => {
  it('el vigente más reciente o null', () => {
    const docs = [
      doc('RUT', 'VALIDATED', { id: 1, uploadedAt: '2026-09-01T00:00:00Z' }),
      doc('RUT', 'VALIDATED', { id: 2, uploadedAt: '2026-10-01T00:00:00Z' }),
      doc('RUT', 'SUPERSEDED', { id: 3, uploadedAt: '2026-11-01T00:00:00Z' }),
    ];
    expect(currentDocumentOfType(docs, 'RUT')?.id).toBe(2);
    expect(currentDocumentOfType(docs, 'OTRO')).toBeNull();
  });
});

describe('documentNameById', () => {
  it('incluye los reemplazados', () => {
    const map = documentNameById([
      doc('RUT', 'VALIDATED', { id: 1, originalFileName: 'rut.pdf' }),
      doc('RUT', 'SUPERSEDED', { id: 2, originalFileName: 'viejo.pdf' }),
    ]);
    expect(map.get(1)).toBe('rut.pdf');
    expect(map.get(2)).toBe('viejo.pdf');
  });
});

describe('vigentSupportIds', () => {
  it('ids VALIDATED', () => {
    const ids = vigentSupportIds([
      doc('RUT', 'VALIDATED', { id: 1 }),
      doc('RUT', 'SUPERSEDED', { id: 2 }),
    ]);
    expect(ids).toEqual(new Set([1]));
  });
});

describe('supportSelectorState', () => {
  const docs = [
    doc('RUT', 'VALIDATED', { id: 10, originalFileName: 'rut.pdf' }),
    doc('OTRO', 'VALIDATED', { id: 11, originalFileName: 'otro.pdf' }),
    doc('RUT', 'SUPERSEDED', { id: 12, originalFileName: 'viejo.pdf' }),
  ];

  it('success: "Sin soporte" primero y solo los vigentes (CA-22)', () => {
    const state = supportSelectorState({ status: 'success', documents: docs, currentId: null });
    expect(state.disabled).toBe(false);
    expect(state.options).toEqual([
      { value: null, label: 'Sin soporte' },
      { value: 10, label: 'RUT — rut.pdf' },
      { value: 11, label: 'Otro documento — otro.pdf' },
    ]);
  });

  it('success con un soporte reemplazado: opción "Documento ya no vigente" (CA-23)', () => {
    const state = supportSelectorState({ status: 'success', documents: docs, currentId: 12 });
    expect(state.options).toContainEqual({ value: 12, label: 'Documento ya no vigente', stale: true });
  });

  it('success con un soporte vigente no agrega opción vieja', () => {
    const state = supportSelectorState({ status: 'success', documents: docs, currentId: 10 });
    expect(state.options.some((o) => o.stale)).toBe(false);
  });

  it('pending: deshabilitado con su nota', () => {
    const state = supportSelectorState({ status: 'pending', documents: undefined, currentId: null });
    expect(state.disabled).toBe(true);
    expect(state.note).toBe('Cargando documentos…');
    expect(state.options).toEqual([{ value: null, label: 'Sin soporte' }]);
  });

  it('error sin soporte guardado: solo "Sin soporte" y su nota (CA-23)', () => {
    const state = supportSelectorState({ status: 'error', documents: undefined, currentId: null });
    expect(state.disabled).toBe(false);
    expect(state.note).toBe('No pudimos cargar tus documentos');
    expect(state.options).toEqual([{ value: null, label: 'Sin soporte' }]);
  });

  it('error y pending con soporte guardado: "Documento guardado" (D-5)', () => {
    for (const status of ['error', 'pending'] as const) {
      const state = supportSelectorState({ status, documents: undefined, currentId: 12 });
      expect(state.options).toEqual([
        { value: null, label: 'Sin soporte' },
        { value: 12, label: 'Documento guardado' },
      ]);
    }
  });
});

describe('shouldShowLoadError (S9)', () => {
  it('error sin datos: muestra la vista de error', () => {
    expect(shouldShowLoadError(true, undefined)).toBe(true);
  });
  it('error con la lista ya cargada (refetch fallido): conserva la lista, incluso vacía', () => {
    expect(shouldShowLoadError(true, [{ id: 1 }])).toBe(false);
    expect(shouldShowLoadError(true, [])).toBe(false);
  });
  it('sin error: nunca', () => {
    expect(shouldShowLoadError(false, undefined)).toBe(false);
    expect(shouldShowLoadError(false, [])).toBe(false);
  });
});
