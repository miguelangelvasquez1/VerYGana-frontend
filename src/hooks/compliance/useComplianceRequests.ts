'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { retryUnlessForbiddenOrMissing } from '@/hooks/commercial/retryPolicy';
import { requestQueueApiParams, type RequestQueueState } from '@/lib/compliance/routes';
import { isUuid } from '@/lib/informationRequests/requests';
import { ComplianceRequestService } from '@/services/compliance/ComplianceRequestService';
import type {
  CancelInformationRequest,
  CreateInformationRequest,
  InformationRequest,
  ReviewInformationRequest,
} from '@/types/compliance/InformationRequest.types';
import { COMPLIANCE_INVALIDATIONS, complianceRequestKeys } from './complianceKeys';

// Cola de requerimientos. Sin `placeholderData`: al cambiar el filtro se ve el esqueleto, nunca filas de otro estado.
export function useRequestQueue(state: RequestQueueState) {
  return useQuery({
    queryKey: complianceRequestKeys.queue(state.status, state.page),
    queryFn: () => ComplianceRequestService.search(requestQueueApiParams(state)),
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Un id que no es UUID no se pide (la API respondería 500).
export function useComplianceRequest(requestPublicId: string) {
  return useQuery({
    queryKey: complianceRequestKeys.detail(requestPublicId),
    queryFn: () => ComplianceRequestService.get(requestPublicId),
    enabled: isUuid(requestPublicId),
    retry: retryUnlessForbiddenOrMissing,
  });
}

async function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
  keys: readonly (readonly unknown[])[],
): Promise<void> {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation<InformationRequest, unknown, CreateInformationRequest>({
    mutationFn: (body) => ComplianceRequestService.create(body),
    onSuccess: async (response, body) => {
      queryClient.setQueryData(complianceRequestKeys.detail(response.publicId), response);
      await invalidateAll(
        queryClient,
        COMPLIANCE_INVALIDATIONS.requestCreated(body.commercialPublicId, body.alertId != null),
      );
    },
  });
}

export function useReviewRequest(requestPublicId: string) {
  const queryClient = useQueryClient();
  return useMutation<InformationRequest, unknown, ReviewInformationRequest>({
    mutationFn: (body) => ComplianceRequestService.review(requestPublicId, body),
    onSuccess: async (response) => {
      queryClient.setQueryData(complianceRequestKeys.detail(requestPublicId), response);
      await invalidateAll(queryClient, COMPLIANCE_INVALIDATIONS.requestReviewed(response.commercialPublicId));
    },
  });
}

export function useCancelRequest(requestPublicId: string) {
  const queryClient = useQueryClient();
  return useMutation<InformationRequest, unknown, CancelInformationRequest>({
    mutationFn: (body) => ComplianceRequestService.cancel(requestPublicId, body),
    onSuccess: async (response) => {
      queryClient.setQueryData(complianceRequestKeys.detail(requestPublicId), response);
      await invalidateAll(queryClient, COMPLIANCE_INVALIDATIONS.requestReviewed(response.commercialPublicId));
    },
  });
}
