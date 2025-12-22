// components/campaigns/GameSelection.tsx
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Game } from '@/types/campaigns';

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
        <p className="text-gray-600">No hay juegos disponibles en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Selecciona el juego para tu campaña
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game)}
            className="group text-left p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {game.title}
            </h4>
            <p className="text-sm text-gray-600">{game.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}