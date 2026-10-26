// Reconocimientos de VERYGANA: etiquetas, formateo y manejo de errores
// compartidos entre el panel del admin y "Mis reconocimientos".
//
// Recordatorio de lenguaje: la compradora es VERYGANA; el usuario es el
// "beneficiario". En textos para el usuario nunca "ganaste" ni "compraste".

import type {
  ComputableSaleStatus,
  RankingCriterion,
  RecognitionCriterion,
  RecognitionStatus,
  SaleComponentType,
  SalePayerType,
} from '@/types/recognitions/Recognition.types';
import { formatCopCents, formatKeys } from '@/utils/keys';

export const MAX_REASON_LENGTH = 500;
export const MAX_CAUSE_LENGTH = 500;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;
export const MAX_PERIOD_DAYS = 366;
export const DEFAULT_PERIOD_DAYS = 30;

// ─── Estados ─────────────────────────────────────────────────────────────────

const UNKNOWN_CLASSES = 'bg-gray-100 text-gray-600 border-gray-200';

export const RECOGNITION_STATUS_META: Record<RecognitionStatus, { label: string; classes: string }> = {
  PURCHASED: { label: 'Pendiente de entrega', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  DELIVERED: { label: 'Entregado', classes: 'bg-green-100 text-green-700 border-green-200' },
  EXPIRED: { label: 'Vencido', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  CANCELLED: { label: 'Anulado', classes: 'bg-red-100 text-red-700 border-red-200' },
};

export const getRecognitionStatusMeta = (status: string) =>
  RECOGNITION_STATUS_META[status as RecognitionStatus] ?? { label: status, classes: UNKNOWN_CLASSES };

export const COMPUTABLE_STATUS_META: Record<ComputableSaleStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Venta pendiente', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  RECOGNIZED: { label: 'Venta reconocida', classes: 'bg-green-100 text-green-700 border-green-200' },
  REVERSED: { label: 'Venta revertida', classes: 'bg-red-100 text-red-700 border-red-200' },
};

export const getComputableStatusMeta = (status: string) =>
  COMPUTABLE_STATUS_META[status as ComputableSaleStatus] ?? { label: status, classes: UNKNOWN_CLASSES };

export const SALE_COMPONENT_TYPE_LABEL: Record<SaleComponentType, string> = {
  USER_CASH: 'Dinero del usuario',
  KEYS_BACKING: 'Respaldo de llaves',
  VERYGANA_PAYMENT: 'Pago de VERYGANA',
};

export const SALE_PAYER_LABEL: Record<SalePayerType, string> = {
  CONSUMER: 'Consumidor',
  VERYGANA: 'VERYGANA',
};

// ─── Criterios ───────────────────────────────────────────────────────────────

export const CRITERION_LABEL: Record<RecognitionCriterion, string> = {
  KEYS_EARNED: 'Llaves ganadas',
  PURCHASES_COUNT: 'Número de compras',
  PURCHASES_AMOUNT: 'Valor de compras',
  GAMES_PLAYED: 'Partidas jugadas',
  XP: 'XP',
  OTHER: 'Otro',
};

export const RANKING_CRITERIA: RankingCriterion[] = [
  'KEYS_EARNED',
  'PURCHASES_COUNT',
  'PURCHASES_AMOUNT',
  'GAMES_PLAYED',
  'XP',
];

// XP es acumulado: no usa periodo.
export const criterionUsesPeriod = (criterion: RecognitionCriterion) => criterion !== 'XP';

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString('es-CO')} ${Math.abs(n) === 1 ? one : many}`;

// Métrica formateada según el criterio (PURCHASES_AMOUNT viene en centavos).
export function formatMetric(criterion: RecognitionCriterion, value: number | null | undefined): string {
  if (value == null) return '—';
  switch (criterion) {
    case 'KEYS_EARNED':
      return formatKeys(value);
    case 'PURCHASES_COUNT':
      return plural(value, 'compra', 'compras');
    case 'PURCHASES_AMOUNT':
      return formatCopCents(value);
    case 'GAMES_PLAYED':
      return plural(value, 'partida', 'partidas');
    case 'XP':
      return `${value.toLocaleString('es-CO')} XP`;
    default:
      return value.toLocaleString('es-CO');
  }
}

// ─── Fechas ──────────────────────────────────────────────────────────────────

// LocalDateTime sin zona (ej. "2026-10-20T14:30:00"): se muestra tal cual, sin
// convertir de zona horaria.
export function formatLocalDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 19)}Z`);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('es-CO', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Valor YYYY-MM-DD para <input type="date"> a N días de hoy (hora local).
export function dateInputDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Valida un periodo de <input type="date">. Devuelve el error o null.
export function validatePeriod(from: string, to: string): string | null {
  if (!from || !to) return 'Indica las fechas de inicio y fin del periodo.';
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Las fechas del periodo no son válidas.';
  if (start > end) return 'La fecha de inicio debe ser anterior a la de fin.';
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days > MAX_PERIOD_DAYS) return `El periodo puede ser de máximo ${MAX_PERIOD_DAYS} días.`;
  return null;
}

// ─── Montos ──────────────────────────────────────────────────────────────────

// El catálogo de productos trae el precio en PESOS; el API de reconocimientos
// trabaja en CENTAVOS.
export const pesosToCents = (pesos: number | null | undefined): number => Math.round((pesos ?? 0) * 100);

// ─── Idempotency-Key ─────────────────────────────────────────────────────────

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC 4122 v4 (crypto.randomUUID requiere contexto seguro).
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ─── Errores del backend ─────────────────────────────────────────────────────

export const FUND_INSUFFICIENT_MESSAGE =
  'El Fondo de Fortalecimiento no cubre el precio completo de este reconocimiento. No hay financiación parcial: el fondo debe cubrir el 100 %. Elige otro producto o una cantidad menor.';

export const GENERIC_ERROR_MESSAGE =
  'Ocurrió un error inesperado. Verifica que el producto siga activo e inténtalo de nuevo.';

export const NETWORK_ERROR_MESSAGE = 'No pudimos conectar con el servidor. Intenta de nuevo.';

export type RecognitionErrorKind =
  | 'FUND' // 422 fondo insuficiente / 409 FORTIFICATION
  | 'VALIDATION' // 400
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // otros 409
  | 'UNPROCESSABLE' // otros 422
  | 'SERVER' // 5xx
  | 'NETWORK'; // sin respuesta (timeout, red)

export interface RecognitionApiError {
  status: number | null;
  kind: RecognitionErrorKind;
  message: string;
  // Errores por campo de un 400 de validación (campo -> mensaje).
  fieldErrors: Record<string, string>;
  // true si el servidor respondió con un rechazo definitivo (4xx): el envío no
  // se aplicó y es seguro usar una Idempotency-Key nueva si cambian los datos.
  definitive: boolean;
}

// `details` puede venir como mapa campo -> mensaje, como lista de
// { field, message } o como lista de textos "campo: mensaje".
export function parseFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!details) return out;

  if (Array.isArray(details)) {
    details.forEach((d) => {
      if (typeof d === 'string') {
        const idx = d.indexOf(':');
        if (idx > 0) out[d.slice(0, idx).trim()] = d.slice(idx + 1).trim();
      } else if (d && typeof d === 'object') {
        const rec = d as Record<string, unknown>;
        const field = rec.field ?? rec.name ?? rec.property;
        const msg = rec.message ?? rec.defaultMessage ?? rec.error;
        if (typeof field === 'string' && msg != null) out[field] = String(msg);
      }
    });
    return out;
  }

  if (typeof details === 'object') {
    Object.entries(details as Record<string, unknown>).forEach(([field, msg]) => {
      if (msg == null) return;
      out[field] = Array.isArray(msg) ? msg.map(String).join('. ') : String(msg);
    });
  }
  return out;
}

const isFundMessage = (message: string) => /fortalecimiento|fortification/i.test(message);

export function parseRecognitionError(err: unknown): RecognitionApiError {
  const response = (err as { response?: { status?: number; data?: { message?: string; details?: unknown } } })
    ?.response;

  if (!response) {
    return { status: null, kind: 'NETWORK', message: NETWORK_ERROR_MESSAGE, fieldErrors: {}, definitive: false };
  }

  const status = response.status ?? null;
  const backendMessage = response.data?.message ?? '';
  const base = { status, fieldErrors: {} as Record<string, string>, definitive: status != null && status < 500 };

  if (status != null && status >= 500) {
    // Producto inactivo hoy llega como 500 (el backend aún no lo traduce).
    return { ...base, kind: 'SERVER', message: GENERIC_ERROR_MESSAGE };
  }
  if ((status === 422 || status === 409) && isFundMessage(backendMessage)) {
    return { ...base, kind: 'FUND', message: FUND_INSUFFICIENT_MESSAGE };
  }
  if (status === 400) {
    return {
      ...base,
      kind: 'VALIDATION',
      message: backendMessage || 'Revisa los datos ingresados.',
      fieldErrors: parseFieldErrors(response.data?.details),
    };
  }
  if (status === 404) {
    return { ...base, kind: 'NOT_FOUND', message: backendMessage || 'No encontramos el recurso solicitado.' };
  }
  if (status === 409) {
    return { ...base, kind: 'CONFLICT', message: backendMessage || 'La operación entra en conflicto con el estado actual.' };
  }
  if (status === 422) {
    return { ...base, kind: 'UNPROCESSABLE', message: backendMessage || 'No se pudo procesar la solicitud.' };
  }
  return { ...base, kind: 'VALIDATION', message: backendMessage || GENERIC_ERROR_MESSAGE };
}
