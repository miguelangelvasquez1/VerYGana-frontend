// Panel de Juegos inicial (Next.js + React + TypeScript + Tailwind)
// Estructura base pensada para conectar con API más adelante

'use client';

import React from 'react';
import { Search, Star, Gamepad2 } from 'lucide-react';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';
import GameSection from '@/components/games/GameSection';
import { GameCardResponseDTO } from '@/types/game.types';
import Banner from '@/components/games/Banner';
import GameSearchBar from '@/components/games/GameSearchBar';


/* =========================
   PANEL PRINCIPAL
========================= */
const GamesPanelPage = () => {
  const handleSponsoredPlay = () => {
    // En el futuro: lógica de selección aleatoria + tracking
    alert('Iniciando un juego patrocinado aleatorio');
  };
  // Datos mock (luego vienen de la API)
  const sponsoredGames: GameCardResponseDTO[] = [
    {
      id: 1,
      title: 'Rifa Diaria Oro',
      imageUrl: 'https://via.placeholder.com/300x200',
      sponsored: true,
      rewardText: 'Gana créditos reales'
    },
    {
      id: 2,
      title: 'Ruleta Patrocinada',
      imageUrl: 'https://via.placeholder.com/300x200',
      sponsored: true,
      rewardText: 'Hasta $2.000'
    }
  ];

  const freeGames: GameCardResponseDTO[] = [
    {
      id: 3,
      title: 'Memoria Clásica',
      imageUrl: 'https://via.placeholder.com/300x200',
      sponsored: false
    },
    {
      id: 4,
      title: 'Puzzle Express',
      imageUrl: 'https://via.placeholder.com/300x200',
      sponsored: false
    }
  ];

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-br from-green-500 via-cyan-600 to-purple-500 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Gana dinero jugando nuestros juegos patrocinados
            </h1>
          </div>
        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
          Disfruta de una variedad de juegos diseñados para entretenerte y ofrecerte la oportunidad de ganar premios reales. ¡Empieza a jugar ahora y convierte tu diversión en ganancias!
        </p>
        </div>
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
      
        {/* Banner subliminal */}
        <Banner
          title="Juega, gana y vuelve a intentarlo"
          subtitle="Cada partida puede acercarte a tu próxima recompensa"
          color='from-indigo-700 to-blue-600'
        />

        {/* Buscador */}
        <div className="mt-6">
          <GameSearchBar />
        </div>

        {/* Juegos patrocinados */}
        {/* Juegos patrocinados (no seleccionables) */}
        <div className="mt-10 mb-10 rounded-2xl border border-dashed p-6 bg-gradient-to-br from-yellow-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Juegos Patrocinados</h2>
            </div>

            <button
              onClick={handleSponsoredPlay}
              className="rounded-xl bg-yellow-400 px-6 py-2 text-sm font-bold text-black hover:bg-yellow-300 transition"
            >
              Jugar ahora 🎲
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Un juego se selecciona de forma aleatoria para garantizar igualdad entre anunciantes.
          </p>

          <GameSection
            title=""
            games={sponsoredGames}
            selectable={false}
          />
        </div>

        <Banner
          title="Juega y diviertete sin límites"
          subtitle="Diviértete con nuestros increibles juegos gratuitos"
          color='from-green-500 to-green-700'
        />

        {/* Juegos solo diversión */}
        {/* Juegos solo diversión (seleccionables) */}
        <GameSection
          title="Juegos para divertirse"
          icon={<Gamepad2 className="h-5 w-5 text-blue-500" />}
          games={freeGames}
        />
      </main>
      <Footer />
    </>
  );
};

export default GamesPanelPage;
