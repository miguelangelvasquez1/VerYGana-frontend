import { describe, expect, it } from 'vitest';
import {
  alertOriginLabel,
  alertReviewSchema,
  buildAlertReviewBody,
  parseDataUsed,
} from '@/lib/compliance/alerts';
import { formatCents } from '@/lib/money/cents';
import type { Alert } from '@/types/compliance/InformationRequest.types';

describe('parseDataUsed (CA-19)', () => {
  it('el JSON de la regla: las claves Cents salen en pesos', () => {
    const json = JSON.stringify({
      ruleCode: 'VENTAS_X',
      ruleVersion: 2,
      windowDays: 30,
      currentSalesCents: 1250000,
      previousSalesCents: 500000,
      growthPct: 150.5,
    });
    const rows = parseDataUsed(json);
    expect(rows).not.toBeNull();
    const byKey = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));
    expect(byKey.currentSalesCents).toBe(formatCents(1250000));
    expect(byKey.previousSalesCents).toBe(formatCents(500000));
    expect(byKey.windowDays).toBe('30');
    expect(byKey.ruleCode).toBe('VENTAS_X');
    expect(rows).toHaveLength(6);
  });

  it('JSON roto, arreglo o escalar: null', () => {
    expect(parseDataUsed('{no es json')).toBeNull();
    expect(parseDataUsed('')).toBeNull();
    expect(parseDataUsed('[1,2]')).toBeNull();
    expect(parseDataUsed('42')).toBeNull();
    expect(parseDataUsed('null')).toBeNull();
  });

  it('un objeto anidado se muestra como texto, sin romper', () => {
    const rows = parseDataUsed(JSON.stringify({ a: { b: 1 }, c: null }));
    expect(rows).toHaveLength(2);
    expect(rows?.every((r) => typeof r.value === 'string')).toBe(true);
  });
});

describe('alertOriginLabel', () => {
  const base = { ruleCode: null, ruleVersion: null } as Alert;
  it('con y sin regla', () => {
    expect(alertOriginLabel({ ...base, ruleCode: 'VENTAS_X', ruleVersion: 3 })).toBe('Regla VENTAS_X v3');
    expect(alertOriginLabel(base)).toBe('Evento del expediente');
  });
});

describe('revisión de la alerta (CA-20)', () => {
  it('sin nota o con más de 1000 falla', () => {
    expect(alertReviewSchema.safeParse({ notes: '  ' }).success).toBe(false);
    expect(alertReviewSchema.safeParse({ notes: 'a'.repeat(1001) }).success).toBe(false);
    expect(alertReviewSchema.safeParse({ notes: 'a'.repeat(1000) }).success).toBe(true);
    expect(buildAlertReviewBody({ notes: ' Revisada ' })).toEqual({ notes: 'Revisada' });
  });
});
