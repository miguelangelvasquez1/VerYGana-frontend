import { describe, expect, it } from 'vitest';
import {
  DEV_PET_GAME_ORIGIN,
  PET_GAME_ORIGIN_ENV,
  petGameRewrites,
  resolvePetGameOrigin,
} from '@/lib/pet/gameOrigin';

// Los valores van escritos literales a propósito: si alguien cambia el origen por defecto o el
// nombre de la variable, la prueba se pone roja.
const DEV_ORIGIN = 'https://pub-4c0bac3292364531a816300210b54c05.r2.dev';
const BETA_ORIGIN = 'https://mascotas-beta.verygana.com';

describe('resolvePetGameOrigin', () => {
  it('usa el bucket de dev cuando la variable está ausente (CA-1)', () => {
    expect(resolvePetGameOrigin(undefined)).toBe(DEV_ORIGIN);
    expect(DEV_PET_GAME_ORIGIN).toBe(DEV_ORIGIN);
  });

  it('acepta el origen de beta (CA-2)', () => {
    expect(resolvePetGameOrigin(BETA_ORIGIN)).toBe(BETA_ORIGIN);
  });

  it('quita la barra final (CA-5)', () => {
    expect(resolvePetGameOrigin(`${BETA_ORIGIN}/`)).toBe(BETA_ORIGIN);
  });

  it('recorta los espacios alrededor de un valor válido', () => {
    expect(resolvePetGameOrigin(`  ${BETA_ORIGIN}  `)).toBe(BETA_ORIGIN);
    expect(resolvePetGameOrigin(` ${BETA_ORIGIN}/ `)).toBe(BETA_ORIGIN);
  });

  it.each([
    '',
    '   ',
    'mascotas-beta.verygana.com',
    'http://mascotas-beta.verygana.com',
    'ftp://x.example.test',
    'https://user:pw@x.example.test',
    'https://x.example.test/sub',
    'https://x.example.test/?a=1',
    'https://x.example.test/#h',
  ])('rechaza el valor inválido %j nombrando la variable (CA-6)', (value) => {
    expect(() => resolvePetGameOrigin(value)).toThrow(/NEXT_PUBLIC_PET_GAME_ORIGIN/);
  });
});

describe('petGameRewrites', () => {
  it('devuelve las dos reglas con el mismo origen (CA-2, CA-3)', () => {
    expect(petGameRewrites(BETA_ORIGIN)).toEqual([
      { source: '/pet-game/:path*', destination: `${BETA_ORIGIN}/:path*` },
      { source: '/pet-assets/:path*', destination: `${BETA_ORIGIN}/:path*` },
    ]);
  });

  it('con barra final en la entrada no aparece // en los destinos (CA-5, RN-3)', () => {
    const rules = petGameRewrites(resolvePetGameOrigin(`${BETA_ORIGIN}/`));
    for (const rule of rules) {
      expect(rule.destination).not.toContain('//:');
      expect(rule.destination).not.toContain('.com//');
    }
    expect(rules[0].destination).toBe(rules[1].destination);
  });
});

describe('PET_GAME_ORIGIN_ENV', () => {
  it('es el nombre de la variable', () => {
    expect(PET_GAME_ORIGIN_ENV).toBe('NEXT_PUBLIC_PET_GAME_ORIGIN');
  });
});
