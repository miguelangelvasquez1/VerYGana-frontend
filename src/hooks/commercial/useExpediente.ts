'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type ExpedienteUploadDeps,
  type ExpedienteUploadInput,
  runExpedienteUpload,
  shouldRefetchExpedienteAfterError,
} from '@/lib/expediente/uploadFlow';
import { ExpedienteService } from '@/services/commercial/ExpedienteService';
import { EXPEDIENTE_INVALIDATIONS, expedienteKeys } from './expedienteKeys';
import { retryUnlessForbiddenOrMissing } from './retryPolicy';

// Una sola consulta compartida: la pantalla, el diálogo del ítem, el detalle y la ficha.
export function useExpediente() {
  return useQuery({
    queryKey: expedienteKeys.list,
    queryFn: () => ExpedienteService.list(),
    retry: retryUnlessForbiddenOrMissing,
  });
}

const UPLOAD_DEPS: ExpedienteUploadDeps = {
  prepare: (body) => ExpedienteService.prepareUpload(body),
  put: (url, file) => ExpedienteService.uploadFile(url, file),
  confirm: (documentId) => ExpedienteService.confirmUpload(documentId),
};

// Carga en tres pasos (RN-4). Devuelve el documento confirmado.
export function useExpedienteUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpedienteUploadInput) => runExpedienteUpload(input, UPLOAD_DEPS),
    // Se espera a que la lista se vuelva a pedir para que el diálogo cierre con datos al día.
    onSuccess: () =>
      Promise.all(
        EXPEDIENTE_INVALIDATIONS.confirmUpload.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
    onError: (err) => {
      if (!shouldRefetchExpedienteAfterError(err)) return;
      for (const queryKey of EXPEDIENTE_INVALIDATIONS.uploadRejected) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
