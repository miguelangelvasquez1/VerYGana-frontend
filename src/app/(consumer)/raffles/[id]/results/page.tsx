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
      {result.drawProof && (() => {
        interface DrawProofWinner {
          position: number;
          userName: string;
          ticketNumber: string;
          prizeTitle: string;
          prizeType: string;
          prizeValue: number;
          prizeClaimed: boolean;
          claimDeadline: string;
        }
        interface DrawProof {
          drawMethod?: string;
          drawDate?: string;
          executedAt?: string;
          totalParticipants?: number;
          totalTickets?: number;
          numberOfWinners?: number;
          winners?: DrawProofWinner[];
        }
        let proof: DrawProof | null = null;
        try { proof = JSON.parse(result.drawProof) as DrawProof; } catch { /* not JSON */ }
        if (!proof) return null;

        const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
        const MEDAL_COLORS: Record<number, string> = {
          1: "border-yellow-400 bg-yellow-50",
          2: "border-gray-300 bg-gray-50",
          3: "border-amber-600 bg-amber-50",
        };

        const methodLabel =
          proof.drawMethod === "RANDOM_ORG"
            ? "Sorteo aleatorio — Random.org"
            : proof.drawMethod ?? "—";

        return (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">

            {/* Cabecera de la sección */}
            <div className="bg-linear-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">
                ✅
              </div>
              <div>
                <h2 className="text-white font-bold text-base">Prueba del sorteo</h2>
                <p className="text-blue-100 text-xs">Registro oficial e inmutable del resultado</p>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Resumen del sorteo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{proof.totalParticipants ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Participantes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{proof.totalTickets ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Boletos en juego</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{proof.numberOfWinners ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ganadores</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-blue-700 leading-tight">{methodLabel}</p>
                  <p className="text-xs text-blue-500 mt-0.5">Método de sorteo</p>
                </div>
              </div>

              {/* Fechas */}
              {(proof.drawDate ?? proof.executedAt) && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
                  {proof.drawDate && (
                    <span>
                      <span className="text-gray-400 text-xs">Fecha programada: </span>
                      <span className="font-medium">{new Date(proof.drawDate).toLocaleString()}</span>
                    </span>
                  )}
                  {proof.executedAt && (
                    <span>
                      <span className="text-gray-400 text-xs">Ejecutado: </span>
                      <span className="font-medium">{new Date(proof.executedAt).toLocaleString()}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Boletas ganadoras */}
              {proof.winners && proof.winners.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800 text-sm">Boletas ganadoras</h3>
                  {proof.winners.map((w) => (
                    <div
                      key={w.position}
                      className={`rounded-xl border-2 p-4 ${MEDAL_COLORS[w.position] ?? "border-gray-200 bg-gray-50"}`}
                    >
                      {/* Posición + usuario */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{MEDALS[w.position] ?? `#${w.position}`}</span>
                          <div>
                            <p className="text-xs text-gray-500">Ganador</p>
                            <p className="font-bold text-gray-900 text-sm">{w.userName}</p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 font-medium text-gray-600">
                          {w.prizeType === "DIGITAL" ? "Premio digital" : "Premio físico"}
                        </span>
                      </div>

                      {/* Detalles del premio */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="bg-white rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-400">Boleta ganadora</p>
                          <p className="font-mono font-bold text-gray-800 text-sm">{w.ticketNumber}</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 sm:col-span-1">
                          <p className="text-xs text-gray-400">Premio</p>
                          <p className="font-semibold text-gray-800 text-sm leading-tight">{w.prizeTitle}</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-400">Valor del premio</p>
                          <p className="font-bold text-yellow-600 text-base">${w.prizeValue.toLocaleString("es-CO")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        );
      })()}

    </div>
  );
}