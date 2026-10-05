// Una sola conexión SSE de notificaciones por pestaña. La abre NotificationsProvider
// mientras hay sesión; ningún componente ni hook crea su propio EventSource.
//
// Por qué vive a nivel de módulo y no dentro del hook: cada EventSource abierto
// ocupa una de las 6 conexiones HTTP/1.1 que el navegador permite por host, y ese
// cupo es común a todas las pestañas. Cuando el hook abría la suya, un doble
// montaje (StrictMode, Fast Refresh) o un desmontaje a mitad del `await` dejaba
// un EventSource sin referencia que nadie cerraba y que el navegador reconectaba
// para siempre. Con el cupo lleno, el resto de las requests al API se quedaban en
// cola hasta el timeout de 30 s de axios.

import { getAccessToken, onAccessTokenChange, whenTokenReady } from '@/lib/auth/tokenStore';
import { refreshAccessToken } from '@/lib/auth/tokenRefresh';
import { parseJwt } from '@/lib/utils/parseJwt';
import { NotificationResponseDTO } from '@/types/Generic.types';

export interface NotificationStreamHandlers {
  onNotification: (notification: NotificationResponseDTO) => void;
  /** La conexión volvió tras una caída: pudo haberse perdido algún evento en el hueco. */
  onReconnect?: () => void;
}

const BASE_RETRY_MS = 2_000;
const MAX_RETRY_MS = 60_000;
/** Margen para no abrir el stream con un token al que le quedan segundos de vida. */
const TOKEN_EXPIRY_MARGIN_MS = 10_000;

const subscribers = new Set<NotificationStreamHandlers>();

let source: EventSource | null = null;
let connectedToken: string | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
let hasOpenedOnce = false;
let unsubscribeFromToken: (() => void) | null = null;
// Cada connect()/teardown invalida a los anteriores: un connect que estaba en un
// `await` cuando llegó otro (o cuando se fue el último suscriptor) no abre nada.
let generation = 0;

function isExpired(token: string): boolean {
  const exp = parseJwt(token)?.exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 - TOKEN_EXPIRY_MARGIN_MS <= Date.now();
}

function closeSource() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  source?.close();
  source = null;
  connectedToken = null;
}

function scheduleReconnect() {
  if (retryTimer || subscribers.size === 0) return;
  const delay = Math.min(BASE_RETRY_MS * 2 ** retryAttempt, MAX_RETRY_MS);
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void connect();
  }, delay);
}

async function connect() {
  const myGeneration = ++generation;
  closeSource();

  await whenTokenReady();
  if (myGeneration !== generation || subscribers.size === 0) return;

  let token = getAccessToken();
  if (!token) return; // sin sesión; onAccessTokenChange reintenta cuando haya token

  // El token viaja en la URL y EventSource reconecta siempre con la misma: si ya
  // venció, el backend contesta 401 y el stream muere. Se renueva antes de abrir.
  if (isExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      if (myGeneration === generation) scheduleReconnect();
      return;
    }
    if (myGeneration !== generation || subscribers.size === 0) return;
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(url);
  source = eventSource;
  connectedToken = token;

  eventSource.onopen = () => {
    retryAttempt = 0;
    if (hasOpenedOnce) subscribers.forEach((s) => s.onReconnect?.());
    hasOpenedOnce = true;
  };

  eventSource.addEventListener('notification', (event: MessageEvent) => {
    const notification: NotificationResponseDTO = JSON.parse(event.data);
    subscribers.forEach((s) => s.onNotification(notification));
  });

  eventSource.onerror = () => {
    // CONNECTING: el navegador ya está reintentando por su cuenta, no hay que hacer nada.
    // CLOSED: se rindió (típicamente un 401) y no vuelve solo.
    if (source !== eventSource || eventSource.readyState !== EventSource.CLOSED) return;
    closeSource();
    scheduleReconnect();
  };
}

function teardown() {
  generation += 1;
  closeSource();
  unsubscribeFromToken?.();
  unsubscribeFromToken = null;
  retryAttempt = 0;
  hasOpenedOnce = false;
}

/**
 * Se abre con el primer suscriptor y se cierra con el último.
 * Devuelve la función para desuscribirse.
 */
export function subscribeToNotificationStream(handlers: NotificationStreamHandlers): () => void {
  subscribers.add(handlers);

  if (subscribers.size === 1) {
    // Login, refresh o logout: reabrir con el token nuevo (o cerrar si ya no hay).
    unsubscribeFromToken = onAccessTokenChange((token) => {
      if (token === connectedToken) return;
      retryAttempt = 0;
      void connect();
    });
    void connect();
  }

  return () => {
    subscribers.delete(handlers);
    if (subscribers.size === 0) teardown();
  };
}
