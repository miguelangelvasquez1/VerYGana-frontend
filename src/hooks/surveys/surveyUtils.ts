import type { SurveyStatus, QuestionType, TargetGender } from '@/types/survey.types';

// ─── Label maps ───────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<SurveyStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
  CLOSED: 'Cerrada',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Opción única',
  MULTIPLE_CHOICE: 'Opción múltiple',
  TEXT: 'Texto libre',
  RATING: 'Calificación (1-5)',
  YES_NO: 'Sí / No',
};

export const GENDER_LABELS: Record<TargetGender, string> = {
  MALE: 'Hombres',
  FEMALE: 'Mujeres',
  ALL: 'Todos',
};

// ─── Status badge colors (Tailwind) ───────────────────────────────────────────

export const STATUS_COLORS: Record<SurveyStatus, string> = {
  DRAFT:  'bg-zinc-100 text-zinc-600',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  PAUSED: 'bg-amber-50 text-amber-700',
  CLOSED: 'bg-red-50 text-red-600',
};

// ─── Reward formatting ────────────────────────────────────────────────────────

export function formatReward(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Recompensas de encuestas para el consumidor se pagan en llaves, no en COP. */
export function formatKeys(amount: number): string {
  return amount.toLocaleString('es-CO');
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function getResponseProgress(
  count: number,
  max: number | null,
): number {
  if (!max) return 0;
  return Math.min(Math.round((count / max) * 100), 100);
}

// ─── Scarcity / urgency ───────────────────────────────────────────────────────

/** Cupos restantes, o null si la encuesta no tiene límite de respuestas. */
export function getSpotsRemaining(
  maxResponses: number | null,
  responseCount: number | null,
): number | null {
  if (maxResponses == null) return null;
  return Math.max(maxResponses - (responseCount ?? 0), 0);
}

const SPOTS_SCARCITY_THRESHOLD = 30;

/**
 * Texto tipo "Quedan 5 cupos" cuando los cupos restantes están por debajo
 * del umbral de escasez. Devuelve null si la encuesta es ilimitada o si
 * todavía quedan muchos cupos.
 */
export function getScarcitySpotsLabel(
  maxResponses: number | null,
  responseCount: number | null,
): string | null {
  const remaining = getSpotsRemaining(maxResponses, responseCount);
  if (remaining == null || remaining > SPOTS_SCARCITY_THRESHOLD) return null;
  if (remaining <= 0) return null;
  return remaining === 1 ? 'Último cupo' : `Quedan ${remaining} cupos`;
}

const URGENCY_THRESHOLD_MS = 72 * 60 * 60 * 1000;

/**
 * Texto tipo "Termina en 5 h" cuando `endsAt` está dentro del umbral de urgencia.
 * Devuelve null si no hay fecha límite o si falta demasiado tiempo.
 */
export function getUrgentDeadlineLabel(endsAt: string | null): string | null {
  if (!endsAt) return null;

  const msLeft = new Date(endsAt).getTime() - Date.now();
  if (msLeft <= 0 || msLeft > URGENCY_THRESHOLD_MS) return null;

  const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
  if (hoursLeft < 24) return `Termina en ${hoursLeft} h`;

  const daysLeft = Math.ceil(hoursLeft / 24);
  return `Termina en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`;
}