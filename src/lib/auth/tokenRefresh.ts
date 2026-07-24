import { signIn } from 'next-auth/react';
import { authService } from './authService';
import { setAccessToken } from './tokenStore';
import { parseJwt } from '../utils/parseJwt';

/**
 * Cuando el access token expira, varias requests en paralelo pueden fallar
 * al mismo tiempo con 401. Sin este lock cada una dispara su propio refresh
 * (y su propio signOut si esa llamada puntual falla), aunque un solo
 * refresh ya habría bastado para todas — de ahí el síntoma de "fallan
 * varias peticiones y me manda al login" después de estar un rato inactivo.
 * Este módulo centraliza el refresh (usado tanto por el interceptor 401 de
 * apiClient como por <AuthProvider>) para que solo haya un intento en vuelo
 * por pestaña.
 */
let inFlightRefresh: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const refreshed = await authService.refresh();
    // Actualiza el store en memoria de inmediato para que cualquier request
    // que arranque mientras esperamos el signIn ya use el token nuevo.
    setAccessToken(refreshed.accessToken);

    const payload = parseJwt(refreshed.accessToken);
    const result = await signIn('credentials-sync', {
      redirect: false,
      accessToken: refreshed.accessToken,
      identifier: payload?.sub,
    });
    if (result?.error) {
      throw new Error(result.error);
    }

    return refreshed.accessToken;
  })();

  return inFlightRefresh.finally(() => {
    inFlightRefresh = null;
  });
}
