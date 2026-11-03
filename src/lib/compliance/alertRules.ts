import { z } from 'zod';

import { parsePesosInput, pesosToCents } from '@/lib/money/cents';
import type { AlertRule, AlertRuleRequest } from '@/types/compliance/InformationRequest.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export interface RuleParams {
  windowDays: number;
  minGrowthPct: number;
  minCurrentSalesCents: number;
}

// `paramsJson` no tiene esquema en la API: se lee de forma defensiva (R-2).
export function parseRuleParams(paramsJson: string): RuleParams | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(paramsJson);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const { windowDays, minGrowthPct, minCurrentSalesCents } = parsed as Record<string, unknown>;
  if (
    typeof windowDays !== 'number' ||
    typeof minGrowthPct !== 'number' ||
    typeof minCurrentSalesCents !== 'number'
  ) {
    return null;
  }
  return { windowDays, minGrowthPct, minCurrentSalesCents };
}

export interface RuleGroup {
  code: string;
  active: AlertRule | null;
  history: AlertRule[]; // versiones no activas, la más nueva primero
}

export function groupRulesByCode(rules: readonly AlertRule[]): RuleGroup[] {
  const byCode = new Map<string, AlertRule[]>();
  for (const rule of rules) byCode.set(rule.code, [...(byCode.get(rule.code) ?? []), rule]);
  return [...byCode.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, list]) => ({
      code,
      active: list.find((r) => r.active) ?? null,
      history: list.filter((r) => !r.active).sort((a, b) => b.version - a.version),
    }));
}

// Versión que se creará si el código ya existe (aviso N+1); `null` si el código es nuevo.
export function nextVersionFor(code: string, rules: readonly AlertRule[]): number | null {
  const versions = rules.filter((r) => r.code === code).map((r) => r.version);
  return versions.length ? Math.max(...versions) + 1 : null;
}

const REQUIRED = 'Este campo es obligatorio.';

// Los tres umbrales son texto y arrancan vacíos (RN-9).
export const ALERT_RULE_DEFAULTS = {
  code: '',
  description: '',
  legalBasis: '',
  windowDays: '',
  minGrowthPct: '',
  minCurrentSales: '',
};

export const alertRuleSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_]{3,50}$/, 'Usa de 3 a 50 caracteres: mayúsculas, números y guion bajo.'),
  description: z.string().trim().min(1, REQUIRED).max(500, 'Máximo 500 caracteres.'),
  legalBasis: z.string().trim().min(1, REQUIRED).max(500, 'Máximo 500 caracteres.'),
  windowDays: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .refine((v) => /^\d{1,6}$/.test(v) && Number(v) >= 7, 'Escribe un número entero de días, mínimo 7.'),
  minGrowthPct: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .refine((v) => {
      const parsed = parsePesosInput(v);
      return parsed.kind === 'valid' && parsed.value >= 0.01;
    }, 'Escribe un porcentaje, mínimo 0,01.'),
  minCurrentSales: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .refine((v) => {
      const parsed = parsePesosInput(v);
      return parsed.kind === 'valid';
    }, 'Escribe un monto en pesos, desde 0.'),
});

export type AlertRuleFormValues = z.infer<typeof alertRuleSchema>;

// Se llama con valores ya validados. Los pesos viajan en centavos.
export function buildRuleBody(values: AlertRuleFormValues): AlertRuleRequest {
  const growth = parsePesosInput(values.minGrowthPct);
  return {
    code: values.code.trim(),
    ruleType: 'PLATFORM_SALES_GROWTH',
    description: values.description.trim(),
    legalBasis: values.legalBasis.trim(),
    windowDays: Number(values.windowDays),
    minGrowthPct: growth.kind === 'valid' ? growth.value : 0,
    minCurrentSalesCents: pesosToCents(values.minCurrentSales) ?? 0,
  };
}
