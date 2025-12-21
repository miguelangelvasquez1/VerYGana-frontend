'use client';
import { GameCardResponseDTO } from "@/types/game.types";
import GameCard from "./GameCard";

const GameSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  games: GameCardResponseDTO[];
  selectable?: boolean; // permite o no seleccionar juegos
}> = ({ title, icon, games, selectable = true }) => (
  <section className="mt-8">
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-bold">{title}</h2>
    </div>

    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${!selectable ? 'pointer-events-none opacity-90' : ''}`}>
      {games.map(game => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  </section>
);

export default GameSection;
