'use client';

import React, { useEffect } from 'react';
import { X, Play } from 'lucide-react';
import type { BrandingGame } from '@/services/BrandingRequestService';

const getGameIframeUrl = (game: BrandingGame): string => {
  if (game.url.startsWith('http')) return game.url;
  const match = game.frontPageUrl.match(/^(https?:\/\/[^/]+\/[^/]+\/)/);
  return match ? `${match[1]}${game.url}` : game.url;
};

interface Props {
  game: BrandingGame;
  onClose: () => void;
}

export const GamePreviewModal: React.FC<Props> = ({ game, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Play size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{game.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            src={getGameIframeUrl(game)}
            title={game.title}
            className="w-full h-full min-h-[400px] rounded-b-xl border-0"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
};
