'use client';

import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type ApprovalAttempt, nextApprovalAttempt } from '@/lib/formalization/contractApproval';
import { OnboardingService } from '@/services/commercial/OnboardingService';
import type { ContractApproveRequest } from '@/types/commercial/Declaration.types';
import { newIdempotencyKey } from '@/utils/recognitions';
import { TAX_PROFILE_INVALIDATIONS, isContractSheetDeclarationKey, taxProfileKeys } from './taxProfileKeys';

// Aprobación del contrato con cuerpo e `Idempotency-Key` (spec 015, RN-8).
// La clave vive solo en un ref: no va a la URL, al almacenamiento ni a ningún log.
export function useApproveContract() {
  const queryClient = useQueryClient();
  const attemptRef = useRef<ApprovalAttempt | null>(null);

  const mutation = useMutation({
    mutationFn: ({ body, key }: { body: ContractApproveRequest; key: string }) =>
      OnboardingService.approveContract(body, key),
    onSuccess: async () => {
      const { approveContract } = TAX_PROFILE_INVALIDATIONS;
      // Las de contexto CONTRACT_SHEET se marcan sin releerlas (RN-10): sin red.
      void queryClient.invalidateQueries({
        queryKey: taxProfileKeys.declarationsAll,
        predicate: (q) => isContractSheetDeclarationKey(q.queryKey),
        refetchType: 'none',
      });
      // El avance solo espera la ficha y el onboarding (RN-9); las demás declaraciones
      // se releen en segundo plano si están activas.
      void queryClient.invalidateQueries({
        queryKey: taxProfileKeys.declarationsAll,
        predicate: (q) => !isContractSheetDeclarationKey(q.queryKey),
      });
      await Promise.all(
        approveContract
          .filter((queryKey) => queryKey !== taxProfileKeys.declarationsAll)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });

  const approve = async (body: ContractApproveRequest) => {
    attemptRef.current = nextApprovalAttempt(attemptRef.current, body, newIdempotencyKey);
    const result = await mutation.mutateAsync({ body, key: attemptRef.current.key });
    // Tras un 200 la clave se descarta; si falla, se conserva para el reintento.
    attemptRef.current = null;
    return result;
  };

  return { approve, isPending: mutation.isPending };
}
