// components/campaigns/GameSelection.tsx
'use client';

import React from 'react';
import { Loader2, Gamepad2 } from 'lucide-react';
import { Game } from '@/types/games/campaigns';

interface GameSelectionProps {
  games: Game[];
  loading: boolean;
  error?: string | null;
  onSelect: (game: Game) => void;
}

export function GameSelection({ games, loading, error, onSelect }: GameSelectionProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Cargando juegos disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">Error cargando juegos</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <Gamepad2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No hay juegos disponibles en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Selecciona el juego para tu campaña
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Elige el minijuego que mejor se adapte a tu estrategia publicitaria
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game)}
            className="group text-left bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all overflow-hidden"
          >
            {/* Portada */}
            {game.frontPageUrl ? (
              <div className="w-full h-40 overflow-hidden bg-gray-100">
                <img
                  src={game.frontPageUrl}
                  alt={`Portada de ${game.title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <Gamepad2 className="w-16 h-16 text-white opacity-50" />
              </div>
            )}

            {/* Contenido */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {game.title}
              </h4>
              {game.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {game.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}