'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  getPetComments,
  postPetComment,
  PET_COMMENT_MAX_LENGTH,
  type PetComment,
  type PetCommentRole,
} from '@/services/PetRequestService';
import { CommentThread } from './CommentThread';
import { apiErrorMessage } from '@/hooks/pets/usePetImageUpload';

/** Etiquetas del ciclo de la solicitud, para los separadores del hilo. */
const PET_STATUS_LABEL: Partial<Record<string, string>> = {
  PENDING: 'Solicitud enviada',
  IN_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  ITEM_IN_PROGRESS: 'En diseño',
  COMPLETED: 'Publicada',
  REJECTED: 'Rechazada',
};

/**
 * Hilo de conversación de una solicitud de mascota. El contrato es el mismo
 * para los tres roles; `role` solo decide el prefijo de la ruta y de qué lado
 * se alinean las burbujas propias.
 *
 * Sin realtime: se recarga al abrir y después de enviar, que es suficiente.
 */
export function PetCommentsPanel({
  role,
  requestId,
  accent = 'violet',
  className = '',
}: {
  role: PetCommentRole;
  requestId: number;
  accent?: 'violet' | 'blue';
  className?: string;
}) {
  const [comments, setComments] = useState<PetComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      return getPetComments(role, requestId, signal)
        .then(setComments)
        .catch((err: unknown) => {
          const canceled =
            (err as { name?: string })?.name === 'CanceledError' ||
            (err as { code?: string })?.code === 'ERR_CANCELED';
          if (canceled) return;
          // El 404 es deliberado: el backend no confirma si una solicitud ajena
          // existe. Se muestra como "no encontrada", nunca como falta de permisos.
          const status = (err as { response?: { status?: number } })?.response?.status;
          setError(
            status === 404
              ? 'No encontramos esta conversación.'
              : apiErrorMessage(err, 'No se pudieron cargar los mensajes.'),
          );
        })
        .finally(() => setLoading(false));
    },
    [role, requestId],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const handleSend = async (content: string) => {
    setSending(true);
    setError('');
    try {
      const created = await postPetComment(role, requestId, content.slice(0, PET_COMMENT_MAX_LENGTH));
      setComments(prev => [...prev, created]);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'No se pudo enviar el mensaje.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white ${className}`}>
      <header className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-bold text-gray-800">Conversación</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Comercio, diseño y administración ven este mismo hilo.
        </p>
      </header>

      {error && (
        <p className="flex items-start gap-1.5 border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs font-medium text-red-600">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <CommentThread
        comments={comments}
        loading={loading}
        sending={sending}
        currentUserRole={role}
        statusLabels={PET_STATUS_LABEL}
        accent={accent}
        placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
        onSend={handleSend}
      />
    </div>
  );
}
