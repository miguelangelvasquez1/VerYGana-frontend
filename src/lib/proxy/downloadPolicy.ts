/**
 * Política de /api/proxy-download: decide si una URL puede ser descargada por el servidor.
 * Función pura (sin red ni entorno) para poder probarla aislada.
 */

/** Tope por archivo. La API admite hasta 20 MB por recurso corporativo (MAX_RESOURCE_SIZE_BYTES); se deja margen. */
export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

/** Tiempo límite total (conexión + cuerpo) hacia el origen. */
export const DOWNLOAD_TIMEOUT_MS = 60_000;

/**
 * Convierte la lista separada por comas en un conjunto de hosts en minúsculas.
 * Una variable ausente o vacía da un conjunto vacío: la ruta rechaza todo (falla cerrado).
 */
export function parseAllowedHosts(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter((h) => h.length > 0),
  );
}

export type TargetCheck = { ok: true; url: URL } | { ok: false };

/**
 * Acepta solo https, puerto 443 (implícito o explícito), sin credenciales y con el
 * hostname exactamente igual a uno de la lista (sin sufijos ni prefijos).
 */
export function validateTarget(raw: string | null, allowedHosts: Set<string>): TargetCheck {
  if (!raw || allowedHosts.size === 0) return { ok: false };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false };
  }

  if (url.protocol !== 'https:') return { ok: false };
  if (url.username !== '' || url.password !== '') return { ok: false };
  if (url.port !== '' && url.port !== '443') return { ok: false };
  if (!allowedHosts.has(url.hostname.toLowerCase())) return { ok: false };

  return { ok: true, url };
}
