import { partialMatchKey } from '@tanstack/query-core';
import { describe, expect, it } from 'vitest';
import {
  COMPLIANCE_INVALIDATIONS,
  complianceAlertKeys,
  complianceAlertRuleKeys,
  complianceCaseKeys,
  complianceRequestKeys,
  complianceTaxCatalogKeys,
} from '@/hooks/compliance/complianceKeys';

const CP = '11111111-1111-4111-8111-111111111111';
const REQ = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';

function isPrefix(prefix: readonly unknown[], key: readonly unknown[]): boolean {
  return partialMatchKey(key, prefix);
}

describe('claves de la 018', () => {
  it('son únicas por los datos que traen', () => {
    const r = complianceRequestKeys;
    const keys = [
      r.queue('RESPONDED', 1), r.queue('ALL', 1), r.queue('RESPONDED', 2), r.detail(REQ), r.detail(OTHER),
      complianceAlertKeys.list(true, 1), complianceAlertKeys.list(false, 1), complianceAlertKeys.list(true, 2),
      complianceAlertRuleKeys.all, complianceTaxCatalogKeys.all,
    ];
    expect(new Set(keys.map((k) => JSON.stringify(k))).size).toBe(keys.length);
  });

  it('queue cuelga de queueAll y el detalle no; list cuelga de alerts.all', () => {
    const r = complianceRequestKeys;
    expect(isPrefix(r.queueAll, r.queue('OPEN', 3))).toBe(true);
    expect(isPrefix(r.queueAll, r.detail(REQ))).toBe(false);
    expect(isPrefix(r.all, r.detail(REQ))).toBe(true);
    expect(isPrefix(complianceAlertKeys.all, complianceAlertKeys.list(true, 1))).toBe(true);
    expect(isPrefix(complianceAlertKeys.all, complianceAlertRuleKeys.all)).toBe(false);
    expect(isPrefix(complianceAlertRuleKeys.all, complianceAlertKeys.list(true, 1))).toBe(false);
  });
});

describe('invalidaciones de la 018 (RN-11)', () => {
  const inv = COMPLIANCE_INVALIDATIONS;
  const c = complianceCaseKeys;

  it('crear requerimiento sin alerta', () => {
    expect(inv.requestCreated(CP, false)).toEqual([complianceRequestKeys.queueAll, c.requestsAll(CP)]);
  });
  it('crear requerimiento desde una alerta invalida también las alertas', () => {
    expect(inv.requestCreated(CP, true)).toEqual([
      complianceRequestKeys.queueAll, c.requestsAll(CP), complianceAlertKeys.all,
    ]);
  });
  it('revisar o anular', () => {
    expect(inv.requestReviewed(CP)).toEqual([complianceRequestKeys.queueAll, c.requestsAll(CP)]);
  });
  it('hallazgo sin requerimiento', () => {
    expect(inv.findingCreated(CP, null)).toEqual([c.findings(CP)]);
    expect(inv.findingCreated(CP, undefined)).toEqual([c.findings(CP)]);
  });
  it('hallazgo con requerimiento', () => {
    expect(inv.findingCreated(CP, REQ)).toEqual([
      c.findings(CP), complianceRequestKeys.detail(REQ), complianceRequestKeys.queueAll, c.requestsAll(CP),
    ]);
  });
  it('incidencia, alerta, regla y catálogo', () => {
    expect(inv.incidentCreated(CP)).toEqual([c.incidents(CP)]);
    expect(inv.alertReviewed).toEqual([complianceAlertKeys.all]);
    expect(inv.alertRuleChanged).toEqual([complianceAlertRuleKeys.all]);
    expect(inv.catalogChanged).toEqual([complianceTaxCatalogKeys.all]);
  });
  it('nada de otro empresario', () => {
    for (const key of inv.requestCreated(CP, true)) {
      expect(isPrefix(key, c.requests('99999999-9999-4999-8999-999999999999', 1))).toBe(false);
    }
  });
});
