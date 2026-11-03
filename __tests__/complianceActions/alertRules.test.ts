import { describe, expect, it } from 'vitest';
import {
  ALERT_RULE_DEFAULTS,
  alertRuleSchema,
  buildRuleBody,
  groupRulesByCode,
  nextVersionFor,
  parseRuleParams,
  type AlertRuleFormValues,
} from '@/lib/compliance/alertRules';
import type { AlertRule } from '@/types/compliance/InformationRequest.types';

function rule(code: string, version: number, active: boolean): AlertRule {
  return {
    id: version * 100 + code.length,
    code,
    version,
    ruleType: 'PLATFORM_SALES_GROWTH',
    description: 'd',
    legalBasis: 'b',
    paramsJson: '{"windowDays":30,"minGrowthPct":10.5,"minCurrentSalesCents":100000}',
    active,
    createdAt: '2026-11-01T10:00:00',
  };
}

function valid(overrides: Partial<AlertRuleFormValues> = {}): AlertRuleFormValues {
  return {
    code: 'VENTAS_X',
    description: 'Descripción',
    legalBasis: 'Fundamento',
    windowDays: '30',
    minGrowthPct: '10,5',
    minCurrentSales: '1500000',
    ...overrides,
  };
}

function paths(values: AlertRuleFormValues): string[] {
  const r = alertRuleSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

describe('parseRuleParams', () => {
  it('válido', () => {
    expect(parseRuleParams(rule('A', 1, true).paramsJson)).toEqual({
      windowDays: 30,
      minGrowthPct: 10.5,
      minCurrentSalesCents: 100000,
    });
  });
  it('roto o incompleto: null', () => {
    expect(parseRuleParams('{roto')).toBeNull();
    expect(parseRuleParams('[]')).toBeNull();
    expect(parseRuleParams('{"windowDays":"x"}')).toBeNull();
    expect(parseRuleParams('{"windowDays":30}')).toBeNull();
  });
});

describe('groupRulesByCode (CA-21)', () => {
  it('la activa primero y el resto por versión descendente', () => {
    const groups = groupRulesByCode([rule('A', 1, false), rule('A', 3, false), rule('A', 2, true), rule('B', 1, true)]);
    expect(groups.map((g) => g.code)).toEqual(['A', 'B']);
    expect(groups[0].active?.version).toBe(2);
    expect(groups[0].history.map((r) => r.version)).toEqual([3, 1]);
    expect(groups[1].history).toEqual([]);
  });
  it('grupo sin versión activa', () => {
    const [group] = groupRulesByCode([rule('A', 1, false), rule('A', 2, false)]);
    expect(group.active).toBeNull();
    expect(group.history.map((r) => r.version)).toEqual([2, 1]);
  });
});

describe('nextVersionFor', () => {
  it('código nuevo: null; existente: máximo + 1', () => {
    const rules = [rule('A', 1, false), rule('A', 4, true)];
    expect(nextVersionFor('NUEVA', rules)).toBeNull();
    expect(nextVersionFor('A', rules)).toBe(5);
  });
});

describe('esquema de la regla (RN-9, CA-22)', () => {
  it('los tres umbrales arrancan vacíos y vacíos fallan', () => {
    expect(ALERT_RULE_DEFAULTS.windowDays).toBe('');
    expect(ALERT_RULE_DEFAULTS.minGrowthPct).toBe('');
    expect(ALERT_RULE_DEFAULTS.minCurrentSales).toBe('');
    const p = paths({ ...ALERT_RULE_DEFAULTS, code: 'VENTAS_X', description: 'd', legalBasis: 'f' });
    expect(p).toEqual(expect.arrayContaining(['windowDays', 'minGrowthPct', 'minCurrentSales']));
  });
  it('válido', () => {
    expect(paths(valid())).toEqual([]);
  });
  it('código inválido', () => {
    for (const code of ['ab', 'minuscula', 'CON ESPACIO', 'A'.repeat(51), '']) {
      expect(paths(valid({ code }))).toContain('code');
    }
  });
  it('ventana < 7 o no entera', () => {
    expect(paths(valid({ windowDays: '6' }))).toContain('windowDays');
    expect(paths(valid({ windowDays: '7' }))).toEqual([]);
    expect(paths(valid({ windowDays: '7,5' }))).toContain('windowDays');
    expect(paths(valid({ windowDays: 'x' }))).toContain('windowDays');
  });
  it('porcentaje < 0,01 y coma decimal', () => {
    expect(paths(valid({ minGrowthPct: '0,009' }))).toContain('minGrowthPct');
    expect(paths(valid({ minGrowthPct: '0,01' }))).toEqual([]);
    expect(paths(valid({ minGrowthPct: '12.5' }))).toEqual([]);
    expect(paths(valid({ minGrowthPct: '-1' }))).toContain('minGrowthPct');
  });
  it('ventas negativas fallan, cero pasa', () => {
    expect(paths(valid({ minCurrentSales: '-1' }))).toContain('minCurrentSales');
    expect(paths(valid({ minCurrentSales: '0' }))).toEqual([]);
  });
  it('descripción y fundamento obligatorios, máximo 500', () => {
    expect(paths(valid({ description: '' }))).toContain('description');
    expect(paths(valid({ legalBasis: ' ' }))).toContain('legalBasis');
    expect(paths(valid({ legalBasis: 'a'.repeat(501) }))).toContain('legalBasis');
  });
});

describe('buildRuleBody', () => {
  it('envía centavos y el tipo fijo', () => {
    expect(buildRuleBody(valid({ minCurrentSales: '1500,50', minGrowthPct: '10,5' }))).toEqual({
      code: 'VENTAS_X',
      ruleType: 'PLATFORM_SALES_GROWTH',
      description: 'Descripción',
      legalBasis: 'Fundamento',
      windowDays: 30,
      minGrowthPct: 10.5,
      minCurrentSalesCents: 150050,
    });
  });
});
