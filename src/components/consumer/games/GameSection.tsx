'use client';

import React from 'react';
import { GameCardResponseDTO } from "@/types/games/game.types";
import GameCard from "./GameCard";

interface GameSectionProps {
  title: string;
  icon?: React.ReactNode;
  games: GameCardResponseDTO[];
  selectable?: boolean;
  onGameClick?: (game: GameCardResponseDTO) => void;
}

const GameSection: React.FC<GameSectionProps> = ({
  title,
  icon,
  games,
  selectable = true,
  onGameClick
}) => {
  return (
    <section className="mt-8">
      {title && (
        <div className="mb-4 flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
      )}

      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${
          !selectable ? 'pointer-events-none opacity-90' : ''
        }`}
      >
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            selectable={selectable}
            onClick={
              selectable && onGameClick
                ? () => onGameClick(game)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
};

export default GameSection;
