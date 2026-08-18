'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api/client';
import { getAccessToken, onAccessTokenChange, whenTokenReady } from '@/lib/auth/tokenStore';
import { refreshAccessToken } from '@/lib/auth/tokenRefresh';
import { parseJwt } from '@/lib/utils/parseJwt';
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

  // El iframe vive en otro origen, así que no podemos tocar su unityInstance:
  // el puente de index.html traduce estos mensajes a SendMessage.
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // session_token/user_hash de la sesión activa: el juego los necesita junto al
  // JWT en cada inyección, y no se pueden releer de la URL del iframe.
  const sessionParams = useRef<PetSessionParams | null>(null);

  const pushAuth = useCallback((bearerToken: string | null) => {
    const target = iframeRef.current?.contentWindow;
    const params = sessionParams.current;
    if (!target || !params || !bearerToken) return;

    target.postMessage(
      {
        type: 'PET_SET_AUTH',
        payload: {
          bearerToken,
          sessionToken: params.sessionToken,
          userHash: params.userHash,
        },
      },
      '*',
    );
  }, []);

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

      sessionParams.current = params;
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

  // Empuje preventivo: cada refresh de AuthProvider viaja al juego, que si no
  // seguiría usando el JWT que capturó al arrancar (vida útil: 15 min).
  useEffect(() => onAccessTokenChange(pushAuth), [pushAuth]);

  /**
   * Proactivo: renueva el JWT antes de que venza, en vez de esperar al 401.
   *
   * El camino reactivo funciona, pero el usuario paga el costo: la petición que
   * dispara el 401 se pierde y tiene que volver a hacer clic. Renovando al 80%
   * de la vida útil, la ventana de token muerto prácticamente no se abre.
   *
   * Se reprograma con cada token nuevo (venga de donde venga), así que la cadena
   * se mantiene sola mientras la pestaña esté abierta.
   */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const renew = async () => {
      try {
        pushAuth(await refreshAccessToken());
      } catch {
        // Refresh caído: el 401 y el interceptor de apiClient siguen de red.
      }
    };

    const schedule = (token: string | null) => {
      clearTimeout(timer);
      if (cancelled || !token) return;

      const exp = parseJwt(token)?.exp;
      if (typeof exp !== 'number') return;

      // 80% de lo que le queda, con piso de 5 s para no entrar en bucle si el
      // token ya viene vencido o casi.
      const msLeft = exp * 1000 - Date.now();
      timer = setTimeout(renew, Math.max(msLeft * 0.8, 5_000));
    };

    // Las pestañas en segundo plano tienen los timers estrangulados, así que al
    // volver puede haber vencido sin que el timeout llegara a dispararse.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const token = getAccessToken();
      const exp = token ? parseJwt(token)?.exp : undefined;
      if (typeof exp === 'number' && exp * 1000 - Date.now() < 30_000) renew();
      else schedule(token);
    };

    const unsubscribe = onAccessTokenChange(schedule);
    document.addEventListener('visibilitychange', onVisible);
    schedule(getAccessToken());

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pushAuth]);

  // Reactivo: el juego avisa por el puente cuando le devuelven un 401. Se queda
  // como red de seguridad por si la renovación proactiva llega tarde.
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'PET_GAME_READY') {
        pushAuth(getAccessToken());
        return;
      }
      if (event.data?.type !== 'PET_AUTH_EXPIRED') return;

      try {
        pushAuth(await refreshAccessToken());
      } catch {
        // El refresh falló: la sesión venció de verdad. El interceptor de
        // apiClient ya maneja el signOut en ese caso; acá no hay nada que hacer.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pushAuth]);

  const retry = useCallback(() => {
    initStarted.current = true;
    return initSession();
  }, [initSession]);

  return { iframeUrl, loading, error, retry, iframeRef };
}
