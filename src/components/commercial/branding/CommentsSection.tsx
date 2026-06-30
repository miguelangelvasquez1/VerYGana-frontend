'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getCommercialComments,
  postCommercialComment,
  type BrandingComment,
} from '@/services/BrandingRequestService';
import { CommentThread } from '@/components/shared/CommentThread';

interface Props {
  requestId: number;
}

export const CommentsSection: React.FC<Props> = ({ requestId }) => {
  const [comments, setComments] = useState<BrandingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getCommercialComments(requestId, ctrl.signal)
      .then(setComments)
      .catch(err => {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          toast.error('No se pudieron cargar los comentarios');
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [requestId]);

  const handleSend = async (content: string) => {
    setSending(true);
    try {
      const newComment = await postCommercialComment(requestId, content);
      setComments(prev => [...prev, newComment]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar el comentario');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Comentarios con el diseñador
        </h3>
      </div>
      <div className="h-[480px] flex flex-col">
        <CommentThread
          comments={comments}
          loading={loading}
          sending={sending}
          currentUserRole="COMMERCIAL"
          onSend={handleSend}
        />
      </div>
    </div>
  );
};
