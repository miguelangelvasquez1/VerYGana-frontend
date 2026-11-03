import { partialMatchKey } from '@tanstack/query-core';
import { describe, expect, it } from 'vitest';
import {
  COMPLIANCE_INVALIDATIONS,
  complianceCaseKeys,
  complianceTaxCatalogKeys,
  complianceTaxProfileKeys,
} from '@/hooks/compliance/complianceKeys';
import { taxProfileKeys } from '@/hooks/commercial/taxProfileKeys';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

function isPrefix(prefix: readonly unknown[], key: readonly unknown[]): boolean {
  return partialMatchKey(key, prefix);
}

describe('claves de compliance', () => {
  it('son únicas por los datos que traen', () => {
    const k = complianceTaxProfileKeys;
    expect(k.queue('SUBMITTED', 1)).not.toEqual(k.queue('ALL', 1));
    expect(k.queue('SUBMITTED', 1)).not.toEqual(k.queue('SUBMITTED', 2));
    expect(k.detail(A)).not.toEqual(k.detail(B));
    expect(k.version(A, 1)).not.toEqual(k.version(A, 2));
    const c = complianceCaseKeys;
    const keys = [
      c.documents(A), c.commitment(A), c.requests(A, 1), c.findings(A), c.incidents(A),
      c.documents(B), c.commitment(B), c.requests(B, 1), c.findings(B), c.incidents(B),
    ];
    const serialized = keys.map((key) => JSON.stringify(key));
    expect(new Set(serialized).size).toBe(keys.length);
    expect(c.requests(A, 1)).not.toEqual(c.requests(A, 2));
  });

  it('queueAll es prefijo de la cola y no del detalle ni de las versiones', () => {
    const k = complianceTaxProfileKeys;
    expect(isPrefix(k.queueAll, k.queue('SUBMITTED', 1))).toBe(true);
    expect(isPrefix(k.queueAll, k.queue('ALL', 3))).toBe(true);
    expect(isPrefix(k.queueAll, k.detail(A))).toBe(false);
    expect(isPrefix(k.queueAll, k.version(A, 1))).toBe(false);
    expect(isPrefix(k.detail(A), k.version(A, 1))).toBe(false);
  });

  it('requestsAll es prefijo de requests', () => {
    const c = complianceCaseKeys;
    expect(isPrefix(c.requestsAll(A), c.requests(A, 2))).toBe(true);
    expect(isPrefix(c.requestsAll(A), c.requests(B, 2))).toBe(false);
  });

  it('el catálogo de compliance es otra clave que la del empresario y de ninguna ficha', () => {
    const catalog = complianceTaxCatalogKeys.all;
    expect(catalog).not.toEqual(taxProfileKeys.catalog);
    const others = [
      complianceTaxProfileKeys.all,
      complianceTaxProfileKeys.queue('SUBMITTED', 1),
      complianceTaxProfileKeys.detail(A),
      complianceTaxProfileKeys.version(A, 1),
      complianceCaseKeys.all(A),
      complianceCaseKeys.documents(A),
    ];
    for (const key of others) {
      expect(isPrefix(catalog, key)).toBe(false);
      expect(isPrefix(key, catalog)).toBe(false);
    }
  });

  it('invalidaciones por mutación', () => {
    const inv = COMPLIANCE_INVALIDATIONS;
    expect(inv.reviewSection).toEqual([complianceTaxProfileKeys.queueAll]);
    expect(inv.reviewDocument(A)).toEqual([complianceCaseKeys.documents(A)]);
    expect(inv.reviewDocumentRejected(A)).toEqual([complianceCaseKeys.documents(A)]);
    expect(inv.versionChanged(A)).toEqual([complianceCaseKeys.documents(A)]);
    for (const key of [
      ...inv.reviewDocument(A), ...inv.reviewDocumentRejected(A), ...inv.versionChanged(A),
    ]) {
      expect(isPrefix(key, complianceTaxProfileKeys.detail(A))).toBe(false);
    }
  });
});
