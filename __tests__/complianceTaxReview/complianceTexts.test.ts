import { describe, expect, it } from 'vitest';
import {
  CASE_TAB_LABELS,
  COMPLIANCE_TAX_REVIEW_TEXTS as T,
  QUEUE_FILTER_LABELS,
} from '@/lib/labels/complianceTaxReview';
import { ACCOUNT_STATUS_LABELS, FINDING_SEVERITY_LABELS } from '@/lib/labels/taxCompliance';

function collectTexts(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectTexts(v, out));
  return out;
}

describe('textos de la revisión tributaria de compliance', () => {
  it('literales de la spec', () => {
    expect(T.vocationNote).toBe('Solo para contrastar: la ficha no modifica la vocación');
    expect(T.queueEmptyAll).toBe('Todavía no hay fichas tributarias enviadas.');
    expect(T.queueLoadError).toBe('No pudimos cargar las fichas tributarias.');
    expect(T.forbidden).toBe('No tienes permiso para ver esta sección.');
    expect(T.reviewNotSent).toBe('El empresario todavía no ha enviado la ficha tributaria.');
    expect(T.reviewLoadError).toBe('No pudimos cargar la ficha tributaria.');
    expect(T.reviewSaved).toBe('Revisión guardada');
    expect(T.reviewSaveError).toBe('No pudimos guardar la revisión. Intenta de nuevo.');
    expect(T.viewRut).toBe('Ver RUT');
    expect(T.documentNotCurrent).toBe('Documento ya no vigente');
    expect(T.compareWith).toBe('Comparar con versión…');
    expect(T.viewCase).toBe('Ver caso del empresario');
    expect(T.openReview).toBe('Abrir revisión de la ficha');
    expect(T.sectionNotesRequired).toBe('Escribe la observación para el empresario.');
    expect(T.holderRequired).toBe('Escribe el NIT o la cédula del titular.');
    expect(T.holderHelp).toBe('Escríbelo como figura en el documento; se compara con el empresario');
    expect(T.hasValidity).toBe('El documento tiene vigencia comprobable');
    expect(T.expiryBeforeIssue).toBe('El vencimiento no puede ser anterior a la expedición.');
    expect(T.documentNotesRequired).toBe('Escribe la observación o el motivo del rechazo.');
    expect(T.saveReview).toBe('Guardar revisión');
    expect(T.commercialNotFound).toBe('No encontramos este empresario.');
    expect(T.emptyDocuments).toBe('El empresario no tiene documentos en su expediente.');
    expect(T.emptyCommitment).toBe('No hay manifestaciones registradas.');
    expect(T.emptyRequests).toBe('No hay requerimientos para este empresario.');
    expect(T.emptyFindings).toBe('No hay hallazgos registrados.');
    expect(T.emptyIncidents).toBe('No hay incidencias registradas.');
    expect(T.system).toBe('Sistema');
    expect(T.complianceActor).toBe('Compliance');
  });

  it('funciones', () => {
    expect(T.queueEmpty('SUBMITTED')).toBe('No hay fichas enviadas.');
    expect(T.queueEmpty('OBSERVED')).toBe('No hay fichas observadas.');
    expect(T.queueEmpty('REVIEWED')).toBe('No hay fichas revisadas.');
    expect(T.queueEmpty('ALL')).toBe('Todavía no hay fichas tributarias enviadas.');
    expect(T.versionLoadError(1)).toBe('No pudimos cargar la versión 1.');
    expect(T.contractVersion(3)).toBe('Contrato v3');
    expect(T.accountStatusApplied('Suspendida')).toBe('Estado de la cuenta aplicado: Suspendida');
    expect(T.sectionsSummary({ verified: 5, observed: 1, notApplicable: 1, pending: 1 })).toBe(
      '5 verificadas · 1 observadas · 1 no aplica · 1 pendientes',
    );
    expect(T.tabLoadError('documents')).toBe('No pudimos cargar los documentos.');
    expect(T.tabLoadError('commitment')).toBe('No pudimos cargar el compromiso.');
    expect(T.tabLoadError('requests')).toBe('No pudimos cargar los requerimientos.');
    expect(T.tabLoadError('findings')).toBe('No pudimos cargar los hallazgos.');
    expect(T.tabLoadError('incidents')).toBe('No pudimos cargar las incidencias.');
    expect(T.tabLoadError('tax-profile')).toBe('No pudimos cargar la ficha tributaria.');
    expect(T.versionChanged(4)).toBe(
      'La ficha cambió a la versión 4 mientras la revisabas. Revisa de nuevo las secciones.',
    );
  });

  it('filtros de la cola y pestañas del caso, en orden', () => {
    expect(Object.keys(QUEUE_FILTER_LABELS)).toEqual(['SUBMITTED', 'OBSERVED', 'REVIEWED', 'ALL']);
    expect(Object.values(QUEUE_FILTER_LABELS)).toEqual(['Enviada', 'Observada', 'Revisada', 'Todas']);
    expect(CASE_TAB_LABELS).toEqual({
      'tax-profile': 'Ficha tributaria',
      documents: 'Documentos',
      commitment: 'Compromiso',
      requests: 'Requerimientos',
      findings: 'Hallazgos',
      incidents: 'Incidencias',
    });
  });

  it('gravedad y estado de la cuenta (D-14)', () => {
    expect(FINDING_SEVERITY_LABELS).toEqual({ LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' });
    expect(Object.keys(ACCOUNT_STATUS_LABELS).sort()).toEqual(
      [
        'ACTIVE', 'PENDING_ACCEPTANCE', 'PENDING_ACTIVATION', 'PENDING_VERIFICATION',
        'PREVENTIVELY_RESTRICTED', 'REGISTRATION_STARTED', 'SUSPENDED', 'TERMINATED',
      ],
    );
    expect(ACCOUNT_STATUS_LABELS.SUSPENDED).toBe('Suspendida');
    expect(ACCOUNT_STATUS_LABELS.PREVENTIVELY_RESTRICTED).toBe('Restringida preventivamente');
    for (const text of collectTexts([FINDING_SEVERITY_LABELS, ACCOUNT_STATUS_LABELS])) {
      expect(text.trim()).not.toBe('');
    }
  });

  it('ningún texto lleva un dato personal de ejemplo', () => {
    const texts = collectTexts([T, QUEUE_FILTER_LABELS, CASE_TAB_LABELS]);
    // Las funciones no se recorren: se evalúan con valores de ejemplo.
    texts.push(T.versionLoadError(1), T.contractVersion(3), T.versionChanged(4));
    for (const text of texts) {
      expect(text).not.toMatch(/\d{6,}/);
      expect(text).not.toContain('@');
    }
  });
});
