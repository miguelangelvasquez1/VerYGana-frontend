"use client";

import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import Link from "next/link";

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
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:scale-[1.03] hover:shadow-xl transition-all duration-300">

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
        <h3 className="font-semibold text-gray-900 text-base line-clamp-2">
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
        <Link href={`/raffles/${raffle.id}`}
          className="mt-5 w-full bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold py-3 rounded-xl transition text-center block cursor-pointer">
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
