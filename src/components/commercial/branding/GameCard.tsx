'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, ImageOff } from 'lucide-react';
import type { BrandingGame } from '@/services/BrandingRequestService';

interface Props {
  game: BrandingGame;
  onPreview: () => void;
  onSelect: () => void;
}

export const GameCard: React.FC<Props> = ({ game, onPreview, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [descHeight, setDescHeight] = useState(0);

  useEffect(() => {
    if (descRef.current) {
      setDescHeight(descRef.current.scrollHeight);
    }
  }, [game.description]);

  return (
    <div
      className="group relative h-[350px] overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-gray-100 border border-gray-100"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagen: ocupa todo el card como fondo */}
      <div className="absolute inset-0 cursor-pointer" onClick={onPreview}>
        {!imgError ? (
          <img
            src={game.frontPageUrl}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-purple-100">
            <ImageOff size={32} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Panel de contenido: anclado abajo, crece hacia arriba al expandirse la descripción */}
      <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-4 flex flex-col gap-3 rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.10)]">
        <h3 className="text-base font-bold text-gray-900 line-clamp-1">{game.title}</h3>

        {/* max-height anima desde 1 línea hasta la altura real del texto */}
        <div
          className="overflow-hidden"
          style={{
            maxHeight: hovered ? `${descHeight}px` : '1.25rem',
            transition: 'max-height 200ms ease-in-out',
          }}
        >
          <p ref={descRef} className="text-sm text-gray-600 leading-5">
            {game.description}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer bg-white"
          >
            <Play size={14} />
            Ver
          </button>
          <button
            onClick={onSelect}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm cursor-pointer"
          >
            Seleccionar
          </button>
        </div>
      </div>
    </div>
  );
};
