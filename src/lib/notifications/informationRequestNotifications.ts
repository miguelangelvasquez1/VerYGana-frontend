// Sin 'use client' para poder importarse desde las pruebas de Vitest.
export const INFORMATION_REQUESTS_PATH = '/commercial/profile/information-requests';

// DEP-1: la API guarda `type = IN_APP_NOTIFICATION` en todas las notificaciones y no manda el
// `requestPublicId`, así que solo se reconocen por el título exacto que ella escribe. Cuando la
// API mande un tipo propio y el `requestPublicId`, reemplazar esta constante por ellos.
export const INFORMATION_REQUEST_NOTIFICATION_TITLES = [
  'Solicitud de información de VERYGANA',
  'Tu respuesta tiene observaciones',
] as const;

// Ruta a la que lleva una notificación del panel comercial, o null si no es de solicitudes.
// Comparación exacta: sin recortar espacios ni ignorar mayúsculas.
export function commercialNotificationHref(notification: { title: string }): string | null {
  return (INFORMATION_REQUEST_NOTIFICATION_TITLES as readonly string[]).includes(notification.title)
    ? INFORMATION_REQUESTS_PATH
    : null;
}
