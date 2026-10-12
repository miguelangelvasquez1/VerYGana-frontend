// Llaves Promocionales (MP-12) — constantes y helpers compartidos entre el
// checkout, el historial, el panel del comercial y el del admin.
//
// OJO (exigencia del contrato): las Llaves NO son dinero. Nunca mostrarlas en
// pesos como si fueran saldo del usuario; en recibos y resúmenes van en un
// renglón aparte ("Llaves aplicadas: N llaves") del dinero pagado.

import type { KeyPromotionOfferStatus, KeyPromotionStatus } from '@/types/keys/KeyPromotion.types';

// 1 llave = $10 COP = 1.000 centavos.
export const CENTS_PER_KEY = 1000;

// Tope ordinario de cobertura con llaves; las promociones lo suben hasta 70 %.
export const ORDINARY_KEYS_PCT = 50;

const COLOMBIA_TZ = 'America/Bogota';
// Colombia no tiene horario de verano: el offset es fijo.
const COLOMBIA_OFFSET = '-05:00';
const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000;

const COP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

// Montos en CENTAVOS -> "$1.234.567"
export const formatCopCents = (cents: number | null | undefined): string =>
    COP.format(Math.round((cents ?? 0) / 100));

export const centsToKeys = (cents: number | null | undefined): number =>
    Math.round((cents ?? 0) / CENTS_PER_KEY);

// 2000 -> "2.000 llaves" · 1 -> "1 llave"
export const formatKeys = (keys: number | null | undefined): string => {
    const n = keys ?? 0;
    return `${n.toLocaleString('es-CO')} ${Math.abs(n) === 1 ? 'llave' : 'llaves'}`;
};

// ─── Fechas (siempre en hora de Colombia) ────────────────────────────────────

export const formatColombiaDate = (iso: string | Date | null | undefined): string => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    return date.toLocaleDateString('es-CO', {
        timeZone: COLOMBIA_TZ,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const formatColombiaDateTime = (iso: string | Date | null | undefined): string => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    return date.toLocaleString('es-CO', {
        timeZone: COLOMBIA_TZ,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ISO del backend -> valor de <input type="datetime-local"> en hora de Colombia.
export const isoToColombiaInput = (iso: string | null | undefined): string => {
    if (!iso) return '';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    return new Date(date.getTime() - COLOMBIA_OFFSET_MS).toISOString().slice(0, 16);
};

// "2026-11-01T00:00" (hora de Colombia) -> "2026-11-01T00:00:00-05:00"
export const colombiaInputToIso = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    const iso = `${value.length === 16 ? `${value}:00` : value}${COLOMBIA_OFFSET}`;
    return isNaN(new Date(iso).getTime()) ? undefined : iso;
};

// ─── Estados ─────────────────────────────────────────────────────────────────

export const OFFER_STATUS_META: Record<KeyPromotionOfferStatus, { label: string; classes: string }> = {
    PENDING_ACCEPTANCE: { label: 'Pendiente de aceptación', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    ACCEPTED: { label: 'Aceptada', classes: 'bg-green-100 text-green-700 border-green-200' },
    REJECTED: { label: 'Rechazada', classes: 'bg-red-100 text-red-700 border-red-200' },
    WITHDRAWN: { label: 'Retirada', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const PROMOTION_STATUS_META: Record<KeyPromotionStatus, { label: string; classes: string }> = {
    DRAFT: { label: 'Borrador', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
    AUTHORIZED: { label: 'Autorizada', classes: 'bg-green-100 text-green-700 border-green-200' },
    PAUSED: { label: 'Pausada', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    ENDED: { label: 'Cerrada', classes: 'bg-slate-200 text-slate-600 border-slate-300' },
};

const UNKNOWN_STATUS_CLASSES = 'bg-gray-100 text-gray-600 border-gray-200';

export const getOfferStatusMeta = (status: string) =>
    OFFER_STATUS_META[status as KeyPromotionOfferStatus] ?? { label: status, classes: UNKNOWN_STATUS_CLASSES };

export const getPromotionStatusMeta = (status: string) =>
    PROMOTION_STATUS_META[status as KeyPromotionStatus] ?? { label: status, classes: UNKNOWN_STATUS_CLASSES };

// ─── Errores del backend ─────────────────────────────────────────────────────
// Se muestra el `message` del backend tal cual; el texto propio solo cubre el
// caso en que no hubo respuesta (red caída, timeout).

export interface KeysApiError {
    status: number | null;
    message: string;
}

export function parseKeysError(err: unknown): KeysApiError {
    const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
    return {
        status: response?.status ?? null,
        message: response?.data?.message || 'No pudimos conectar con el servidor. Intenta de nuevo.',
    };
}
