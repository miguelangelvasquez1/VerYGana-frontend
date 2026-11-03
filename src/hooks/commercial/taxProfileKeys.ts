import type { DeclarationCode, DisclosureContext } from '@/types/commercial/Declaration.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
export const taxProfileKeys = {
  all: ['commercial-tax-profile'] as const,
  profile: ['commercial-tax-profile', 'profile'] as const,
  versions: ['commercial-tax-profile', 'versions'] as const,
  version: (versionNumber: number) =>
    ['commercial-tax-profile', 'versions', versionNumber] as const,
  catalog: ['commercial-tax-profile', 'catalog'] as const,
  establishments: ['commercial-establishments'] as const,
  // Prefijo de todas las declaraciones, sea cual sea el código y el contexto.
  declarationsAll: ['commercial-declarations'] as const,
  declaration: (code: DeclarationCode, context: DisclosureContext) =>
    ['commercial-declarations', code, context] as const,
  // El estado del onboarding y sus documentos (el asistente aún los pide sin Query).
  onboardingAll: ['commercial-onboarding'] as const,
  onboardingDocuments: ['commercial-onboarding', 'documents'] as const,
};

// RN-10 de la 015: en la Hoja Final el texto se pide cada vez que se muestra el paso y nunca se
// reutiliza uno guardado; en la ficha (TAX_PROFILE) se conservan los 30 min de la 014 (D-7).
export function declarationCachePolicy(context: DisclosureContext) {
  return context === 'CONTRACT_SHEET'
    ? { staleTime: 0, gcTime: 0, refetchOnMount: 'always' as const }
    : { staleTime: 30 * 60 * 1000 };
}

// T14 (015): tras aprobar, las declaraciones de la Hoja Final se marcan desactualizadas pero no se
// vuelven a pedir: la API registra cada GET de CONTRACT_SHEET como una puesta a disposición.
export function isContractSheetDeclarationKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === taxProfileKeys.declarationsAll[0] && queryKey[2] === 'CONTRACT_SHEET';
}

// Qué claves deja desactualizadas cada mutación (RN-17). Los hooks recorren estas listas.
export const TAX_PROFILE_INVALIDATIONS = {
  submit: [taxProfileKeys.profile, taxProfileKeys.versions, taxProfileKeys.onboardingAll],
  // La ficha trae `activeEstablishments`, por eso también se invalida.
  createEstablishment: [taxProfileKeys.establishments, taxProfileKeys.profile],
  closeEstablishment: [taxProfileKeys.establishments, taxProfileKeys.profile],
  // La ficha trae `formalizationCommitment` y la vista TAX_PROFILE trae `manifestation`.
  approveContract: [
    taxProfileKeys.profile,
    taxProfileKeys.declarationsAll,
    taxProfileKeys.onboardingAll,
  ],
} as const;
