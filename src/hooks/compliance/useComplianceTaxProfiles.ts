'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { retryUnlessForbiddenOrMissing } from '@/hooks/commercial/retryPolicy';
import { isUuid } from '@/lib/informationRequests/requests';
import { queueApiParams, type QueueState } from '@/lib/compliance/routes';
import { versionChangedDuringReview } from '@/lib/compliance/taxProfileReview';
import { ComplianceTaxProfileService } from '@/services/compliance/ComplianceTaxProfileService';
import type {
  CatalogEntry,
  CatalogEntryRequest,
  ComplianceTaxProfileResponse,
  RetireCatalogEntryRequest,
  SectionReviewRequest,
  TaxProfileSection,
} from '@/types/commercial/TaxProfile.types';
import {
  COMPLIANCE_INVALIDATIONS,
  complianceTaxCatalogKeys,
  complianceTaxProfileKeys,
} from './complianceKeys';

// Cola de fichas. Sin `placeholderData`: al cambiar el filtro se ve el esqueleto, nunca filas de otro estado.
export function useTaxProfileQueue(state: QueueState) {
  return useQuery({
    queryKey: complianceTaxProfileKeys.queue(state.status, state.page),
    queryFn: () => ComplianceTaxProfileService.list(queueApiParams(state)),
    retry: retryUnlessForbiddenOrMissing,
  });
}

// La comparten la revisión, la cabecera del caso y la pestaña Ficha. Un id que no es UUID no se pide.
export function useComplianceTaxProfile(commercialPublicId: string) {
  return useQuery({
    queryKey: complianceTaxProfileKeys.detail(commercialPublicId),
    queryFn: () => ComplianceTaxProfileService.get(commercialPublicId),
    enabled: isUuid(commercialPublicId),
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Una versión enviada no cambia: no caduca.
export function useComplianceTaxProfileVersion(commercialPublicId: string, versionNumber: number | null) {
  return useQuery({
    queryKey: complianceTaxProfileKeys.version(commercialPublicId, versionNumber ?? 0),
    queryFn: () => ComplianceTaxProfileService.getVersion(commercialPublicId, versionNumber as number),
    enabled: isUuid(commercialPublicId) && versionNumber !== null,
    staleTime: Infinity,
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Activos y retirados. Nunca bloquea la pantalla: sin datos, los códigos se ven solos (RN-12, CA-29).
export function useComplianceTaxCatalog(enabled = true) {
  return useQuery({
    queryKey: complianceTaxCatalogKeys.all,
    queryFn: () => ComplianceTaxProfileService.getCatalog(),
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Crear y retirar invalidan el catálogo de compliance, que es también el que lee la ficha (017).
export function useCreateCatalogEntry() {
  const queryClient = useQueryClient();
  return useMutation<CatalogEntry, unknown, CatalogEntryRequest>({
    mutationFn: (body) => ComplianceTaxProfileService.createCatalogEntry(body),
    onSuccess: () =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.catalogChanged.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

export interface RetireCatalogEntryVariables {
  id: number;
  body: RetireCatalogEntryRequest;
}

export function useRetireCatalogEntry() {
  const queryClient = useQueryClient();
  return useMutation<CatalogEntry, unknown, RetireCatalogEntryVariables>({
    mutationFn: ({ id, body }) => ComplianceTaxProfileService.retireCatalogEntry(id, body),
    onSuccess: () =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.catalogChanged.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

export interface ReviewSectionVariables {
  section: TaxProfileSection;
  body: SectionReviewRequest;
  // Versión vigente que se veía al abrir el diálogo; no viaja a la API.
  shownVersion: number;
}

export function useReviewTaxProfileSection(commercialPublicId: string) {
  const queryClient = useQueryClient();
  return useMutation<ComplianceTaxProfileResponse, unknown, ReviewSectionVariables>({
    mutationFn: ({ section, body }) =>
      ComplianceTaxProfileService.reviewSection(commercialPublicId, section, body),
    onSuccess: async (response, variables) => {
      // La respuesta ya trae la ficha; la pantalla pasa a la versión que ella indica (RN-13).
      queryClient.setQueryData(complianceTaxProfileKeys.detail(commercialPublicId), response);
      const keys: (readonly unknown[])[] = [...COMPLIANCE_INVALIDATIONS.reviewSection];
      if (versionChangedDuringReview(variables.shownVersion, response)) {
        keys.push(...COMPLIANCE_INVALIDATIONS.versionChanged(commercialPublicId));
      }
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}
