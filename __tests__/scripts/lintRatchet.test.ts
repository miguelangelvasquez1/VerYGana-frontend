import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BASE_CAP,
  evaluateLint,
  parseCap,
  resolveBaseSource,
  summarizeEslintReport,
} from '../../scripts/lint-ratchet.mjs';

describe('evaluateLint', () => {
  it('con errores: falla aunque los avisos cuadren con el tope', () => {
    const r = evaluateLint({ errors: 1, warnings: 360, cap: 360, baseCap: 360 });
    expect(r.ok).toBe(false);
    expect(r.messages.join(' ')).toMatch(/error/i);
  });

  it('avisos por encima del tope: falla', () => {
    const r = evaluateLint({ errors: 0, warnings: 361, cap: 360, baseCap: 360 });
    expect(r.ok).toBe(false);
    expect(r.messages.join(' ')).toMatch(/361/);
  });

  it('avisos por debajo del tope: falla y dice a qué número bajarlo', () => {
    const r = evaluateLint({ errors: 0, warnings: 350, cap: 360, baseCap: 360 });
    expect(r.ok).toBe(false);
    expect(r.messages.join(' ')).toMatch(/\.lint-max-warnings/);
    expect(r.messages.join(' ')).toMatch(/350/);
  });

  it('tope mayor que el de la rama destino: falla aunque cuadre con los avisos', () => {
    const r = evaluateLint({ errors: 0, warnings: 361, cap: 361, baseCap: 360 });
    expect(r.ok).toBe(false);
    expect(r.messages.join(' ')).toMatch(/360/);
  });

  it('tope igual al de la rama destino y avisos iguales al tope: pasa', () => {
    const r = evaluateLint({ errors: 0, warnings: 360, cap: 360, baseCap: 360 });
    expect(r.ok).toBe(true);
  });

  it('tope menor que el de la rama destino y avisos iguales al tope: pasa', () => {
    const r = evaluateLint({ errors: 0, warnings: 350, cap: 350, baseCap: 360 });
    expect(r.ok).toBe(true);
  });

  it('tope inválido: falla', () => {
    const r = evaluateLint({ errors: 0, warnings: 0, cap: Number.NaN, baseCap: 360 });
    expect(r.ok).toBe(false);
  });
});

describe('parseCap', () => {
  it('lee un entero con salto de línea', () => {
    expect(parseCap('360\n')).toBe(360);
  });
  it.each(['', 'abc', '-3', '3.5', '1 2'])('texto inválido %j: NaN', (raw) => {
    expect(Number.isNaN(parseCap(raw))).toBe(true);
  });
});

describe('archivo ausente en la rama destino', () => {
  it('el tope de respaldo es 360', () => {
    expect(DEFAULT_BASE_CAP).toBe(360);
    // Un tope de 360 pasa contra el respaldo cuando el archivo aún no existe en la rama destino.
    const r = evaluateLint({ errors: 0, warnings: 360, cap: 360, baseCap: DEFAULT_BASE_CAP });
    expect(r.ok).toBe(true);
  });
});

describe('summarizeEslintReport', () => {
  it('suma errores y avisos de todos los archivos', () => {
    const report = [
      { errorCount: 0, warningCount: 2 },
      { errorCount: 1, warningCount: 0 },
      { errorCount: 0, warningCount: 3 },
    ];
    expect(summarizeEslintReport(report)).toEqual({ errors: 1, warnings: 5 });
  });
  it('un reporte que no es lista lanza error', () => {
    expect(() => summarizeEslintReport({ nope: true })).toThrow();
  });
});

describe('resolveBaseSource', () => {
  const SHA = 'a'.repeat(39) + 'b';
  const ZEROS = '0'.repeat(40);

  it('en local: LINT_BASE_CAP manda (es para ensayos)', () => {
    const r = resolveBaseSource({ LINT_BASE_CAP: '300' });
    expect(r).toMatchObject({ kind: 'forced', cap: '300' });
  });

  it('en local: LINT_BASE_REF manda sobre origin/main', () => {
    expect(resolveBaseSource({ LINT_BASE_REF: 'otra' })).toMatchObject({ kind: 'ref', ref: 'otra' });
  });

  it('en local sin nada: origin/main, sin exigirla', () => {
    expect(resolveBaseSource({})).toMatchObject({ kind: 'ref', ref: 'origin/main', required: false });
  });

  it('en GitHub Actions ignora LINT_BASE_CAP y avisa', () => {
    const r = resolveBaseSource({ GITHUB_ACTIONS: 'true', GITHUB_BASE_REF: 'main', LINT_BASE_CAP: '999' });
    expect(r.kind).toBe('ref');
    expect(r.notes.join(' ')).toMatch(/LINT_BASE_CAP/);
  });

  it('en GitHub Actions ignora LINT_BASE_REF y avisa', () => {
    const r = resolveBaseSource({ GITHUB_ACTIONS: 'true', GITHUB_BASE_REF: 'main', LINT_BASE_REF: 'HEAD' });
    expect(r).toMatchObject({ kind: 'ref', ref: 'origin/main' });
    expect(r.notes.join(' ')).toMatch(/LINT_BASE_REF/);
  });

  it('en un PR: la rama destino es obligatoria', () => {
    const r = resolveBaseSource({ GITHUB_ACTIONS: 'true', GITHUB_BASE_REF: 'main' });
    expect(r).toMatchObject({ kind: 'ref', ref: 'origin/main', required: true });
  });

  it('en un PR manda la rama destino aunque exista LINT_BASE_SHA', () => {
    const r = resolveBaseSource({ GITHUB_ACTIONS: 'true', GITHUB_BASE_REF: 'main', LINT_BASE_SHA: SHA });
    expect(r).toMatchObject({ kind: 'ref', ref: 'origin/main', required: true });
  });

  it('GITHUB_ACTIONS definida pero vacía sigue contando como CI', () => {
    const r = resolveBaseSource({ GITHUB_ACTIONS: '', LINT_BASE_CAP: '999', LINT_BASE_REF: 'HEAD' });
    expect(r.kind).toBe('ref');
    expect(r).toMatchObject({ ref: null });
    expect(r.notes.join(' ')).toMatch(/LINT_BASE_CAP/);
  });

  it('CI sola (sin GITHUB_ACTIONS) no es modo CI: LINT_BASE_CAP sigue valiendo en local', () => {
    const r = resolveBaseSource({ CI: '1', LINT_BASE_CAP: '999' });
    expect(r).toMatchObject({ kind: 'forced', cap: '999' });
  });

  it('en un push: compara con el commit anterior al push, no con origin/main', () => {
    const r = resolveBaseSource({ GITHUB_ACTIONS: 'true', LINT_BASE_SHA: SHA });
    expect(r).toMatchObject({ kind: 'ref', ref: SHA, required: false });
  });

  it.each([ZEROS, '', 'no-es-un-sha', '--upload-pack=x', SHA.slice(1)])(
    'en un push con commit anterior inválido %j: sin referencia (respaldo)',
    (sha) => {
      const r = resolveBaseSource({ GITHUB_ACTIONS: 'true', LINT_BASE_SHA: sha });
      expect(r).toMatchObject({ kind: 'ref', ref: null });
      expect(r.notes.join(' ')).toMatch(/respaldo/i);
    },
  );

  it('fuera de GitHub Actions ignora LINT_BASE_SHA', () => {
    expect(resolveBaseSource({ LINT_BASE_SHA: SHA })).toMatchObject({ ref: 'origin/main' });
  });
});
