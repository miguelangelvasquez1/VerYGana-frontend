'use client';

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelPlanChangeRequest,
  getCurrentPlanChangeRequest,
} from '@/services/planChangeService';
import { PlanChangeRequestResponseDTO } from '@/types/finance/plans/PlanChange.types';
import { isActivePlanChangeRequest } from '@/components/commercial/planChange/planChange.shared';

// Fuente compartida de "¿el comercial tiene una solicitud de cambio de plan
// en curso?". Mientras haya una abierta el backend bloquea crear/activar
// activos (anuncios, productos, encuestas, juegos brandeados). Se cachea con
// react-query; invalidar con `useInvalidatePlanChangeRequest` al crear una
// solicitud, al cancelarla y al aplicarse un cambio de plan.
export const planChangeRequestKeys = {
  current: ['plan-change-request', 'current'] as const,
};

interface UsePlanChangeRequestResult {
  /** La solicitud que devuelve GET /plans/change-request/current (o null). */
  request: PlanChangeRequestResponseDTO | null;
  /**
   * La misma solicitud, pero solo cuando está ABIERTA (bloquea la creación
   * de activos). Un REJECTED pendiente de "dar por leído" no bloquea, así
   * que aquí es null.
   */
  blockingRequest: PlanChangeRequestResponseDTO | null;
  isBlocking: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function usePlanChangeRequest(): UsePlanChangeRequestResult {
  const query = useQuery({
    queryKey: planChangeRequestKeys.current,
    queryFn: getCurrentPlanChangeRequest,
    staleTime: 30 * 1000,
  });

  const request = query.data ?? null;
  const blockingRequest = isActivePlanChangeRequest(request) ? request : null;

  return {
    request,
    blockingRequest,
    isBlocking: blockingRequest != null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

// Devuelve una función para invalidar la solicitud cacheada. Llamarla tras
// crear/cancelar una solicitud o al aplicarse un cambio de plan, para que
// los CTA de creación de activos se re-habiliten/deshabiliten solos.
export function useInvalidatePlanChangeRequest() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: planChangeRequestKeys.current }),
    [queryClient],
  );
}

// Estados en los que el backend permite cancelar la solicitud (POST
// /plans/change-request/{id}/cancel). Cancelarla desbloquea la creación de
// activos de inmediato.
export function canCancelPlanChangeRequest(
  request: PlanChangeRequestResponseDTO | null | undefined,
): boolean {
  return request?.status === 'REQUESTED' || request?.status === 'CONTRACT_PENDING_REVIEW';
}

export function useCancelPlanChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelPlanChangeRequest(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(planChangeRequestKeys.current, updated);
      queryClient.invalidateQueries({ queryKey: planChangeRequestKeys.current });
    },
  });
}
