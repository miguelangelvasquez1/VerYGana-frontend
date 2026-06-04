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

  const isPremium = raffle.raffleType === "PREMIUM";

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:scale-[1.03] hover:shadow-xl transition-all duration-300 flex flex-col">

      {/* Franja de color superior por tipo */}
      <div
        className="h-1 w-full"
        style={{
          background: isPremium
            ? "linear-gradient(to right, #7c3aed, #a855f7)"
            : "linear-gradient(to right, #014C92, #1EA5BD)",
        }}
      />

      {/* Imagen */}
      <div className="relative">
        <img
          src={raffle.imageUrl}
          alt={raffle.title}
          className="w-full h-44 object-cover"
        />

        {/* Overlay sutil en la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badge tipo */}
        <span
          className="absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md"
          style={{
            background: isPremium
              ? "linear-gradient(to right, #7c3aed, #a855f7)"
              : "linear-gradient(to right, #014C92, #1EA5BD)",
          }}
        >
          {raffle.raffleType}
        </span>
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col flex-1">
        {/* Título */}
        <h3 className="font-semibold text-gray-900 text-base line-clamp-2 mb-3">
          {raffle.title}
        </h3>

        {/* Info rápida */}
        <div className="space-y-1.5 text-xs text-gray-600 flex-1">
          <p className="flex items-center gap-1.5">
            <span>👥</span>
            <span>{raffle.totalParticipants} participantes</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span>🎟️</span>
            <span>{raffle.totalTicketsIssued} boletos generados</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span>🏆</span>
            <span>{raffle.prizeCount} premio(s)</span>
          </p>
        </div>

        {/* Fecha */}
        <div
          className="mt-3 text-xs font-semibold px-2 py-1 rounded-lg w-fit"
          style={{ background: "rgba(1,76,146,0.08)", color: "#014C92" }}
        >
          ⏳ Sorteo en: {getDaysRemaining()}
        </div>

        {/* CTA */}
        <Link
          href={`/raffles/${raffle.id}`}
          className="mt-4 w-full text-black text-sm font-bold py-2.5 rounded-xl transition text-center block cursor-pointer shadow-sm hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(to right, #fbbf24, #f59e0b)" }}
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
