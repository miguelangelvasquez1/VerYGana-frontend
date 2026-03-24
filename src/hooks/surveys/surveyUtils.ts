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