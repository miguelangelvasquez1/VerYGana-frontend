"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import * as raffleService from "@/services/raffleService";

type VisualState = "LIVE" | "DRAWING" | "RECENT";

export default function LiveRafflesShowcase() {
  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadRaffles = async () => {
      try {
        const [live, drawing] = await Promise.all([
          raffleService.getRafflesByStatusAndType("LIVE", "STANDARD", 10, 0),
          raffleService.getRafflesByStatusAndType("DRAWING", "STANDARD", 10, 0),
        ]);

        const combined = [...live.data, ...drawing.data];

        // Filtrar también COMPLETED recientes (15 min)
        const now = new Date();

        const filtered = combined.filter((raffle) => {
          const drawDate = new Date(raffle.drawDate);
          const diffMinutes =
            (now.getTime() - drawDate.getTime()) / 1000 / 60;

          return diffMinutes <= 15;
        });

        setRaffles(filtered);
      } catch (error) {
        console.error("Error loading live raffles", error);
      } finally {
        setLoading(false);
      }
    };

    loadRaffles();
  }, []);

  const getVisualState = (raffle: RaffleSummaryResponseDTO): VisualState => {
    if (raffle.raffleStatus === "DRAWING") return "DRAWING";
    if (raffle.raffleStatus === "COMPLETED") return "RECENT";
    return "LIVE";
  };

  if (loading) {
    return <p>Cargando eventos en vivo...</p>;
  }

  if (!raffles.length) {
    return null;
  }

  return (
    <section className="w-full py-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        🎥 Eventos en Vivo
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {raffles.map((raffle) => {
          const visualState = getVisualState(raffle);

          return (
            <div
              key={raffle.id}
              className="min-w-[280px] bg-white shadow-md rounded-2xl p-4 hover:shadow-lg transition cursor-pointer"
              onClick={() => router.push(`/raffles/${raffle.id}/live`)}
            >
              <div className="flex justify-between items-center mb-2">
                {visualState === "LIVE" && (
                  <span className="text-sm font-semibold text-red-500 animate-pulse">
                    🔴 EN VIVO
                  </span>
                )}

                {visualState === "DRAWING" && (
                  <span className="text-sm font-semibold text-orange-500 animate-pulse">
                    🎰 SORTEANDO
                  </span>
                )}

                {visualState === "RECENT" && (
                  <span className="text-sm font-semibold text-blue-500">
                    ✅ FINALIZADA
                  </span>
                )}

                {raffle.raffleType === "PREMIUM" && (
                  <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full">
                    PREMIUM
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-2">
                {raffle.title}
              </h3>

              <div className="text-sm text-gray-600">
                <p>🎟 {raffle.totalTicketsIssued} Tickets</p>
                <p>👥 {raffle.totalParticipants} Participantes</p>
                <p>🏆 {raffle.prizeCount} Premios</p>
              </div>

              <button className="mt-4 w-full bg-black text-white py-2 rounded-xl hover:bg-gray-800 transition">
                Ver evento
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
