// Mapeador central de errores para el flujo "ver anuncios" del consumer
// (GET /adLike/next, POST /adLike/like, POST /adLike/complete).
//
// El backend responde siempre el mismo shape de error:
//   { status, error, message, timestamp, path }
// La lógica se decide por `status` HTTP. Solo en el bucket 400/422 de
// /like y /complete se distingue por `message` (ver tablas en la tarea).
//
// Esta es la ÚNICA fuente de verdad para "qué hacer" ante un error de este
// flujo — nada de try/catch repartidos por componentes.

import { AxiosError } from 'axios';

export type AdFlowStage = 'next' | 'like' | 'complete';

export type AdFlowAction =
  /** Descartar sessionUUID local y pedir el siguiente anuncio, sin avisar al usuario. */
  | { type: 'ADVANCE_TO_NEXT' }
  /** Igual que ADVANCE_TO_NEXT, pero mostrando un aviso breve no bloqueante. */
  | { type: 'ADVANCE_WITH_NOTICE'; message: string }
  /** Reintentar la MISMA request (mismo sessionUUID/adId) antes de rendirse. */
  | { type: 'RETRY_SAME' }
  /** No avanzar: el usuario debe terminar de ver el anuncio actual. */
  | { type: 'KEEP_WATCHING'; message: string }
  /** No hay anuncios elegibles ahora mismo. No es un error. */
  | { type: 'NO_ADS_AVAILABLE' }
  /** Token inválido/expirado: delegar al flujo de re-autenticación existente. */
  | { type: 'REAUTH' }
  /** Error genérico no recuperable dentro de este flujo. */
  | { type: 'FATAL'; message: string };

export interface MapAdFlowErrorOptions {
  stage: AdFlowStage;
  /** Nº de intento de ESTA request (1 = primer intento). Gobierna RETRY_SAME. */
  attempt?: number;
}

/** Tope de reintentos ante fallo temporal (5xx / timeout / red). */
export const MAX_TRANSIENT_ATTEMPTS = 3;
/** Tope de reintentos ante conflicto de concurrencia en /like (400 "anuncio fue actualizado"). */
export const MAX_CONCURRENCY_ATTEMPTS = 2;

export const GENERIC_ERROR_MESSAGE =
  'No pudimos continuar con los anuncios. Inténtalo de nuevo en un momento.';
export const SESSION_CLOSED_NOTICE =
  'Esa sesión se cerró, pasando al siguiente anuncio.';
export const DAILY_LIKE_LIMIT_NOTICE =
  'Alcanzaste el límite de likes para este anuncio por hoy. Te mostramos el siguiente.';
export const NOT_WATCHED_FULLY_NOTICE =
  'Aún no puedes dar like: termina de ver el anuncio.';

// --- Clasificación por `message` (solo permitida en el bucket 400/422 descrito arriba) ---
const TOKEN_INVALID_RE = /token inv[aá]lido/i;
const NOT_WATCHED_FULLY_RE = /no visto completamente/i;
const CONCURRENCY_CONFLICT_RE = /anuncio fue actualizado/i;
const SESSION_DEAD_RES = [
  /sesi[oó]n de visualizaci[oó]n inv[aá]lida/i,
  /sesi[oó]n de visualizaci[oó]n expirada/i,
  /la sesi[oó]n no est[aá] activa/i,
  /el anuncio ya no est[aá] activo/i,
  /no est[aá] disponible para recibir likes/i,
];

function matches(message: string | undefined | null, re: RegExp): boolean {
  return !!message && re.test(message);
}

function isSessionDeadMessage(message: string | undefined | null): boolean {
  return !!message && SESSION_DEAD_RES.some((re) => re.test(message));
}

interface ReadErrorResult {
  status?: number;
  message?: string;
  /** Sin respuesta del servidor: caída de red, DNS, timeout de axios, etc. */
  isNetwork: boolean;
}

function readError(error: unknown): ReadErrorResult {
  const axiosError = error as AxiosError<{ message?: string }> | undefined;
  const response = axiosError?.response;
  return {
    status: response?.status,
    message: response?.data?.message ?? undefined,
    isNetwork: !!axiosError?.isAxiosError && response == null,
  };
}

/**
 * Traduce un error de axios de /adLike/{next,like,complete} a una acción
 * concreta para la máquina de estados del flujo de anuncios.
 */
export function mapAdFlowError(error: unknown, options: MapAdFlowErrorOptions): AdFlowAction {
  const { stage, attempt = 1 } = options;
  const { status, message, isNetwork } = readError(error);

  // Fallo temporal (red/timeout o 5xx): reintento acotado antes de rendirse.
  if (isNetwork || (status != null && status >= 500)) {
    return attempt < MAX_TRANSIENT_ATTEMPTS
      ? { type: 'RETRY_SAME' }
      : { type: 'FATAL', message: GENERIC_ERROR_MESSAGE };
  }

  // 401 lo resuelve el interceptor global (refresh + signOut si falla).
  if (status === 401) return { type: 'REAUTH' };

  switch (stage) {
    case 'next':
      return mapNextError(status);
    case 'like':
      return mapLikeError(status, message, attempt);
    case 'complete':
      return mapCompleteError(status, message);
    default:
      return { type: 'FATAL', message: GENERIC_ERROR_MESSAGE };
  }
}

function mapNextError(status: number | undefined): AdFlowAction {
  switch (status) {
    case 204:
      // No debería llegar como error de axios (204 es 2xx), pero se cubre
      // por si el cliente HTTP cambia o para tests que simulan el status.
      return { type: 'NO_ADS_AVAILABLE' };
    case 410:
      return { type: 'ADVANCE_WITH_NOTICE', message: SESSION_CLOSED_NOTICE };
    case 400:
    default:
      return { type: 'FATAL', message: GENERIC_ERROR_MESSAGE };
  }
}

function mapLikeError(
  status: number | undefined,
  message: string | undefined,
  attempt: number
): AdFlowAction {
  switch (status) {
    case 409:
      // Ya había like registrado: éxito suave, sin error visible.
      return { type: 'ADVANCE_TO_NEXT' };
    case 429:
      return { type: 'ADVANCE_WITH_NOTICE', message: message?.trim() || DAILY_LIKE_LIMIT_NOTICE };
    case 404:
      return { type: 'ADVANCE_TO_NEXT' };
    case 422:
      // "Token inválido" (userId ausente en el token).
      return { type: 'REAUTH' };
    case 400:
      if (matches(message, NOT_WATCHED_FULLY_RE)) {
        return { type: 'KEEP_WATCHING', message: message?.trim() || NOT_WATCHED_FULLY_NOTICE };
      }
      if (matches(message, CONCURRENCY_CONFLICT_RE)) {
        return attempt < MAX_CONCURRENCY_ATTEMPTS
          ? { type: 'RETRY_SAME' }
          : { type: 'ADVANCE_TO_NEXT' };
      }
      if (isSessionDeadMessage(message)) {
        return { type: 'ADVANCE_TO_NEXT' };
      }
      return { type: 'FATAL', message: GENERIC_ERROR_MESSAGE };
    default:
      return { type: 'FATAL', message: GENERIC_ERROR_MESSAGE };
  }
}

function mapCompleteError(status: number | undefined, message: string | undefined): AdFlowAction {
  switch (status) {
    case 404:
      return { type: 'ADVANCE_TO_NEXT' };
    case 422:
      // "Token inválido" → re-auth. "Sesión de visualización inválida" → descartar.
      return matches(message, TOKEN_INVALID_RE) ? { type: 'REAUTH' } : { type: 'ADVANCE_TO_NEXT' };
    case 400:
      // ValidationException con los mismos mensajes que /like.
      return matches(message, NOT_WATCHED_FULLY_RE)
        ? { type: 'KEEP_WATCHING', message: message?.trim() || NOT_WATCHED_FULLY_NOTICE }
        : { type: 'ADVANCE_TO_NEXT' };
    default:
      return { type: 'FATAL', message: GENERIC_ERROR_MESSAGE };
  }
}
