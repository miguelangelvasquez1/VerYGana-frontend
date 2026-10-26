import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUDIT_EXIT, evaluateAudit, listAdvisories } from '../../scripts/audit-gate.mjs';

interface AuditException {
  id: string;
  package: string;
  reason: string;
  approvedBy: string;
  approvedOn: string;
  reviewBy: string;
}

const load = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const TODAY = '2026-10-12';

const exception = (id: string, pkg: string, extra: Partial<AuditException> = {}): AuditException => ({
  id,
  package: pkg,
  reason: 'Motivo de prueba.',
  approvedBy: 'Quien aprueba',
  approvedOn: '2026-10-12',
  reviewBy: '2026-11-30',
  ...extra,
});

// Las cuatro excepciones aprobadas hoy (D-1, opción 1).
const ALL_FOUR = [
  exception('GHSA-4r6h-8v6p-xvw6', 'xlsx'),
  exception('GHSA-5pgg-2g8v-p4x9', 'xlsx'),
  exception('GHSA-6g55-p6wh-862q', 'postcss'),
  exception('GHSA-r28c-9q8g-f849', 'postcss'),
];

const text = (r: { failures: string[] }) => r.failures.join('\n');

describe('listAdvisories (reporte real del 2026-10-12)', () => {
  it('lista solo los avisos altos y críticos, por id', () => {
    const ids = listAdvisories(load('audit-real-2026-10-12.json')).map((a) => a.id).sort();
    expect(ids).toEqual([
      'GHSA-4r6h-8v6p-xvw6',
      'GHSA-5pgg-2g8v-p4x9',
      'GHSA-6g55-p6wh-862q',
      'GHSA-r28c-9q8g-f849',
    ]);
  });
});

describe('evaluateAudit', () => {
  it('reporte real sin excepciones: falla por los cuatro avisos altos', () => {
    const r = evaluateAudit(load('audit-real-2026-10-12.json'), [], TODAY);
    expect(r.ok).toBe(false);
    expect(r.code).toBe(AUDIT_EXIT.VULNERABILITIES);
    for (const a of ALL_FOUR) expect(text(r)).toContain(a.id);
  });

  it('reporte real con las cuatro excepciones vigentes: pasa y las lista con su fecha de revisión', () => {
    const r = evaluateAudit(load('audit-real-2026-10-12.json'), ALL_FOUR, TODAY);
    expect(r.ok).toBe(true);
    expect(r.code).toBe(AUDIT_EXIT.OK);
    expect(r.active).toHaveLength(4);
    expect(r.active.join('\n')).toContain('2026-11-30');
  });

  it('aviso crítico sin excepción: falla', () => {
    const r = evaluateAudit(load('audit-critical.json'), ALL_FOUR, TODAY);
    expect(r.ok).toBe(false);
    expect(text(r)).toContain('GHSA-aaaa-bbbb-cccc');
  });

  it('aviso moderado: no cuenta', () => {
    const r = evaluateAudit(load('audit-moderate-only.json'), [], TODAY);
    expect(r.ok).toBe(true);
  });

  it('reporte limpio: pasa', () => {
    expect(evaluateAudit(load('audit-clean.json'), [], TODAY).ok).toBe(true);
  });

  it('aviso alto NUEVO en xlsx (que ya tiene dos excepciones): falla', () => {
    const r = evaluateAudit(load('audit-xlsx-new-advisory.json'), ALL_FOUR, TODAY);
    expect(r.ok).toBe(false);
    expect(r.code).toBe(AUDIT_EXIT.VULNERABILITIES);
    expect(text(r)).toContain('GHSA-xxxx-yyyy-zzzz');
    expect(text(r)).not.toContain('GHSA-4r6h-8v6p-xvw6');
  });

  it('aviso alto NUEVO en postcss (que ya tiene dos excepciones): falla', () => {
    const r = evaluateAudit(load('audit-postcss-new-advisory.json'), ALL_FOUR, TODAY);
    expect(r.ok).toBe(false);
    expect(text(r)).toContain('GHSA-pppp-qqqq-rrrr');
  });

  it('la excepción de un id no sirve si el paquete no coincide', () => {
    const wrong = [
      exception('GHSA-4r6h-8v6p-xvw6', 'otro-paquete'),
      ...ALL_FOUR.slice(1),
    ];
    const r = evaluateAudit(load('audit-real-2026-10-12.json'), wrong, TODAY);
    expect(r.ok).toBe(false);
    expect(text(r)).toContain('GHSA-4r6h-8v6p-xvw6');
  });

  it('excepción vencida: falla', () => {
    const r = evaluateAudit(load('audit-real-2026-10-12.json'), ALL_FOUR, '2026-12-01');
    expect(r.ok).toBe(false);
    expect(text(r)).toMatch(/venci/i);
  });

  it('excepción que vence hoy: todavía vale', () => {
    const r = evaluateAudit(load('audit-real-2026-10-12.json'), ALL_FOUR, '2026-11-30');
    expect(r.ok).toBe(true);
  });

  it.each(['reason', 'reviewBy', 'approvedBy', 'approvedOn', 'package', 'id'] as const)(
    'excepción sin %s: falla',
    (field) => {
      const broken = [{ ...ALL_FOUR[0], [field]: '' }, ...ALL_FOUR.slice(1)];
      const r = evaluateAudit(load('audit-real-2026-10-12.json'), broken, TODAY);
      expect(r.ok).toBe(false);
      expect(text(r)).toContain(field);
    },
  );

  it('fecha de revisión con formato inválido: falla', () => {
    const broken = [{ ...ALL_FOUR[0], reviewBy: '30/11/2026' }, ...ALL_FOUR.slice(1)];
    expect(evaluateAudit(load('audit-real-2026-10-12.json'), broken, TODAY).ok).toBe(false);
  });

  it('excepción sobrante: pasa pero avisa', () => {
    const extra = [...ALL_FOUR, exception('GHSA-zzzz-zzzz-zzzz', 'xlsx')];
    const r = evaluateAudit(load('audit-real-2026-10-12.json'), extra, TODAY);
    expect(r.ok).toBe(true);
    expect(r.warnings.join('\n')).toContain('GHSA-zzzz-zzzz-zzzz');
  });

  it('error del registro: falla con un código distinto al de las vulnerabilidades', () => {
    const r = evaluateAudit(load('audit-registry-error.json'), ALL_FOUR, TODAY);
    expect(r.ok).toBe(false);
    expect(r.code).toBe(AUDIT_EXIT.REGISTRY);
    expect(r.code).not.toBe(AUDIT_EXIT.VULNERABILITIES);
    expect(text(r)).toMatch(/registro/i);
    expect(text(r)).not.toMatch(/vulnerabilidades alt/i);
  });

  it('sin lockfile (ENOLOCK): mismo código de salida, pero el mensaje habla del lockfile y no del registro', () => {
    const r = evaluateAudit(load('audit-no-lockfile.json'), ALL_FOUR, TODAY);
    expect(r.ok).toBe(false);
    expect(r.code).toBe(AUDIT_EXIT.REGISTRY);
    expect(text(r)).toMatch(/lockfile/i);
    expect(text(r)).not.toMatch(/registro de npm/i);
  });

  it('error del registro: el mensaje no habla del lockfile', () => {
    const r = evaluateAudit(load('audit-registry-error.json'), ALL_FOUR, TODAY);
    expect(text(r)).not.toMatch(/lockfile/i);
  });

  it.each([[null], [{}], ['texto'], [{ vulnerabilities: 'x' }]])(
    'salida irreconocible %j: se trata como registro inalcanzable',
    (report) => {
      const r = evaluateAudit(report, ALL_FOUR, TODAY);
      expect(r.code).toBe(AUDIT_EXIT.REGISTRY);
    },
  );

  it('los códigos de salida son distintos entre sí', () => {
    const codes = Object.values(AUDIT_EXIT);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
