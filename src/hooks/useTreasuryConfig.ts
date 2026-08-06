'use client';

import { useQuery } from '@tanstack/react-query';
import { getKeysReservePct } from '@/services/TreasuryService';

export const treasuryConfigKeys = {
  keysReservePct: ['treasuryConfig', 'keysReservePct'] as const,
};

// Porcentaje de reserva de llaves configurado en tesorería — cambia poco,
// por eso se cachea varios minutos en vez de refrescarse en cada render.
export function useKeysReservePct() {
  return useQuery({
    queryKey: treasuryConfigKeys.keysReservePct,
    queryFn: () => getKeysReservePct(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
