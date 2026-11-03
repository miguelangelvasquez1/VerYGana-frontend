import { describe, expect, it } from 'vitest';
import { FORMALIZATION_TEXTS as T } from '@/lib/labels/formalizationCommitment';

describe('FORMALIZATION_TEXTS (RN-2)', () => {
  it('título, subtítulo y versión', () => {
    expect(T.title).toBe('Hoja Final de Aceptación Electrónica');
    expect(T.subtitle).toBe('Apartado 9. Compromiso de crecimiento y formalización');
    expect(T.versionLabel('1.0')).toBe('(versión 1.0)');
  });

  it('casilla y enlace de negativa', () => {
    expect(T.checkboxLabel).toBe('Manifiesto expresamente este compromiso');
    expect(T.refuseLink).toBe('No acepto este compromiso');
  });

  it('nota fija literal', () => {
    expect(T.fixedNote).toBe(
      'Aprobar el contrato no requiere marcar la casilla. Si no la marcas, VERYGANA te pedirá una aclaración. Este compromiso no cambia tu situación tributaria.',
    );
  });

  it('caja con scroll', () => {
    expect(T.scrollRegionLabel).toBe('Texto del compromiso de formalización');
    expect(T.scrollHint).toBe('Desplázate para leer el texto completo');
  });

  it('error de carga y 403', () => {
    expect(T.loadError).toBe('No pudimos cargar el compromiso de formalización.');
    expect(T.retry).toBe('Reintentar');
    expect(T.loadErrorNote).toBe(
      'Puedes aprobar tu contrato igual; VERYGANA te pedirá una aclaración después.',
    );
    expect(T.forbidden).toBe('No tienes permiso para ver esta información');
  });

  it('chip y diálogo', () => {
    expect(T.refusedChip).toBe('No aceptado');
    expect(T.undo).toBe('Deshacer');
    expect(T.dialogTitle).toBe('¿Confirmas que no aceptas este compromiso?');
    expect(T.reasonLabel).toBe('Motivo');
    expect(T.confirm).toBe('Confirmar');
    expect(T.cancel).toBe('Cancelar');
    expect(T.reasonCounter(5)).toBe('5/1000');
    expect(T.reasonMax).toBe('Máximo 1000 caracteres');
  });

  it('evidencia', () => {
    const text = T.evidence('27 de octubre de 2026, 10:00 p. m.', '1.0');
    expect(text.startsWith('✓ Ya manifestaste este compromiso el ')).toBe(true);
    expect(text.endsWith('(versión 1.0)')).toBe(true);
  });

  it('error genérico al aprobar', () => {
    expect(T.approveGenericError).toBe('No pudimos aprobar tu contrato. Intenta de nuevo');
  });

  it('RN-11: ningún texto habla de IVA, régimen, vocación, comisión ni plan', () => {
    const values: string[] = Object.values(T).map((v) =>
      typeof v === 'function' ? (v as (...a: string[]) => string)('1', '2') : String(v),
    );
    const banned = /\b(IVA|r[eé]gimen|vocaci[oó]n|comisi[oó]n|plan)\b/i;
    for (const value of values) expect(value).not.toMatch(banned);
    const joined = values.join('\n');
    for (const m of joined.matchAll(/cambia/gi)) {
      expect(joined.slice((m.index ?? 0) - 3, m.index).toLowerCase()).toBe('no ');
    }
  });
});
