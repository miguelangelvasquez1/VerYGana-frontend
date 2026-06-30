'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getDesignerComments,
  postDesignerComment,
} from '@/services/GameDesignerService';
import type { BrandingComment } from '@/services/BrandingRequestService';
import { CommentThread } from '@/components/shared/CommentThread';

interface Props {
  requestId: number;
}

export const CommentsTab: React.FC<Props> = ({ requestId }) => {
  const [comments, setComments] = useState<BrandingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getDesignerComments(requestId, ctrl.signal)
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
      const newComment = await postDesignerComment(requestId, content);
      setComments(prev => [...prev, newComment]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar el comentario');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[500px] flex flex-col">
      <CommentThread
        comments={comments}
        loading={loading}
        sending={sending}
        currentUserRole="DESIGNER"
        onSend={handleSend}
      />
    </div>
  );
};

export default CommentsTab;
