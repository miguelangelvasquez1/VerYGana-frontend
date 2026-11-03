'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { countAwaitingResponse, isUuid } from '@/lib/informationRequests/requests';
import { respondErrorOutcome } from '@/lib/informationRequests/respond';
import { InformationRequestService } from '@/services/commercial/InformationRequestService';
import type { RespondRequest } from '@/types/compliance/InformationRequest.types';
import { informationRequestInvalidations, informationRequestKeys } from './informationRequestKeys';
import { retryUnlessForbiddenOrMissing } from './retryPolicy';

export function useInformationRequests() {
  return useQuery({
    queryKey: informationRequestKeys.list,
    queryFn: () => InformationRequestService.listMine(),
    retry: retryUnlessForbiddenOrMissing,
  });
}

// La misma consulta de la lista: las insignias solo se vuelven a pintar si cambia el número.
export function usePendingInformationRequestsCount() {
  return useQuery({
    queryKey: informationRequestKeys.list,
    queryFn: () => InformationRequestService.listMine(),
    retry: retryUnlessForbiddenOrMissing,
    select: countAwaitingResponse,
  });
}

// CA-17: con un valor que no es UUID no se llama a la API (daría 500).
export function useInformationRequest(publicId: string) {
  return useQuery({
    queryKey: informationRequestKeys.detail(publicId),
    queryFn: () => InformationRequestService.getMine(publicId),
    enabled: isUuid(publicId),
    retry: retryUnlessForbiddenOrMissing,
  });
}

export function useRespondInformationRequest(publicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RespondRequest) => InformationRequestService.respond(publicId, body),
    onSuccess: (view) => {
      queryClient.setQueryData(informationRequestKeys.detail(publicId), view);
      for (const queryKey of informationRequestInvalidations.respond(publicId)) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (err) => {
      if (!respondErrorOutcome(err).refetch) return;
      for (const queryKey of informationRequestInvalidations.respondRejected(publicId)) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
