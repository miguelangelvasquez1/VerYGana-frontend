'use client';

import React, { useEffect, useState } from 'react';
import { Star, Gamepad2, Zap, Sparkles } from 'lucide-react';
import GameSection from '@/components/consumer/games/GameSection';
import { GameCardResponseDTO } from '@/types/games/game.types';
import { getAvailableGamesPage, init } from '@/services/GameService';
import { useRouter } from 'next/navigation';

const GamesPanelPage = () => {
  const router = useRouter();
  const [sponsoredGames, setSponsoredGames] = useState<GameCardResponseDTO[]>([]);
  const [freeGames, setFreeGames] = useState<GameCardResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const page = await getAvailableGamesPage(0, 20);
        setSponsoredGames(page.data.filter((g: { sponsored: any }) => g.sponsored));
        setFreeGames(page.data.filter((g: { sponsored: any }) => !g.sponsored));
      } catch (error) {
        console.error('Error loading games', error);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  const handleSponsoredPlay = async () => {
    if (!sponsoredGames.length) return;
    const response = await init({ gameId: sponsoredGames[0].id, sponsored: true });
    router.push(`/games/play?url=${encodeURIComponent(response.url)}`);
  };

  const handlePlay = async (game: GameCardResponseDTO) => {
    if (!freeGames.length) return;
    const response = await init({ gameId: game.id, sponsored: true });
    router.push(`/games/play?url=${encodeURIComponent(response.url)}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold">Cargando juegos...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-24 lg:pb-0">

      {/* HERO */}
      <section className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #2d0060 0%, #5b21b6 50%, #7c3aed 100%)' }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-purple-400/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            Juega, compite y gana premios reales
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
            Juega y Gana
          </h1>
          <p className="text-purple-100 text-base lg:text-lg mb-0 max-w-lg mx-auto">
            Convierte cada partida en ganancias reales.
          </p>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sponsored Games */}
        <div className="mt-8 mb-8 rounded-2xl border border-dashed border-yellow-200 p-6 bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <h2 className="text-lg font-bold">Juegos Patrocinados</h2>
                <p className="text-xs text-gray-500">Selección aleatoria para igualdad entre participantes</p>
              </div>
            </div>

            <div className="relative self-start md:self-auto">
              <div className="absolute inset-0 rounded-xl bg-yellow-400 blur-md opacity-40 animate-pulse" />
              <button
                onClick={handleSponsoredPlay}
                className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-3 text-sm font-bold text-black shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition-all"
              >
                <Gamepad2 className="h-4 w-4" />
                ¡Jugar ahora!
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>

          <GameSection title="" games={sponsoredGames} selectable={false} />
        </div>

        {/* Free Games */}
        <div className="pb-10">
          <GameSection
            title="Juegos para divertirse"
            icon={<Gamepad2 className="h-5 w-5 text-purple-500" />}
            games={freeGames}
            onGameClick={(game) => handlePlay(game)}
          />
        </div>

      </div>
    </main>
  );
};

export default GamesPanelPage;
