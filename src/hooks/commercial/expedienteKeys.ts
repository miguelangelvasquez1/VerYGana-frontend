import { taxProfileKeys } from '@/hooks/commercial/taxProfileKeys';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
export const expedienteKeys = {
  all: ['commercial-expediente'] as const,
  list: ['commercial-expediente', 'list'] as const,
};

// Qué claves deja desactualizadas cada mutación (RN-17). Los hooks recorren estas listas.
export const EXPEDIENTE_INVALIDATIONS = {
  // Confirmar deja viejos el expediente (y con él el selector de soporte y los nombres del
  // detalle) y los documentos del onboarding.
  confirmUpload: [expedienteKeys.list, taxProfileKeys.onboardingDocuments],
  // Un 400 al preparar o confirmar suele ser "ya no está vigente": la lista está vieja.
  uploadRejected: [expedienteKeys.list],
} as const;
