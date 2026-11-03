import axios from 'axios';
import type { ApiErrorBody } from '@/services/commercial/OnboardingService';

export interface ReadApiError {
  status?: number;
  message?: string;
  details?: Record<string, string>;
}

// Campos del DTO que en el formulario se llaman distinto.
const RENAMED_FIELDS: Record<string, string> = { amountCents: 'amount' };

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'string')
  );
}

function isApiErrorBody(data: unknown): data is Partial<ApiErrorBody> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

// Extrae de un error de axios solo lo que se puede mostrar. Nunca devuelve la configuración
// de la petición (lleva la cabecera de autorización) ni el cuerpo enviado.
export function readApiError(err: unknown): ReadApiError {
  if (!axios.isAxiosError(err)) return {};
  const result: ReadApiError = {};
  if (typeof err.response?.status === 'number') result.status = err.response.status;
  const data: unknown = err.response?.data;
  if (isApiErrorBody(data)) {
    if (typeof data.message === 'string' && data.message) result.message = data.message;
    if (isStringRecord(data.details)) result.details = data.details;
  }
  return result;
}

// `activities[0].ciiuCode` -> `activities.0.ciiuCode`, con los campos renombrados del formulario.
export function toFormFieldPath(dtoPath: string): string {
  return dtoPath
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((segment) => RENAMED_FIELDS[segment] ?? segment)
    .join('.');
}
