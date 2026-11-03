import { describe, expect, it } from 'vitest';
import {
  COMMUNICATION_CHANNEL_LABELS,
  DELIVERY_STATUS_LABELS,
  REQUEST_ITEM_TYPE_LABELS,
  TAX_CATALOG_TYPE_LABELS,
} from '@/lib/labels/taxCompliance';
import { COMPLIANCE_ACTION_TEXTS as T } from '@/lib/labels/complianceActions';

describe('diccionarios nuevos', () => {
  it('cada enum tiene rótulo', () => {
    expect(Object.keys(TAX_CATALOG_TYPE_LABELS).sort()).toEqual(
      ['INC_CONDITION', 'INVOICING_METHOD', 'REGIME', 'RUT_RESPONSIBILITY', 'VAT_CONDITION'],
    );
    expect(Object.keys(REQUEST_ITEM_TYPE_LABELS).sort()).toEqual(['CLARIFICATION', 'DOCUMENT', 'FIELD']);
    expect(Object.keys(COMMUNICATION_CHANNEL_LABELS).sort()).toEqual(['EMAIL', 'IN_APP']);
    expect(Object.keys(DELIVERY_STATUS_LABELS).sort()).toEqual(['FAILED', 'SENT']);
    for (const label of Object.values(TAX_CATALOG_TYPE_LABELS)) expect(label.length).toBeGreaterThan(0);
    expect(DELIVERY_STATUS_LABELS.SENT.label).toBe('Enviada');
    expect(DELIVERY_STATUS_LABELS.FAILED.label).toBe('Falló');
  });
});

describe('textos de la spec 018', () => {
  it('textos exactos', () => {
    expect(T.communicationFailedNotice).toBe(
      'El empresario podría no haber recibido la notificación; no lo trates como falta de respuesta',
    );
    expect(T.measureLimitedNote).toBe(
      'Una inconsistencia aislada o un error subsanable no justifican restringir ni suspender',
    );
    expect(T.expressRefusalMissing).toBe('No hay una negativa expresa registrada');
    expect(T.terminationNote).toBe(
      'No cambia el estado de la cuenta; remite el caso al procedimiento de terminación',
    );
    expect(T.ruleScopeNote).toBe('La regla solo ve operaciones en VERYGANA; sus alertas son informativas');
    expect(T.catalogImmutableNote).toBe('Un código no se edita: se retira y se crea uno nuevo');
    expect(T.ruleTypeLabel).toBe('Crecimiento de ventas en VERYGANA entre dos ventanas iguales');
    expect(T.accountChangeConfirm('Acme SAS', 'Suspensión')).toBe(
      'Esta medida cambiará de inmediato el estado de la cuenta de Acme SAS a Suspensión. Quedará registrada con su fundamento. ¿Confirmas?',
    );
    expect(T.newRuleVersionNotice(3)).toBe('Se creará la versión 3 y la actual se desactivará');
    expect(T.companyNameUnknown).toBe(
      'No pudimos obtener el nombre de la empresa para confirmar esta medida',
    );
    expect(T.requestSent).toBe('Requerimiento enviado');
    expect(T.findingSaved).toBe('Hallazgo registrado');
    expect(T.accountStatusApplied('Suspendida')).toBe('Estado de la cuenta aplicado: Suspendida');
    expect(T.saveError).toBe('No pudimos guardar. Intenta de nuevo.');
  });

  it('vacíos, errores y 404 de las pantallas', () => {
    expect(T.requestsEmpty(true)).toBe('No hay requerimientos en este estado.');
    expect(T.requestsEmpty(false)).toBe('Todavía no hay requerimientos.');
    expect(T.requestsLoadError).toBe('No pudimos cargar los requerimientos.');
    expect(T.requestDetailLoadError).toBe('No pudimos cargar el requerimiento.');
    expect(T.requestNotFound).toBe('No encontramos este requerimiento.');
    expect(T.alertsEmpty(true)).toBe('No hay alertas pendientes.');
    expect(T.alertsEmpty(false)).toBe('No hay alertas.');
    expect(T.alertsLoadError).toBe('No pudimos cargar las alertas.');
    expect(T.alertDataUnreadable).toBe('No pudimos leer los datos de la alerta');
    expect(T.rulesEmpty).toBe('Todavía no hay reglas de alerta.');
    expect(T.rulesLoadError).toBe('No pudimos cargar las reglas.');
    expect(T.catalogEmpty).toBe('No hay códigos en este catálogo.');
    expect(T.catalogLoadError).toBe('No pudimos cargar el catálogo.');
  });

  it('ningún texto de alerta habla de sanción ni de incumplimiento (RN-8)', () => {
    const texts: string[] = [];
    for (const value of Object.values(T.alerts)) texts.push(typeof value === 'string' ? value : '');
    texts.push(T.alertsEmpty(true), T.alertsEmpty(false), T.alertsLoadError, T.alertDataUnreadable, T.ruleScopeNote);
    for (const text of texts) expect(text).not.toMatch(/sanci|incumpl/i);
    expect(texts.filter(Boolean).length).toBeGreaterThan(5);
  });
});
