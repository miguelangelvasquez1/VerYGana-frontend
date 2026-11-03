import { describe, expect, it } from 'vitest';
import { catalogOptionLabel, displayCode, groupCatalog } from '@/lib/taxProfile/catalog';
import type { CatalogEntry } from '@/types/commercial/TaxProfile.types';

// Datos ficticios: ningún código real.
const entry = (
  id: number,
  catalogType: CatalogEntry['catalogType'],
  code: string,
  label: string,
): CatalogEntry => ({
  id,
  catalogType,
  code,
  label,
  legalBasis: 'Base de prueba',
  validFrom: '2026-01-01',
  validTo: null,
  active: true,
});

describe('groupCatalog', () => {
  it('devuelve los cinco tipos aunque falten entradas', () => {
    const grouped = groupCatalog([
      entry(1, 'REGIME', 'R-99', 'Régimen de prueba'),
      entry(2, 'VAT_CONDITION', 'V-1', 'Condición de prueba'),
    ]);
    expect(Object.keys(grouped).sort()).toEqual(
      ['INC_CONDITION', 'INVOICING_METHOD', 'REGIME', 'RUT_RESPONSIBILITY', 'VAT_CONDITION'].sort(),
    );
    expect(grouped.REGIME).toHaveLength(1);
    expect(grouped.VAT_CONDITION).toHaveLength(1);
    expect(grouped.INC_CONDITION).toEqual([]);
    expect(grouped.INVOICING_METHOD).toEqual([]);
    expect(grouped.RUT_RESPONSIBILITY).toEqual([]);
  });

  it('conserva el orden de la API dentro de cada tipo', () => {
    const grouped = groupCatalog([
      entry(1, 'REGIME', 'B', 'Segundo en llegar primero'),
      entry(2, 'REGIME', 'A', 'Primero en llegar después'),
    ]);
    expect(grouped.REGIME.map((e) => e.code)).toEqual(['B', 'A']);
  });
});

describe('catalogOptionLabel', () => {
  it('código — etiqueta', () => {
    expect(catalogOptionLabel(entry(1, 'REGIME', 'R-99', 'Régimen de prueba'))).toBe(
      'R-99 — Régimen de prueba',
    );
  });
});

describe('displayCode', () => {
  const entries = [entry(1, 'REGIME', 'X1', 'Etiqueta')];
  it('usa la etiqueta si el código está en el catálogo', () => {
    expect(displayCode('X1', entries)).toBe('X1 — Etiqueta');
  });
  it('muestra el código solo si no está', () => {
    expect(displayCode('Z9', entries)).toBe('Z9');
    expect(displayCode('X1')).toBe('X1');
  });
  it('sin código, raya', () => {
    expect(displayCode(null)).toBe('—');
    expect(displayCode(undefined, entries)).toBe('—');
  });
});
