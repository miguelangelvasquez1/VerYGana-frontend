'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { OnboardingService } from '@/services/commercial/OnboardingService';
import { DeclarationService } from '@/services/commercial/DeclarationService';
import { TaxProfileService } from '@/services/commercial/TaxProfileService';
import type { DeclarationCode, DisclosureContext } from '@/types/commercial/Declaration.types';
import type {
  CloseEstablishmentRequest,
  EstablishmentRequest,
  TaxProfileSubmitRequest,
} from '@/types/commercial/TaxProfile.types';
import { retryUnlessForbiddenOrMissing } from './retryPolicy';
import { TAX_PROFILE_INVALIDATIONS, declarationCachePolicy, taxProfileKeys } from './taxProfileKeys';

export function useTaxProfile() {
  return useQuery({
    queryKey: taxProfileKeys.profile,
    queryFn: () => TaxProfileService.getTaxProfile(),
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useTaxProfileVersions({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: taxProfileKeys.versions,
    queryFn: () => TaxProfileService.listTaxProfileVersions(),
    enabled,
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useTaxProfileVersion(versionNumber: number | null) {
  return useQuery({
    queryKey: taxProfileKeys.version(versionNumber ?? 0),
    queryFn: () => TaxProfileService.getTaxProfileVersion(versionNumber as number),
    enabled: versionNumber !== null,
    // Una versión ya enviada no cambia.
    staleTime: Infinity,
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useTaxCatalog() {
  return useQuery({
    queryKey: taxProfileKeys.catalog,
    queryFn: () => TaxProfileService.getTaxCatalog(),
    staleTime: 10 * 60 * 1000,
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useEstablishments() {
  return useQuery({
    queryKey: taxProfileKeys.establishments,
    queryFn: () => TaxProfileService.listEstablishments(),
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Documentos del asistente de registro, para elegir el RUT. `staleTime: 0`: el paso de
// Documentos no usa Query, así que el RUT pudo subirse un momento antes.
export function useOnboardingDocuments() {
  return useQuery({
    queryKey: taxProfileKeys.onboardingDocuments,
    queryFn: () => OnboardingService.getDocuments(),
    staleTime: 0,
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Pide el texto solo con el diálogo abierto (`enabled`): la API registra cada lectura.
// En TAX_PROFILE, 30 minutos de caché (D-7); en CONTRACT_SHEET, nunca caché (RN-10 de la 015).
export function useDeclaration(
  code: DeclarationCode,
  context: DisclosureContext,
  { enabled }: { enabled: boolean },
) {
  return useQuery({
    queryKey: taxProfileKeys.declaration(code, context),
    queryFn: () => DeclarationService.getDeclaration(code, context),
    enabled,
    retry: retryUnlessForbiddenOrMissing,
    ...declarationCachePolicy(context),
  });
}

export function useSubmitTaxProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TaxProfileSubmitRequest) => TaxProfileService.submitTaxProfile(body),
    onSuccess: async (response) => {
      queryClient.setQueryData(taxProfileKeys.profile, response);
      await Promise.all(
        TAX_PROFILE_INVALIDATIONS.submit.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}

export function useCreateEstablishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EstablishmentRequest) => TaxProfileService.createEstablishment(body),
    onSuccess: async () => {
      await Promise.all(
        TAX_PROFILE_INVALIDATIONS.createEstablishment.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}

export function useCloseEstablishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CloseEstablishmentRequest }) =>
      TaxProfileService.closeEstablishment(id, body),
    onSuccess: async () => {
      await Promise.all(
        TAX_PROFILE_INVALIDATIONS.closeEstablishment.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
