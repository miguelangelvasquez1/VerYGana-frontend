'use client';

import React from 'react';
import Image from 'next/image';
import { GameCardResponseDTO } from "@/types/games/game.types";

interface GameCardProps {
  game: GameCardResponseDTO;
  onClick?: () => void;
  selectable?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({
  game,
  onClick,
  selectable = true
}) => {
  const content = (
    <>
      <span className="relative block h-40 w-full">
        <Image
          src={game.frontPageUrl}
          alt={game.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
          className="object-cover"
        />
      </span>

      <span className="absolute inset-0 block bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <span className="absolute bottom-0 block p-3 text-left text-white">
        <span className="block text-sm font-semibold">{game.title}</span>
      </span>
    </>
  );

  // Navegar o abrir algo es una acción: se pinta como botón (RN-5). Sin acción, solo informa.
  if (!selectable) {
    return (
      <div className="group relative rounded-2xl overflow-hidden bg-black shadow transition opacity-90">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full rounded-2xl overflow-hidden bg-black shadow transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
    >
      {content}
    </button>
  );
};

export default GameCard;
