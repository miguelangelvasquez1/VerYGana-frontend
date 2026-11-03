import { describe, expect, it } from 'vitest';
import {
  guestHref,
  postLoginPath,
  returnPathFromCallbackUrl,
  safeReturnPath,
} from '@/lib/auth/returnPath';

// Ruta de regreso tras el login (spec 014, RN-6b, CA-4b, CA-4c; plan 20.5).

describe('safeReturnPath', () => {
  it.each(['/raffles', '/explore/profile', '/plans/mobile-plans'])('acepta %s', (raw) => {
    expect(safeReturnPath(raw)).toBe(raw);
  });

  it('conserva solo el pathname: descarta query y fragmento (P-16)', () => {
    expect(safeReturnPath('/raffles?email=a%40b.test#token=x')).toBe('/raffles');
  });

  it.each([
    '//otro-sitio.test',
    '/\\otro-sitio.test',
    '/ra\\ffles',
    'https://otro-sitio.test',
    'javascript:alert(1)',
    'raffles',
    '',
    ' /raffles',
    '/ra ffles',
    '/raffles\n',
    '\t/raffles',
    '/' + 'a'.repeat(512),
    null,
    undefined,
    42,
    '/login',
    '/register',
    '/verify',
    '/forgot-password',
    '/unlock-account',
    '/api/auth/signin',
    // Segmentos de punto: tras normalizar quedan en `//otro-sitio.test` (solo frena la comprobación posterior a `new URL`).
    '/.//otro-sitio.test',
    '/..//otro-sitio.test',
    '/a/..//otro-sitio.test',
    '/%2e%2e//otro-sitio.test',
  ])('rechaza %j', (raw) => {
    expect(safeReturnPath(raw)).toBeNull();
  });

  it('una barra codificada no se convierte en un origen distinto', () => {
    const result = safeReturnPath('/%2F%2Fotro-sitio.test');
    expect(result).not.toBeNull();
    expect(result!.startsWith('/')).toBe(true);
    expect(result!.startsWith('//')).toBe(false);
  });
});

describe('postLoginPath', () => {
  it('consumidor con ruta válida vuelve a ella', () => {
    expect(postLoginPath('ROLE_CONSUMER', '/raffles')).toBe('/raffles');
  });
  it('consumidor con ruta de otro sitio va al inicio', () => {
    expect(postLoginPath('ROLE_CONSUMER', '//otro-sitio.test')).toBe('/home');
  });
  it('consumidor con segmentos de punto que terminan en // va al inicio', () => {
    expect(postLoginPath('ROLE_CONSUMER', '/..//otro-sitio.test')).toBe('/home');
  });
  it('consumidor sin ruta va al inicio', () => {
    expect(postLoginPath('ROLE_CONSUMER', null)).toBe('/home');
  });
  it('otros roles ignoran la ruta', () => {
    expect(postLoginPath('ROLE_ADMIN', '/raffles')).toBe('/admin');
    expect(postLoginPath('ROLE_COMPLIANCE_OFFICER', '/raffles')).toBe('/compliance');
  });
  it('rol desconocido o ausente da null', () => {
    expect(postLoginPath('ROLE_X', '/raffles')).toBeNull();
    expect(postLoginPath(null, '/raffles')).toBeNull();
  });
});

describe('guestHref', () => {
  it('/home pasa a /', () => {
    expect(guestHref('/home')).toBe('/');
  });
  it('otras rutas llevan al login con from', () => {
    expect(guestHref('/raffles')).toBe('/login?from=%2Fraffles');
    expect(guestHref('/plans/mobile-plans')).toBe('/login?from=%2Fplans%2Fmobile-plans');
  });
  it('una ruta rechazada va al login a secas', () => {
    expect(guestHref('//otro-sitio.test')).toBe('/login');
  });
});

describe('returnPathFromCallbackUrl', () => {
  const origin = 'http://127.0.0.1:3100';
  it('URL absoluta del mismo origen', () => {
    expect(returnPathFromCallbackUrl('http://127.0.0.1:3100/raffles', origin)).toBe('/raffles');
  });
  it('ruta relativa', () => {
    expect(returnPathFromCallbackUrl('/raffles', origin)).toBe('/raffles');
  });
  it('otro origen se descarta', () => {
    expect(returnPathFromCallbackUrl('https://otro-sitio.test/raffles', origin)).toBeNull();
    expect(returnPathFromCallbackUrl('http://127.0.0.1:3100.otro-sitio.test/raffles', origin)).toBeNull();
  });
  it('basura y null dan null', () => {
    expect(returnPathFromCallbackUrl('no es una url', origin)).toBeNull();
    expect(returnPathFromCallbackUrl(null, origin)).toBeNull();
  });
});
