"use client";

import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";

interface Props {
  raffle: RaffleSummaryResponseDTO;
}

export default function RaffleCard({ raffle }: Props) {
  const getDaysRemaining = () => {
    const diff =
      new Date(raffle.drawDate).getTime() - new Date().getTime();

    if (diff <= 0) return "En curso";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} días`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
      
      {/* Imagen */}
      <div className="relative">
        <img
          src={raffle.imageUrl}
          alt={raffle.title}
          className="w-full h-44 object-cover"
        />

        {/* Badge tipo */}
        <span className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
          {raffle.raffleType}
        </span>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Título */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
          {raffle.title}
        </h3>

        {/* Info rápida */}
        <div className="mt-3 space-y-1 text-xs text-gray-600">
          <p>👥 {raffle.totalParticipants} participantes</p>
          <p>🎟️ {raffle.totalTicketsIssued} boletos generados</p>
          <p>🏆 {raffle.prizeCount} premio(s)</p>
        </div>

        {/* Fecha */}
        <div className="mt-3 text-xs text-gray-500">
          ⏳ Sorteo en: {getDaysRemaining()}
        </div>

        {/* CTA */}
        <button className="mt-4 w-full bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold py-2 rounded-lg transition">
          Ver detalles
        </button>
      </div>
    </div>
  );
}