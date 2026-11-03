import { readApiError } from '@/lib/api/apiError';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
// Un 403 o un 404 no se arreglan reintentando; lo demás, un reintento (como el valor por defecto).
export function retryUnlessForbiddenOrMissing(failureCount: number, error: unknown): boolean {
  const { status } = readApiError(error);
  if (status === 403 || status === 404) return false;
  return failureCount < 1;
}
