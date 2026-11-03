import { describe, expect, it } from 'vitest';
import { findIncomeOverlaps } from '@/lib/taxProfile/incomeOverlap';

const row = (concept: string, scope: string, periodStart: string, periodEnd: string) => ({
  concept,
  scope,
  periodStart,
  periodEnd,
});

describe('findIncomeOverlaps', () => {
  it('total consolidado junto a otro cruzado: chocan (CA-8)', () => {
    const rows = [
      row('VENTAS', 'CONSOLIDATED_INCLUDES_PLATFORM', '2026-01-01', '2026-06-30'),
      row('VENTAS', 'EXTERNAL_ONLY', '2026-03-01', '2026-03-31'),
    ];
    expect([...findIncomeOverlaps(rows)].sort()).toEqual([0, 1]);
  });

  it('sin cruzarse no chocan', () => {
    const rows = [
      row('VENTAS', 'CONSOLIDATED_INCLUDES_PLATFORM', '2026-01-01', '2026-06-30'),
      row('VENTAS', 'EXTERNAL_ONLY', '2026-07-01', '2026-07-31'),
    ];
    expect(findIncomeOverlaps(rows).size).toBe(0);
  });

  it('mismo alcance cruzado: chocan', () => {
    const rows = [
      row('VENTAS', 'EXTERNAL_ONLY', '2026-01-01', '2026-03-31'),
      row('VENTAS', 'EXTERNAL_ONLY', '2026-03-01', '2026-05-31'),
    ];
    expect([...findIncomeOverlaps(rows)].sort()).toEqual([0, 1]);
  });

  it('externo y de plataforma cruzados no chocan', () => {
    const rows = [
      row('VENTAS', 'EXTERNAL_ONLY', '2026-01-01', '2026-03-31'),
      row('VENTAS', 'PLATFORM_ONLY', '2026-02-01', '2026-02-28'),
    ];
    expect(findIncomeOverlaps(rows).size).toBe(0);
  });

  it('distinto concepto no choca', () => {
    const rows = [
      row('VENTAS', 'EXTERNAL_ONLY', '2026-01-01', '2026-03-31'),
      row('INGRESOS', 'EXTERNAL_ONLY', '2026-01-01', '2026-03-31'),
    ];
    expect(findIncomeOverlaps(rows).size).toBe(0);
  });

  it('extremos que se tocan chocan', () => {
    const rows = [
      row('VENTAS', 'EXTERNAL_ONLY', '2026-01-01', '2026-03-31'),
      row('VENTAS', 'EXTERNAL_ONLY', '2026-03-31', '2026-04-30'),
    ];
    expect([...findIncomeOverlaps(rows)].sort()).toEqual([0, 1]);
  });

  it('tres filas donde solo dos chocan', () => {
    const rows = [
      row('VENTAS', 'EXTERNAL_ONLY', '2026-01-01', '2026-01-31'),
      row('VENTAS', 'EXTERNAL_ONLY', '2026-05-01', '2026-05-31'),
      row('VENTAS', 'EXTERNAL_ONLY', '2026-05-15', '2026-06-15'),
    ];
    expect([...findIncomeOverlaps(rows)].sort()).toEqual([1, 2]);
  });

  it('ignora filas con fechas vacías o sin concepto o alcance', () => {
    const rows = [
      row('VENTAS', 'EXTERNAL_ONLY', '2026-01-01', '2026-03-31'),
      row('VENTAS', 'EXTERNAL_ONLY', '', ''),
      row('', 'EXTERNAL_ONLY', '2026-01-01', '2026-03-31'),
      row('VENTAS', '', '2026-01-01', '2026-03-31'),
      { periodStart: '2026-01-01', periodEnd: '2026-03-31' },
    ];
    expect(findIncomeOverlaps(rows).size).toBe(0);
  });
});
