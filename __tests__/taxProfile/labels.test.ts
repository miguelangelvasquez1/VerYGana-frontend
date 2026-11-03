import { describe, expect, it } from 'vitest';
import {
  CONTRACTUAL_MEASURE_LABELS,
  DOCUMENT_EXPIRED_LABEL,
  DOCUMENT_REVIEW_LABELS,
  ESTABLISHMENT_RELATION_LABELS,
  FINDING_CLASSIFICATION_LABELS,
  INCOME_CONCEPT_LABELS,
  INCOME_SCOPE_LABELS,
  MANIFESTATION_LABELS,
  REQUEST_STATUS_LABELS_COMMERCIAL,
  REQUEST_STATUS_LABELS_COMPLIANCE,
  SECTION_REVIEW_LABELS,
  SECTION_REVIEW_PENDING,
  TAX_PROFILE_SECTION_TITLES,
  TAX_PROFILE_STATUS_LABELS,
  TRIGGER_LABELS,
} from '@/lib/labels/taxCompliance';

function collectTexts(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((v) => collectTexts(v, out));
  }
  return out;
}

describe('taxCompliance labels', () => {
  it('estado de la ficha', () => {
    expect(TAX_PROFILE_STATUS_LABELS.SUBMITTED).toEqual({ label: 'En revisión', tone: 'blue' });
    expect(TAX_PROFILE_STATUS_LABELS.OBSERVED).toEqual({ label: 'Con observaciones', tone: 'orange' });
    expect(TAX_PROFILE_STATUS_LABELS.REVIEWED).toEqual({ label: 'Revisada', tone: 'green' });
  });

  it('revisión de sección, incluida la entrada sin revisión', () => {
    expect(SECTION_REVIEW_LABELS.VERIFIED).toEqual({ label: 'Verificada', tone: 'green' });
    expect(SECTION_REVIEW_LABELS.OBSERVED).toEqual({ label: 'Observada', tone: 'orange' });
    expect(SECTION_REVIEW_LABELS.NOT_APPLICABLE).toEqual({ label: 'No aplica', tone: 'gray' });
    expect(SECTION_REVIEW_PENDING).toEqual({ label: 'Pendiente de revisión', tone: 'gray' });
  });

  it('manifestación: cuatro textos distintos', () => {
    expect(MANIFESTATION_LABELS.MANIFESTED).toEqual({ label: 'Manifestado', tone: 'green' });
    expect(MANIFESTATION_LABELS.NOT_MANIFESTED).toEqual({
      label: 'Sin manifestar — pendiente de aclaración',
      tone: 'orange',
    });
    expect(MANIFESTATION_LABELS.EXPRESS_REFUSAL).toEqual({ label: 'No aceptado', tone: 'red' });
    expect(MANIFESTATION_LABELS.TECHNICAL_INCIDENT).toEqual({
      label: 'Falla técnica — pendiente de aclaración',
      tone: 'gray',
    });
    const texts = Object.values(MANIFESTATION_LABELS).map((e) => e.label);
    expect(new Set(texts).size).toBe(4);
  });

  it('alcances, conceptos y relaciones de sede', () => {
    expect(INCOME_SCOPE_LABELS).toEqual({
      EXTERNAL_ONLY: 'Solo operaciones fuera de VERYGANA',
      PLATFORM_ONLY: 'Solo operaciones en VERYGANA',
      CONSOLIDATED_INCLUDES_PLATFORM: 'Total que ya incluye VERYGANA',
    });
    expect(INCOME_CONCEPT_LABELS).toEqual({
      INGRESOS: 'Ingresos',
      VENTAS: 'Ventas',
      RECAUDOS: 'Recaudos',
    });
    expect(ESTABLISHMENT_RELATION_LABELS).toEqual({
      OWNED: 'Propio',
      LEASED: 'Arrendado',
      FRANCHISE: 'Franquicia',
      OTHER: 'Otro',
    });
  });

  it('títulos de sección a) a h) en orden', () => {
    expect(Object.keys(TAX_PROFILE_SECTION_TITLES)).toEqual([
      'A_RUT',
      'B_REGIME_ACTIVITIES',
      'C_VAT_INC',
      'D_INVOICING_WITHHOLDING',
      'E_INCOME',
      'F_ESTABLISHMENTS',
      'G_GROWTH_CAPACITY',
      'H_ADVISORY',
    ]);
    expect(Object.values(TAX_PROFILE_SECTION_TITLES)).toEqual([
      'a) RUT',
      'b) Régimen y actividades',
      'c) IVA e INC',
      'd) Facturación y retención',
      'e) Ingresos o ventas',
      'f) Establecimientos',
      'g) Capacidad de crecimiento',
      'h) Asesoría contable',
    ]);
  });

  it('entradas para el resto de enums de la tabla', () => {
    expect(DOCUMENT_REVIEW_LABELS.NOT_REVIEWED).toEqual({ label: 'Sin revisar', tone: 'gray' });
    expect(DOCUMENT_REVIEW_LABELS.ACCEPTED).toEqual({ label: 'Aceptado', tone: 'green' });
    expect(DOCUMENT_REVIEW_LABELS.OBSERVED).toEqual({ label: 'Con observaciones', tone: 'orange' });
    expect(DOCUMENT_REVIEW_LABELS.REJECTED).toEqual({ label: 'Rechazado', tone: 'red' });
    expect(DOCUMENT_EXPIRED_LABEL).toEqual({ label: 'Vencido', tone: 'red' });

    expect(REQUEST_STATUS_LABELS_COMMERCIAL.OPEN.label).toBe('Pendiente de tu respuesta');
    expect(REQUEST_STATUS_LABELS_COMPLIANCE.OPEN.label).toBe('Esperando respuesta');
    expect(REQUEST_STATUS_LABELS_COMMERCIAL.RESPONDED.label).toBe('En revisión por VERYGANA');
    expect(REQUEST_STATUS_LABELS_COMPLIANCE.RESPONDED.label).toBe('Por revisar');
    expect(REQUEST_STATUS_LABELS_COMMERCIAL.CLOSED_SATISFIED).toEqual({ label: 'Resuelto', tone: 'green' });
    expect(REQUEST_STATUS_LABELS_COMMERCIAL.CLOSED_WITH_FINDING.label).toBe('Cerrado con hallazgo');
    expect(REQUEST_STATUS_LABELS_COMMERCIAL.CANCELLED.label).toBe('Anulado');

    expect(CONTRACTUAL_MEASURE_LABELS).toEqual({
      NONE: 'Sin medida',
      WARNING: 'Advertencia',
      PREVENTIVE_RESTRICTION: 'Restricción preventiva',
      SUSPENSION: 'Suspensión',
      TERMINATION_REFERRAL: 'Remisión a terminación',
    });
    expect(Object.values(FINDING_CLASSIFICATION_LABELS)).toEqual([
      'Error subsanable',
      'Falta de actualización',
      'Inconsistencia aislada',
      'Información falsa verificada',
      'Negativa expresa',
    ]);
    expect(Object.values(TRIGGER_LABELS)).toEqual([
      'Documento vencido',
      'Cambio de actividad',
      'Cambio de establecimientos',
      'Aumento de operación',
      'Nuevo requisito',
      'Inconsistencia',
      'Incidente',
      'Riesgo',
      'Compromiso sin manifestar',
      'Negativa al compromiso',
    ]);
  });

  it('ningún texto afirma que la ficha cambia IVA, régimen, vocación, comisión o plan (RN-3)', () => {
    const all = collectTexts([
      TAX_PROFILE_STATUS_LABELS,
      SECTION_REVIEW_LABELS,
      SECTION_REVIEW_PENDING,
      MANIFESTATION_LABELS,
      INCOME_SCOPE_LABELS,
      INCOME_CONCEPT_LABELS,
      ESTABLISHMENT_RELATION_LABELS,
      TAX_PROFILE_SECTION_TITLES,
      DOCUMENT_REVIEW_LABELS,
      DOCUMENT_EXPIRED_LABEL,
      REQUEST_STATUS_LABELS_COMMERCIAL,
      REQUEST_STATUS_LABELS_COMPLIANCE,
      CONTRACTUAL_MEASURE_LABELS,
      FINDING_CLASSIFICATION_LABELS,
      TRIGGER_LABELS,
    ]);
    expect(all.length).toBeGreaterThan(40);
    const re = /(cambia|modifica).{0,40}(iva|r[eé]gimen|vocaci[oó]n|comisi[oó]n|plan)/i;
    expect(all.filter((t) => re.test(t))).toEqual([]);
  });
});
