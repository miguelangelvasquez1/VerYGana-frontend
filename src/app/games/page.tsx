// Panel de Juegos inicial (Next.js + React + TypeScript + Tailwind)
// Estructura base pensada para conectar con API más adelante

'use client';

import React from 'react';
import { Search, Star, Gamepad2 } from 'lucide-react';
import Navbar from '@/components/bars/NavBar';
import Footer from '@/components/Footer';

/* =========================
   TIPOS
========================= */
export interface GameCardDTO {
  id: number;
  title: string;
  imageUrl: string;
  sponsored: boolean;
  rewardText?: string; // ej: "Gana hasta $500"
}

/* =========================
   COMPONENTE: Banner
========================= */
const CasinoBanner: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="w-full rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white shadow">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mt-1 text-sm opacity-90">{subtitle}</p>
  </div>
);

/* =========================
   COMPONENTE: Barra de búsqueda
   (puedes reemplazarlo por tu SearchBar actual)
========================= */
const GameSearchBar = () => (
  <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm">
    <Search className="h-5 w-5 text-gray-400" />
    <input
      type="text"
      placeholder="Buscar juegos"
      className="w-full outline-none text-sm"
    />
  </div>
);

/* =========================
   COMPONENTE: Tarjeta de Juego
========================= */
const GameCard: React.FC<{ game: GameCardDTO }> = ({ game }) => (
  <div className="group relative rounded-2xl overflow-hidden bg-black shadow hover:scale-[1.02] transition">
    <img
      src={game.imageUrl}
      alt={game.title}
      className="h-40 w-full object-cover"
    />

    {game.sponsored && (
      <span className="absolute top-2 left-2 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
        PATROCINADO
      </span>
    )}

    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition" />

    <div className="absolute bottom-0 p-3 text-white">
      <h3 className="text-sm font-semibold">{game.title}</h3>
      {game.rewardText && (
        <p className="text-xs text-green-400">{game.rewardText}</p>
      )}
    </div>
  </div>
);

/* =========================
   COMPONENTE: Sección de Juegos
========================= */
const GameSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  games: GameCardDTO[];
}> = ({ title, icon, games }) => (
  <section className="mt-8">
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-bold">{title}</h2>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {games.map(game => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  </section>
);

/* =========================
   PANEL PRINCIPAL
========================= */
const GamesPanelPage = () => {
  // Datos mock (luego vienen de la API)
  const sponsoredGames: GameCardDTO[] = [
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

  const freeGames: GameCardDTO[] = [
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
      <main className="p-4 md:p-8 max-w-7xl mx-auto">

        {/* Banner subliminal */}
        <CasinoBanner
          title="Juega, gana y vuelve a intentarlo"
          subtitle="Cada partida puede acercarte a tu próxima recompensa"
        />

        {/* Buscador */}
        <div className="mt-6">
          <GameSearchBar />
        </div>

        {/* Juegos patrocinados */}
        <GameSection
          title="Juegos Patrocinados"
          icon={<Star className="h-5 w-5 text-yellow-500" />}
          games={sponsoredGames}
        />

        {/* Juegos solo diversión */}
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
