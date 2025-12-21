'use client';

import { GameCardResponseDTO } from "@/types/game.types";

const GameCard: React.FC<{ game: GameCardResponseDTO }> = ({ game }) => (
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

export default GameCard;