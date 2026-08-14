'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api/client';
import { getAccessToken, whenTokenReady } from '@/lib/auth/tokenStore';
import type { PetSessionParams, PetSessionResponse } from '@/types/pet/petSession.types';

/**
 * Base del build de Unity (hasta el index.html inclusive). En local apunta al
 * contenedor que sirve MascotasBuild-main; en producción, al CDN.
 *
 * Si no está definida se usa la base que arme el backend, pero ojo: el backend
 * la construye como `https://${pets.cdn-domain}/...` y en dev `R2_PETS_CDN_DOMAIN`
 * viene vacío, con lo que llega malformada (`https:///index.html?...`). Por eso
 * en local esta variable es obligatoria en la práctica.
 */
const GAME_BASE_URL = process.env.NEXT_PUBLIC_PET_GAME_URL;

/**
 * El build NO habla por postMessage: lee `window.gameConfig` y le pega directo
 * a la API. Necesita dos credenciales distintas, porque el backend protege cada
 * familia de endpoints de forma diferente:
 *
 *   • session_token + user_hash → body de /pet/** (catálogo, escenas, notifs)
 *   • bearer_token (JWT)        → header Authorization de /consumer/wallet/keys/**
 *
 * El JWT viaja en el fragmento (#) y no en el query a propósito: el fragmento no
 * se manda al servidor, así que no queda en los logs de acceso del CDN.
 */
function buildIframeUrl(base: string, { sessionToken, userHash }: PetSessionParams, bearerToken: string | null) {
  const query = new URLSearchParams({
    session_token: sessionToken,
    user_hash: userHash,
  });

  const fragment = bearerToken
    ? `#${new URLSearchParams({ bearer_token: bearerToken })}`
    : '';

  return `${base}?${query}${fragment}`;
}

/**
 * Saca session_token/user_hash de la URL que devuelve el backend.
 *
 * No usamos `new URL()` porque con la URL malformada de dev tira TypeError; nos
 * quedamos solo con el query string, que es lo único que nos interesa.
 */
function parseSessionUrl(url: string): { base: string; params: PetSessionParams | null } {
  const [base, query = ''] = url.split('?');
  const search = new URLSearchParams(query);
  const sessionToken = search.get('session_token');
  const userHash = search.get('user_hash');

  return {
    base,
    params: sessionToken && userHash ? { sessionToken, userHash } : null,
  };
}

export function usePetSession() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // StrictMode monta los efectos dos veces en dev y cada init crea una fila en
  // pet_session, así que la primera corrida se queda con el turno.
  const initStarted = useRef(false);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // El interceptor de apiClient ya espera a whenTokenReady(), pero acá lo
      // necesitamos explícito: además de mandar el JWT, tenemos que leerlo para
      // pasárselo al iframe.
      await whenTokenReady();

      const { data } = await apiClient.post<PetSessionResponse>('/pet/session/init');
      const { base, params } = parseSessionUrl(data.url);

      if (!params) {
        setError('La sesión del juego llegó sin session_token/user_hash.');
        return;
      }

      setIframeUrl(buildIframeUrl(GAME_BASE_URL ?? base, params, getAccessToken()));
    } catch {
      setError('No pudimos iniciar tu mascota. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;
    initSession();
  }, [initSession]);

  const retry = useCallback(() => {
    initStarted.current = true;
    return initSession();
  }, [initSession]);

  return { iframeUrl, loading, error, retry };
}
