// lib/auth/returnPath.ts
// Ruta de regreso tras el login (spec 014, RN-6b, CA-4b, CA-4c). Lógica pura, sin React ni `window`.
// Solo viaja el pathname de una ruta interna: nunca query ni fragmento, para que por ahí no pase un dato
// personal ni un token (P-16), y nunca otro origen (redirección abierta).

import { getRoleHomePath } from '@/lib/auth/roleRedirect';

const MAX_LENGTH = 512;
const FAKE_ORIGIN = 'http://front.invalid';

// Páginas de acceso: volver a ellas crearía un bucle de login.
const AUTH_PAGES = ['/login', '/register', '/verify', '/forgot-password', '/unlock-account'];

const isUnderPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** Devuelve el pathname si `raw` es una ruta interna del front válida; si no, `null`. */
export function safeReturnPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length < 1 || raw.length > MAX_LENGTH) return null;
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') return null;
  // Sin barras invertidas, espacios ni caracteres de control en ningún lado.
  if (/[\\\s\u0000-\u001f\u007f]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, FAKE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== FAKE_ORIGIN) return null;

  const { pathname } = url;
  if (pathname[0] !== '/' || pathname[1] === '/') return null;
  if (AUTH_PAGES.some((page) => isUnderPath(pathname, page))) return null;
  if (isUnderPath(pathname, '/api')) return null;
  return pathname;
}

/** Ruta que pide un `callbackUrl` (absoluto del mismo origen, o relativo), o `null`. */
export function returnPathFromCallbackUrl(callbackUrl: string | null, origin: string): string | null {
  if (!callbackUrl) return null;
  if (callbackUrl.startsWith('/')) return safeReturnPath(callbackUrl);
  try {
    const url = new URL(callbackUrl);
    return url.origin === origin ? safeReturnPath(url.pathname) : null;
  } catch {
    return null;
  }
}

/** A dónde va quien acaba de iniciar sesión: solo el consumidor vuelve a la sección guardada. */
export function postLoginPath(role: string | null | undefined, rawReturn: string | null): string | null {
  if (role === 'ROLE_CONSUMER') {
    const back = safeReturnPath(rawReturn);
    if (back) return back;
  }
  return getRoleHomePath(role);
}

/** Enlace de un acceso del home para quien no tiene sesión: `/home` es `/`; el resto pasa por el login. */
export function guestHref(href: string): string {
  if (href === '/home') return '/';
  const path = safeReturnPath(href);
  return path ? `/login?from=${encodeURIComponent(path)}` : '/login';
}
