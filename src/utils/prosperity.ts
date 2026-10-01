// Saldo de Prosperidad (MP-05) — constantes y helpers compartidos entre el
// panel del empresario, el admin y las pantallas de recarga / cambio de plan /
// onboarding.
//
// OJO (exigencia del contrato): el Saldo de Prosperidad NO es dinero. Nunca
// llamarlo "dinero", "saldo disponible", "saldo a favor" ni "retirable".

import type {
  ProsperityMovementResponseDTO,
  ProsperityMovementType,
  ProsperityStatus,
} from '@/types/commercial/Prosperity.types';

// Cada inversión STANDARD suma este múltiplo de su valor neto (sin IVA).
export const PROSPERITY_MULTIPLIER = 4;

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// Montos en CENTAVOS -> "$1.234.567"
export const formatProsperityCents = (cents: number | null | undefined): string =>
  COP.format(Math.round((cents ?? 0) / 100));

// Montos ya en PESOS (previews de recarga / cambio de plan) -> "$1.234.567"
export const formatProsperityPesos = (pesos: number | null | undefined): string =>
  COP.format(Math.round(pesos ?? 0));

// Umbral que genera una inversión, calculado sobre el valor NETO (sin IVA).
export const thresholdFromNetPesos = (netPesos: number | null | undefined): number =>
  Math.max(0, netPesos ?? 0) * PROSPERITY_MULTIPLIER;

export const formatProsperityDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatProsperityDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Tipos de movimiento ─────────────────────────────────────────────────────
// Mapa único de labels. Créditos con "+" en verde; débitos con "−" en color
// neutro (consumir el Saldo es lo normal, no es una alerta).

export interface MovementTypeMeta {
  label: string;
  credit: boolean;
}

export const MOVEMENT_TYPE_META: Record<ProsperityMovementType, MovementTypeMeta> = {
  THRESHOLD_GENERATED: { label: 'Umbral por inversión', credit: true },
  SALE_ABSORPTION: { label: 'Venta cubierta por tu Saldo', credit: false },
  REFUND_REINTEGRATION: { label: 'Reintegro por devolución', credit: true },
  THRESHOLD_REVERSAL: { label: 'Reversión de inversión', credit: false },
  ADJUSTMENT_CREDIT: { label: 'Ajuste a favor', credit: true },
  ADJUSTMENT_DEBIT: { label: 'Ajuste en contra', credit: false },
};

export function getMovementTypeMeta(type: string): MovementTypeMeta {
  return (
    MOVEMENT_TYPE_META[type as ProsperityMovementType] ?? {
      label: type,
      credit: false,
    }
  );
}

export function formatSignedMovement(m: Pick<ProsperityMovementResponseDTO, 'type' | 'amountCents'>): string {
  const { credit } = getMovementTypeMeta(m.type);
  return `${credit ? '+' : '−'}${formatProsperityCents(Math.abs(m.amountCents))}`;
}

// Subtítulo bajo el concepto (panel del empresario).
export function describeMovement(m: ProsperityMovementResponseDTO): string | null {
  switch (m.type) {
    case 'SALE_ABSORPTION': {
      const sale = m.saleAmountCents ?? m.amountCents;
      const base = `Venta de ${formatProsperityCents(sale)}: ${formatProsperityCents(m.amountCents)} cubiertos por tu Saldo`;
      const diff = sale - m.amountCents;
      return diff > 0 ? `${base} y ${formatProsperityCents(diff)} pagaron comisión` : base;
    }
    case 'THRESHOLD_GENERATED':
      return m.originId ? `Inversión #${m.originId}` : null;
    case 'REFUND_REINTEGRATION':
      return m.originId ? `Devolución de la venta #${m.originId}` : null;
    default:
      return null;
  }
}

// ─── Estado ──────────────────────────────────────────────────────────────────

export const isProsperityVisible = (status: ProsperityStatus | string | null | undefined): boolean =>
  status === 'ACTIVE' || status === 'FROZEN';

// ─── Idempotencia ────────────────────────────────────────────────────────────

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 para navegadores sin randomUUID (http no seguro).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Errores del backend ─────────────────────────────────────────────────────
// 422 -> se muestra `message` tal cual. 400 -> `details` junto a cada campo.

export interface ProsperityApiError {
  status: number | null;
  message: string;
  details: Record<string, string>;
}

export function parseProsperityError(err: unknown): ProsperityApiError {
  const response = (err as { response?: { status?: number; data?: { message?: string; details?: unknown } } })
    ?.response;
  const data = response?.data;
  return {
    status: response?.status ?? null,
    message: data?.message || 'Ocurrió un error. Intenta de nuevo.',
    details:
      data?.details && typeof data.details === 'object' ? (data.details as Record<string, string>) : {},
  };
}
