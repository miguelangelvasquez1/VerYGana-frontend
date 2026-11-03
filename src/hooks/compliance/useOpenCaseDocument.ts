'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

import { documentsFromRefetch, openExpedienteDocument } from '@/lib/expediente/openDocument';
import { EXPEDIENTE_TEXTS } from '@/lib/labels/expedienteRequests';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';

// Lo que se usa de la consulta de documentos (`useCaseDocuments`).
interface DocumentsQueryLike {
  data: ExpedienteDocument[] | undefined;
  dataUpdatedAt: number;
  refetch: () => Promise<{
    data: ExpedienteDocument[] | undefined;
    isError: boolean;
    status: string;
    error?: unknown;
  }>;
}

// "Ver": la URL firmada vive solo en la caché de Query y no se lee fuera de `openDocument.ts` (P-16).
// `refetch()` de TanStack no rechaza si falla: pasa por `documentsFromRefetch` (aprendizaje de la 016).
export function useOpenCaseDocument(query: DocumentsQueryLike) {
  const [openingId, setOpeningId] = useState<number | null>(null);

  const open = useCallback(
    async (documentId: number) => {
      if (openingId !== null) return;
      setOpeningId(documentId);
      try {
        const result = await openExpedienteDocument({
          documentId,
          documents: query.data ?? [],
          fetchedAt: query.dataUpdatedAt,
          now: Date.now(),
          refetch: async () => documentsFromRefetch(await query.refetch()),
          openWindow: (url) =>
            url ? window.open(url, '_blank', 'noopener,noreferrer') : window.open('', '_blank'),
        });
        if (result === 'failed') toast.error(EXPEDIENTE_TEXTS.openFailed);
      } finally {
        setOpeningId(null);
      }
    },
    [openingId, query],
  );

  return { open, openingId };
}
