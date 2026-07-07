'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import type { BrandingComment } from '@/services/BrandingRequestService';

const CYCLE_LABEL: Partial<Record<string, string>> = {
  APPROVED: 'Inicio del proceso',
  DESIGN_IN_PROGRESS: 'Diseño en progreso',
  CHANGES_REQUESTED: 'Cambios solicitados',
  PENDING_ADVERTISER_APPROVAL: 'Pendiente de revisión',
  LAUNCHED: 'Campaña activa',
};

const MAX_LENGTH = 2000;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return (
    date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) +
    ' · ' +
    date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  );
}

interface Props {
  comments: BrandingComment[];
  loading: boolean;
  sending: boolean;
  currentUserRole: 'COMMERCIAL' | 'DESIGNER';
  onSend: (content: string) => Promise<void>;
}

export const CommentThread: React.FC<Props> = ({
  comments,
  loading,
  sending,
  currentUserRole,
  onSend,
}) => {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    await onSend(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Sin comentarios aún</p>
            <p className="text-xs text-gray-300 mt-1">Empieza la conversación</p>
          </div>
        ) : (
          <>
            {comments.map((comment, i) => {
              const isMe = comment.authorRole === currentUserRole;
              const prevStatus = i > 0 ? comments[i - 1].relatedStatus : null;
              const showSeparator = i === 0 || comment.relatedStatus !== prevStatus;

              return (
                <React.Fragment key={comment.id}>
                  {showSeparator && (
                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2">
                        {CYCLE_LABEL[comment.relatedStatus] ?? comment.relatedStatus}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%]">
                      {!isMe && (
                        <p className="text-[11px] text-gray-500 mb-1 ml-1 font-medium">
                          {comment.authorName}
                        </p>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-violet-600 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                      </div>
                      <p
                        className={`text-[10px] text-gray-400 mt-1 mx-1 ${
                          isMe ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 placeholder-gray-400"
            />
            {text.length > MAX_LENGTH * 0.8 && (
              <span className="absolute bottom-2 right-2 text-[10px] text-gray-400 pointer-events-none">
                {text.length}/{MAX_LENGTH}
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end cursor-pointer"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};
