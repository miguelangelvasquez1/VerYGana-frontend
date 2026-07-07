'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBrandingGames, type BrandingGame } from '@/services/BrandingRequestService';
import { GameCard } from './GameCard';
import { GamePreviewModal } from './GamePreviewModal';

const GAMES_PER_PAGE = 12;

interface Props {
  onBack: () => void;
  onSelect: (game: BrandingGame) => void;
}

export const GameCatalog: React.FC<Props> = ({ onBack, onSelect }) => {
  const [games, setGames] = useState<BrandingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [previewGame, setPreviewGame] = useState<BrandingGame | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getBrandingGames(page, GAMES_PER_PAGE, controller.signal);
        setGames(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      } catch (err: any) {
        if (err?.name !== 'CanceledError') setError('No se pudo cargar el catálogo de juegos');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Selecciona un juego</h2>
          <p className="text-sm text-gray-500">
            Elige el juego donde integrarás tu marca
            {totalElements > 0 && ` · ${totalElements} disponibles`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-3">{error}</p>
          <button
            onClick={() => setPage(0)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : games.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">No hay juegos disponibles para branding en este momento.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onPreview={() => setPreviewGame(game)}
                onSelect={() => onSelect(game)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 px-2">
                Página {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {previewGame && (
        <GamePreviewModal game={previewGame} onClose={() => setPreviewGame(null)} />
      )}
    </div>
  );
};
