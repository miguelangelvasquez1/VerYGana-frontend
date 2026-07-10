'use client';

import React, { useEffect, useState } from 'react';
import { Star, Gamepad2, Zap, Sparkles } from 'lucide-react';
import GameSection from '@/components/consumer/games/GameSection';
import { GameCardResponseDTO } from '@/types/games/game.types';
import { getAvailableGamesPage, init } from '@/services/GameService';
import { useRouter } from 'next/navigation';

const GamesPanelPage = () => {
  const router = useRouter();
  const [games, setGames] = useState<GameCardResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const page = await getAvailableGamesPage(0, 20);
        setGames(page.data);
      } catch (error) {
        console.error('Error loading games', error);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  const handleSponsoredPlay = async () => {
    const response = await init({ sponsored: true });
    router.push(`/games/play?url=${encodeURIComponent(response.url)}`);
  };

  const handlePlay = async (game: GameCardResponseDTO) => {
    const response = await init({ gameId: game.id, sponsored: false });
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
        style={{ background: 'linear-gradient(135deg, #0b1440 0%, #03548C 50%, #0b1440 100%)' }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            Juega, compite y gana premios reales
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
            Juega y Gana
          </h1>
          <p className="text-white/70 text-base lg:text-lg mb-0 max-w-lg mx-auto">
            Convierte cada partida en ganancias reales.
          </p>
        </div>

        {/* Wave bottom */}
        <div className="absolute -bottom-px left-0 right-0 leading-0">
          <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f4f7fb" />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sponsored Games */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-[#c9a227]" />
            <div>
              <h2 className="text-lg font-bold text-[#0b1440]">Juegos Patrocinados</h2>
              <p className="text-xs text-gray-500">Selección aleatoria para igualdad entre participantes</p>
            </div>
          </div>

          {/* Big, centered, eye-catching CTA */}
          <div className="relative flex justify-center py-6 mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" />
            </div>
            <button
              onClick={handleSponsoredPlay}
              className="relative flex items-center gap-3 rounded-2xl bg-linear-to-r from-yellow-400 via-amber-400 to-yellow-500 px-14 py-6 text-xl font-extrabold text-[#0b1440] shadow-2xl shadow-amber-500/40 ring-4 ring-yellow-300/40 hover:scale-105 hover:shadow-amber-500/60 active:scale-95 transition-all"
            >
              <Gamepad2 className="h-7 w-7" />
              ¡Jugar ahora!
              <Sparkles className="h-7 w-7" />
            </button>
          </div>
        </div>

        {/* Games */}
        <div className="pb-10">
          <GameSection
            title="Juegos para divertirse"
            icon={<Gamepad2 className="h-5 w-5 text-[#03548C]" />}
            games={games}
            onGameClick={(game) => handlePlay(game)}
          />
        </div>

      </div>
    </main>
  );
};

export default GamesPanelPage;
