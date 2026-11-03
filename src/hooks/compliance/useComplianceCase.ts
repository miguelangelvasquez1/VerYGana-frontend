'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { retryUnlessForbiddenOrMissing } from '@/hooks/commercial/retryPolicy';
import { documentReviewErrorOutcome } from '@/lib/compliance/documentReview';
import { isUuid } from '@/lib/informationRequests/requests';
import { ComplianceCaseService } from '@/services/compliance/ComplianceCaseService';
import type { DocumentReviewRequest, ExpedienteDocument } from '@/types/commercial/Expediente.types';
import type {
  Finding,
  FindingRequest,
  Incident,
  IncidentRequest,
} from '@/types/compliance/InformationRequest.types';
import { COMPLIANCE_INVALIDATIONS, complianceCaseKeys } from './complianceKeys';

// Cada pestaña llama a su hook dentro de su propio panel: las lecturas son perezosas e independientes.

// La comparten la pestaña Documentos y "Ver RUT" (que la habilita solo si hay `rutDocumentId`).
export function useCaseDocuments(commercialPublicId: string, enabled = true) {
  return useQuery({
    queryKey: complianceCaseKeys.documents(commercialPublicId),
    queryFn: () => ComplianceCaseService.listDocuments(commercialPublicId),
    enabled: isUuid(commercialPublicId) && enabled,
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useCaseCommitment(commercialPublicId: string) {
  return useQuery({
    queryKey: complianceCaseKeys.commitment(commercialPublicId),
    queryFn: () => ComplianceCaseService.listCommitment(commercialPublicId),
    enabled: isUuid(commercialPublicId),
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Página base 0 (la que va a la API). Al paginar se conserva la anterior para que no parpadee.
export function useCaseRequests(commercialPublicId: string, page: number) {
  return useQuery({
    queryKey: complianceCaseKeys.requests(commercialPublicId, page),
    queryFn: () => ComplianceCaseService.listRequests(commercialPublicId, page),
    enabled: isUuid(commercialPublicId),
    placeholderData: keepPreviousData,
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useCaseFindings(commercialPublicId: string) {
  return useQuery({
    queryKey: complianceCaseKeys.findings(commercialPublicId),
    queryFn: () => ComplianceCaseService.listFindings(commercialPublicId),
    enabled: isUuid(commercialPublicId),
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useCaseIncidents(commercialPublicId: string) {
  return useQuery({
    queryKey: complianceCaseKeys.incidents(commercialPublicId),
    queryFn: () => ComplianceCaseService.listIncidents(commercialPublicId),
    enabled: isUuid(commercialPublicId),
    retry: retryUnlessForbiddenOrMissing,
  });
}

// Con requerimiento, la API lo cierra con el hallazgo: se relee su detalle, la cola y la pestaña (RN-11).
export function useCreateFinding(commercialPublicId: string) {
  const queryClient = useQueryClient();
  return useMutation<Finding, unknown, FindingRequest>({
    mutationFn: (body) => ComplianceCaseService.createFinding(body),
    onSuccess: (_finding, body) =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.findingCreated(commercialPublicId, body.requestPublicId).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

export function useCreateIncident(commercialPublicId: string) {
  const queryClient = useQueryClient();
  return useMutation<Incident, unknown, IncidentRequest>({
    mutationFn: (body) => ComplianceCaseService.createIncident(body),
    onSuccess: () =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.incidentCreated(commercialPublicId).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

export interface ReviewCaseDocumentVariables {
  documentId: number;
  body: DocumentReviewRequest;
}

export function useReviewCaseDocument(commercialPublicId: string) {
  const queryClient = useQueryClient();
  return useMutation<ExpedienteDocument, unknown, ReviewCaseDocumentVariables>({
    mutationFn: ({ documentId, body }) => ComplianceCaseService.reviewDocument(documentId, body),
    // No se parchea la lista con `setQueryData` (R-2): renovaría `dataUpdatedAt` y "Ver" creería frescas
    // las URL de los demás documentos. Se espera la relectura para que el diálogo cierre con datos al día.
    onSuccess: () =>
      Promise.all(
        COMPLIANCE_INVALIDATIONS.reviewDocument(commercialPublicId).map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
    onError: (error) => {
      if (!documentReviewErrorOutcome(error).refetch) return;
      for (const queryKey of COMPLIANCE_INVALIDATIONS.reviewDocumentRejected(commercialPublicId)) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
