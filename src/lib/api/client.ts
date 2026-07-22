import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import { getAccessToken, whenTokenReady } from '@/lib/auth/tokenStore';
import { refreshAccessToken } from '@/lib/auth/tokenRefresh';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

/**
 * `getSession()` hace un fetch a /api/auth/session. Si esa ruta se queda
 * colgada (frecuente cuando disparan varias requests en paralelo, o la
 * pestaña estuvo en segundo plano), este interceptor nunca resuelve — la
 * request de axios ni siquiera llega a salir, por eso se ve "cargando" en
 * devtools sin que nada le pegue al backend. Con el timeout, si la sesión
 * no responde a tiempo seguimos sin token: el backend devuelve 401 (un
 * fallo acotado y ya manejado abajo) en vez de colgarse para siempre.
 */
const SESSION_TIMEOUT_MS = 4000;

async function getSessionSafe() {
  try {
    return await Promise.race([
      getSession(),
      new Promise((resolve) => setTimeout(() => resolve(null), SESSION_TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
}

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(async (config) => {
  // Cliente (browser): el token vive en memoria, sincronizado por
  // <AuthProvider> desde useSession(). Sin round-trip de red por request —
  // `whenTokenReady()` solo espera la primera vez (antes de que ese efecto
  // corra), después resuelve al instante.
  if (typeof window !== 'undefined') {
    // Timeout de seguridad simétrico al del camino server-side: si
    // AuthProvider nunca llega a montar/sincronizar, no nos quedamos
    // colgados para siempre esperando el primer sync.
    await Promise.race([
      whenTokenReady(),
      new Promise((resolve) => setTimeout(resolve, SESSION_TIMEOUT_MS)),
    ]);
    const token = getAccessToken();
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  // Server (Server Components haciendo su propio data fetching, ej. la
  // página de detalle de producto): no hay <AuthProvider> corriendo acá,
  // así que seguimos usando getSession() con timeout de seguridad.
  const session = await getSessionSafe();
  const token = (session as any)?.accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use((response) => response, async (error) => {

  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  const originalRequest = error?.config;

  /*
   * FEATURE FLAGS / MANTENIMIENTO
   */
  if (status === 503 && canShow503Toast()) {

    toast(message || "El servicio no está disponible temporalmente. Por favor, inténtalo de nuevo más tarde.");
  }

  /*
   * TOKEN EXPIRADO / SESIÓN INVÁLIDA
   *
   * Un 401 no siempre significa "sesión inválida" — la causa más común es
   * que el access token (vida corta) expiró mientras la pestaña estaba
   * inactiva. Antes de resignarnos y mandar al usuario a /login, intentamos
   * un refresh (con lock compartido, ver tokenRefresh.ts) y reintentamos la
   * request original una sola vez. Solo si el refresh también falla (sesión
   * realmente inválida/expirada) hacemos signOut.
   */
  if (status === 401 && originalRequest && !originalRequest._retry) {
    originalRequest._retry = true;
    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch {
      await handleUnauthorized();
      return Promise.reject(error);
    }
  }

  if (status === 401) {
    await handleUnauthorized();
  }

  return Promise.reject(error);
}
);

export default apiClient;

async function handleUnauthorized() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    console.error('Error during signOut after 401:', error);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/*
 * Evita spam de toasts cuando varias requests
 * fallan al mismo tiempo
 */
let last503Toast = 0;

function canShow503Toast(): boolean {
  const now = Date.now();

  if (now - last503Toast < 5000) {
    return false;
  }

  last503Toast = now;
  return true;
}

export async function privateImageSrc(url: string | null | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.includes('/private-image')) {
    let token: string | undefined;
    if (typeof window !== 'undefined') {
      await whenTokenReady();
      token = getAccessToken() ?? undefined;
    } else {
      const session = await getSessionSafe();
      token = (session as any)?.accessToken;
    }
    return token ? `${url}?token=${encodeURIComponent(token)}` : undefined;
  }
  return url;
}
