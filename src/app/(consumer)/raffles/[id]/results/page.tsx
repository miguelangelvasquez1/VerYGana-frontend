"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRaffleResultByRaffleId } from "@/services/raffleService";
import { RaffleResultResponseDTO } from "@/types/raffles/raffleResult.types";

export default function RaffleResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState<RaffleResultResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    try {
      const data = await getRaffleResultByRaffleId(Number(id));
      setResult(data);
    } catch (error) {
      console.error("Error loading result", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center py-10">Cargando...</p>;
  if (!result) return <p className="text-center py-10">No encontrado</p>;

  return (
    <div className="w-full px-6 xl:px-10 py-10 space-y-8">

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {result.raffleTitle}
        </h1>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>📅 Fecha del sorteo: {new Date(result.drawnAt).toLocaleString()}</span>
          <span>👥 {result.totalParticipants} participantes</span>
          <span>🎟️ {result.totalTicketsIssued} boletos</span>
          <span className="px-3 py-1 bg-yellow-500 text-black rounded-full font-bold text-xs">
            {result.raffleType}
          </span>
          <img src={result.raffleImageUrl} alt={result.raffleTitle} className="w-full h-90 object-cover rounded-lg" />
        </div>
      </div>

      {/* GANADORES */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Ganadores
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {result.winners.map((winner) => (
            <div
              key={winner.position}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
            >
              {/* Imagen premio */}
              <img
                src={winner.prizeImageUrl}
                alt={winner.prizeTitle}
                className="w-full h-40 object-cover"
              />

              {/* Info */}
              <div className="p-4 space-y-2">

                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">
                    #{winner.position}
                  </span>

                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Ganador
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800 text-sm">
                  {winner.prizeTitle}
                </h3>

                <p className="text-xs text-gray-500">
                  👤 {winner.userName}
                </p>

                <p className="text-xs text-gray-500">
                  🎟️ Ticket: {winner.ticketNumber}
                </p>

                <p className="text-sm font-bold text-yellow-600">
                  Valor del premio: ${winner.prizeValue.toLocaleString()}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* PRUEBA DEL SORTEO */}
      {result.drawProof && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">
            Prueba del sorteo
          </h2>

          <img
            src={result.drawProof}
            alt="Proof"
            className="w-full rounded-xl"
          />
        </div>
      )}

    </div>
  );
}