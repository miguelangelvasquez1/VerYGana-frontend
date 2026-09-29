import { useCallback, useRef } from 'react';

/**
 * La `contentUrl` de un anuncio BLOCKED es una URL prefirmada de corta duración
 * (~5 min): al bloquear, el back revierte el asset a almacenamiento privado en R2
 * y la URL pública del CDN deja de servir. Si la lista/el detalle quedan abiertos
 * más de ese plazo, el <img>/<video> pasa a dar 403.
 *
 * Este handler se engancha al `onError` de esos elementos y pide de nuevo el
 * recurso (`refetch`) para obtener una URL fresca. El `cooldown` evita un bucle
 * de refetch si varias imágenes fallan a la vez o la nueva URL también viene
 * caducada por reloj desfasado.
 */
export function useRefetchOnExpiredMedia(
  refetch: () => void,
  cooldownMs = 20_000,
) {
  const lastRunRef = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastRunRef.current < cooldownMs) return;
    lastRunRef.current = now;
    refetch();
  }, [refetch, cooldownMs]);
}
