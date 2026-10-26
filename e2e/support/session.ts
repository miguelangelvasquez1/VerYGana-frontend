import type { BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { TEST_SECRET } from '../../__tests__/middleware/session';

// Sesión de next-auth para las pruebas de navegador (spec 012, plan 4).
// Es real para next-auth (cookie firmada con el secreto ficticio del servidor de pruebas) y falsa
// para la API: el front no verifica la firma del JWT de acceso (P-12), y eso es lo que permite
// probar sin la API. Nada de esto sale del navegador de la prueba ni va en una URL.

export type TestRole = 'ROLE_CONSUMER' | 'ROLE_COMMERCIAL' | 'ROLE_ADMIN' | 'ROLE_GAME_DESIGNER';

export const TEST_ORIGIN = 'http://127.0.0.1:3100';
export const TEST_PUBLIC_ID = '00000000-0000-4000-8000-000000000001';
export const TEST_EMAIL = 'consumidor@example.test';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
// El `exp` del JWT de acceso no puede ser lejano de verdad: `usePetSession` programa su renovación con un
// `setTimeout` al 80 % de lo que le queda, y un plazo mayor a ~24 días desborda el temporizador y renueva al
// instante. Siete días sobran para una corrida de pruebas y no dispara ninguna renovación.
const ACCESS_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** JWT de acceso falso: forma válida, firma inválida, `exp` a siete días. */
export function fakeAccessToken(role: TestRole): string {
  const exp = Math.floor((Date.now() + ACCESS_TOKEN_LIFETIME_MS) / 1000);
  const payload = { sub: TEST_EMAIL, publicId: TEST_PUBLIC_ID, scope: role, exp };
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.firma-ficticia`;
}

/** Valor de la cookie `next-auth.session-token` (NEXTAUTH_URL es http, así que sin prefijo seguro). */
export async function sessionCookieValue(role: TestRole = 'ROLE_CONSUMER'): Promise<string> {
  return encode({
    token: {
      sub: TEST_PUBLIC_ID,
      email: TEST_EMAIL,
      role,
      publicId: TEST_PUBLIC_ID,
      accessToken: fakeAccessToken(role),
      refreshToken: 'refresh-ficticio',
      // `accessTokenExpires` a un año: con 0 el callback `jwt` marcaría RefreshAccessTokenError.
      accessTokenExpires: Date.now() + ONE_YEAR_MS,
    },
    secret: TEST_SECRET,
  });
}

/** Pone la sesión en el contexto del navegador. Sin llamar a esto, la prueba es de visitante. */
export async function signIn(context: BrowserContext, role: TestRole = 'ROLE_CONSUMER'): Promise<void> {
  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: await sessionCookieValue(role),
      url: TEST_ORIGIN,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
