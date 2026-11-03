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
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado fijo arriba: el botón de cerrar se ve siempre aunque el contenido haga scroll (RN-5) */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl bg-white px-5 py-3 border-b shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            <Play size={18} className="text-blue-600" />
            <h3 title={game.title} className="font-semibold text-gray-900 truncate">{game.title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="tap-icon shrink-0 -mr-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors lg:mr-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-[400px]">
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
