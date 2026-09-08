// Formateadores y mapeos compartidos por las secciones del panel de analíticas
// conectadas a la API real (Anuncios, Encuestas, Juegos, Remisión).

/** Marcador para valores sin datos suficientes (p.ej. *Pct ausente, denominador 0). */
export const NO_DATA = '—';

/** Centavos de COP → "$1.234.567". */
export const formatCOP = (cents: number | null | undefined): string => {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

/** Entero localizado ("1.234"). */
export const formatInt = (n: number | null | undefined): string =>
  (n ?? 0).toLocaleString('es-CO');

/**
 * Porcentaje 0-100 → "45,3 %". Los campos *Pct pueden venir ausentes del JSON
 * (el back omite nulls cuando el denominador es 0) → se muestran como "—".
 */
export const formatPct = (pct: number | null | undefined): string => {
  if (pct == null || Number.isNaN(pct)) return NO_DATA;
  const rounded = Math.round(pct * 10) / 10;
  return `${rounded.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
};

/** Clamp 0-100 para barras de progreso; `null`/ausente → 0. */
export const pctForBar = (pct: number | null | undefined): number => {
  if (pct == null || Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
};

/** Segundos → "2h 15m" / "45m" / "30s". */
export const formatDuration = (totalSeconds: number | null | undefined): string => {
  const s = Math.max(0, Math.round(totalSeconds ?? 0));
  if (s === 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

/** ISO date → "dd/MM" para ejes de gráficas. Acepta "YYYY-MM-DD" o ISO completo. */
export const shortDay = (iso: string): string => {
  if (!iso) return '';
  const d = iso.slice(0, 10);
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
};

/** ISO → "3 sep 2026". */
export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return NO_DATA;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NO_DATA;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/** ISO → "3 sep, 14:05". */
export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return NO_DATA;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return NO_DATA;
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ─── Estados (enum EN → etiqueta ES + color del chip) ─────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PENDING_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  ACTIVE: 'Activa',
  PUBLISHED: 'Publicada',
  PAUSED: 'Pausada',
  SUSPENDED: 'Suspendida',
  COMPLETED: 'Completada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
  BLOCKED: 'Bloqueada',
};

const STATUS_CHIP_CLASSES: Record<string, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-600',
  PENDING: 'bg-yellow-50 text-yellow-700',
  PENDING_REVIEW: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-teal-50 text-teal-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PUBLISHED: 'bg-emerald-50 text-emerald-700',
  PAUSED: 'bg-amber-50 text-amber-700',
  SUSPENDED: 'bg-purple-50 text-purple-700',
  COMPLETED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-red-50 text-red-600',
  EXPIRED: 'bg-zinc-100 text-zinc-500',
  BLOCKED: 'bg-orange-50 text-orange-700',
};

export const statusLabel = (status: string | null | undefined): string => {
  if (!status) return NO_DATA;
  return STATUS_LABELS[status] ?? status;
};

export const statusChipClass = (status: string | null | undefined): string =>
  (status && STATUS_CHIP_CLASSES[status]) || 'bg-gray-100 text-gray-600';

// ─── Manejo de errores de los endpoints de reporte ───────────────────────────

/**
 * Si se llama un endpoint de datos sin permiso, la API responde 400 con
 * `{ "message": "<texto en español>" }`. Se muestra ese mensaje como fallback;
 * cualquier otro error usa un texto genérico.
 */
export const reportErrorMessage = (
  error: unknown,
  fallback = 'No pudimos cargar los datos. Intenta de nuevo en unos minutos.',
): string => {
  const err = error as
    | { response?: { status?: number; data?: { message?: string } } }
    | undefined;
  const message = err?.response?.data?.message;
  if (err?.response?.status === 400 && typeof message === 'string' && message.trim()) {
    return message;
  }
  return fallback;
};
