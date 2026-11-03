import { describe, expect, it } from 'vitest';
import {
  buildCatalogEntryBody,
  buildRetireBody,
  catalogEntrySchema,
  retireEntrySchema,
  type CatalogEntryFormValues,
} from '@/lib/compliance/taxCatalog';

function valid(overrides: Partial<CatalogEntryFormValues> = {}): CatalogEntryFormValues {
  return { code: '48', label: 'Responsable de IVA', legalBasis: 'Estatuto Tributario', validFrom: '2026-01-01', ...overrides };
}

function paths(values: CatalogEntryFormValues): string[] {
  const r = catalogEntrySchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

describe('agregar código (CA-24)', () => {
  it('válido', () => {
    expect(paths(valid())).toEqual([]);
  });
  it('sin fundamento o sin "Vigente desde" falla', () => {
    expect(paths(valid({ legalBasis: ' ' }))).toContain('legalBasis');
    expect(paths(valid({ validFrom: '' }))).toContain('validFrom');
  });
  it('sin código o sin etiqueta falla', () => {
    expect(paths(valid({ code: '' }))).toContain('code');
    expect(paths(valid({ label: '' }))).toContain('label');
  });
  it('límites 30/200/500', () => {
    expect(paths(valid({ code: 'a'.repeat(31) }))).toContain('code');
    expect(paths(valid({ code: 'a'.repeat(30) }))).toEqual([]);
    expect(paths(valid({ label: 'a'.repeat(201) }))).toContain('label');
    expect(paths(valid({ legalBasis: 'a'.repeat(501) }))).toContain('legalBasis');
  });
  it('el cuerpo se recorta y lleva el tipo de la pestaña', () => {
    expect(buildCatalogEntryBody('VAT_CONDITION', valid({ code: ' 48 ', label: ' Etiqueta ' }))).toEqual({
      catalogType: 'VAT_CONDITION',
      code: '48',
      label: 'Etiqueta',
      legalBasis: 'Estatuto Tributario',
      validFrom: '2026-01-01',
    });
  });
});

describe('retirar (RN-10)', () => {
  const schema = retireEntrySchema('2026-06-01');
  it('"Vigente hasta" obligatoria', () => {
    expect(schema.safeParse({ validTo: '' }).success).toBe(false);
  });
  it('anterior a "Vigente desde" falla; igual o posterior pasa', () => {
    expect(schema.safeParse({ validTo: '2026-05-31' }).success).toBe(false);
    expect(schema.safeParse({ validTo: '2026-06-01' }).success).toBe(true);
    expect(schema.safeParse({ validTo: '2026-07-01' }).success).toBe(true);
  });
  it('cuerpo', () => {
    expect(buildRetireBody({ validTo: '2026-07-01' })).toEqual({ validTo: '2026-07-01' });
  });
});
