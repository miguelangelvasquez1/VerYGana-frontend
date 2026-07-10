"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Maximize2, X } from "lucide-react";
import { getRaffleResultByRaffleId, getDrawProofByRaffleId } from "@/services/raffleService";
import { RaffleResultResponseDTO, DrawProofResponseDTO } from "@/types/raffles/raffleResult.types";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const MEDAL_COLORS: Record<number, string> = {
  1: "border-yellow-400 bg-yellow-50",
  2: "border-gray-300 bg-gray-50",
  3: "border-amber-600 bg-amber-50",
};

function drawMethodLabel(method?: string) {
  if (method === "RANDOM_ORG") return "Random.org";
  if (method === "INTERNAL") return "Algoritmo interno";
  return method ?? "—";
}

function truncate(str?: string | null, len = 28) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export default function RaffleResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState<RaffleResultResponseDTO | null>(null);
  const [proof, setProof] = useState<DrawProofResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullPrizeImage, setFullPrizeImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [resultData, proofData] = await Promise.all([
        getRaffleResultByRaffleId(Number(id)),
        getDrawProofByRaffleId(Number(id)).catch(() => null),
      ]);
      setResult(resultData);
      setProof(proofData);
    } catch (error) {
      console.error("Error loading result", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center py-10">Cargando...</p>;
  if (!result) return <p className="text-center py-10">No encontrado</p>;

  const hasFallback =
    proof &&
    proof.configuredDrawMethod &&
    proof.actualDrawMethod &&
    proof.configuredDrawMethod !== proof.actualDrawMethod;

  return (
    <div className="w-full px-6 xl:px-10 py-10 space-y-8">

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {result.raffleTitle}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>📅 Fecha del sorteo: {new Date(result.drawnAt).toLocaleString()}</span>
          <span>👥 {result.totalParticipants} participantes</span>
          <span>🎟️ {result.totalTicketsIssued} boletos</span>
          <span className="px-3 py-1 bg-[#FFD700] text-black rounded-full font-bold text-xs">
            {result.raffleType}
          </span>
        </div>

        <div className="relative mt-4">
          <img
            src={result.raffleImageUrl}
            alt={result.raffleTitle}
            className="w-full h-64 object-cover rounded-xl"
          />
          <button
            onClick={() => setShowFullImage(true)}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Ver completa
          </button>
        </div>
      </div>

      {/* GANADORES */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Ganadores</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.winners.map((winner) => (
            <div
              key={winner.position}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <div className="relative">
                <img
                  src={winner.prizeImageUrl}
                  alt={winner.prizeTitle}
                  className="w-full h-40 object-cover"
                />
                <button
                  onClick={() => setFullPrizeImage(winner.prizeImageUrl)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">
                    {MEDALS[winner.position] ?? `#${winner.position}`}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Ganador
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">{winner.prizeTitle}</h3>
                <p className="text-xs text-gray-500">👤 {winner.userName}</p>
                <p className="text-xs text-gray-500">🎟️ Boleta: {winner.ticketNumber}</p>
                <p className="text-sm font-bold text-[#c9a227]">
                  Valor del premio: ${winner.prizeValue.toLocaleString("es-CO")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRUEBA DEL SORTEO */}
      {proof && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">

          {/* Cabecera */}
          <div className="bg-linear-to-r from-[#0b1440] to-[#03548C] px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">
              🔍
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Prueba del sorteo</h2>
              <p className="text-[#00a4ff] text-xs mt-0.5">
                Registro oficial e inmutable — verificable de forma independiente
              </p>
            </div>
          </div>

          <div className="p-6 space-y-8">

            {/* Aviso de fallback */}
            {hasFallback && (
              <div className="flex gap-3 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800">
                <span className="shrink-0 text-base">⚠️</span>
                <div>
                  <p className="font-semibold">Cambio de método de sorteo</p>
                  <p className="text-xs mt-0.5">
                    Se configuró <span className="font-medium">{drawMethodLabel(proof.configuredDrawMethod)}</span> pero
                    se ejecutó con <span className="font-medium">{drawMethodLabel(proof.actualDrawMethod)}</span>.
                    {proof.drawMethodNote && <> {proof.drawMethodNote}</>}
                  </p>
                </div>
              </div>
            )}

            {/* Resumen estadístico */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{proof.totalParticipants ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-1">Participantes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{proof.totalTickets ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-1">Boletos en juego</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{proof.numberOfWinners ?? "—"}</p>
                  <p className="text-xs text-gray-500 mt-1">Ganadores</p>
                </div>
                <div className="bg-[#00a4ff]/10 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-[#03548C] leading-tight">{drawMethodLabel(proof.actualDrawMethod)}</p>
                  <p className="text-xs text-[#00a4ff] mt-1">Método utilizado</p>
                </div>
              </div>
            </div>

            {/* Fechas */}
            {(proof.drawDate || proof.executedAt) && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fechas</p>
                <div className="flex flex-wrap gap-6 text-sm text-gray-700">
                  {proof.drawDate && (
                    <div>
                      <p className="text-xs text-gray-400">Fecha programada</p>
                      <p className="font-medium mt-0.5">{new Date(proof.drawDate).toLocaleString("es-CO")}</p>
                    </div>
                  )}
                  {proof.executedAt && (
                    <div>
                      <p className="text-xs text-gray-400">Ejecutado el</p>
                      <p className="font-medium mt-0.5">{new Date(proof.executedAt).toLocaleString("es-CO")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verificación criptográfica */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Verificación criptográfica</p>
              <div className="space-y-3">

                {/* Hash del pool */}
                {proof.ticketPoolHash && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Hash del pool de boletos</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{proof.ticketPoolHash}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Huella digital de todos los boletos participantes — cualquier alteración cambiaría este valor.
                    </p>
                  </div>
                )}

                {/* Random.org metadata */}
                {proof.randomOrgDrawMetadata && (
                  <div className="border border-[#03548C]/20 rounded-xl overflow-hidden">
                    <div className="bg-[#0b1440]/5 px-4 py-2 flex items-center gap-2">
                      <span className="text-sm">🌐</span>
                      <p className="text-xs font-semibold text-[#03548C]">Metadatos de Random.org</p>
                      <span className="ml-auto text-xs text-[#00a4ff]">Generador externo independiente</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100">
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs text-gray-400">N.º de solicitud</p>
                        <p className="font-mono font-bold text-gray-800 text-sm mt-0.5">
                          #{proof.randomOrgDrawMetadata.serialNumber}
                        </p>
                      </div>
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs text-gray-400">Generado el</p>
                        <p className="font-medium text-gray-800 text-sm mt-0.5">
                          {new Date(proof.randomOrgDrawMetadata.completionTime).toLocaleString("es-CO")}
                        </p>
                      </div>
                      <div className="bg-white px-4 py-3">
                        <p className="text-xs text-gray-400">Bits de aleatoriedad usados</p>
                        <p className="font-bold text-gray-800 text-sm mt-0.5">
                          {proof.randomOrgDrawMetadata.bitsUsed?.toLocaleString("es-CO")}
                          {proof.randomOrgDrawMetadata.bitsLeft != null && (
                            <span className="text-gray-400 font-normal">
                              {" "}({proof.randomOrgDrawMetadata.bitsLeft?.toLocaleString("es-CO")} restantes)
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-gray-700 text-xs mt-0.5 leading-relaxed">
                        {JSON.stringify(proof.randomOrgDrawMetadata.license)}
                      </p>

                      <div className="bg-white px-4 py-3 sm:col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Firma digital (Random.org)</p>
                        <p
                          className="font-mono text-xs text-gray-600 break-all"
                          title={proof.randomOrgDrawMetadata.signature}
                        >
                          {proof.randomOrgDrawMetadata.signature ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Firma criptográfica que certifica que los números fueron generados por Random.org.
                        </p>
                      </div>
                      <div className="bg-white px-4 py-3 sm:col-span-2">
                        <p className="text-xs text-gray-400 mb-1">Clave de API cifrada (hashedApiKey)</p>
                        <p
                          className="font-mono text-xs text-gray-600 break-all"
                          title={proof.randomOrgDrawMetadata.hashedApiKey}
                        >
                          {proof.randomOrgDrawMetadata.hashedApiKey ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Identificador anonimizado del emisor — permite verificar la fuente sin exponer credenciales.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boletas ganadoras detalladas */}
            {proof.winners && proof.winners.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Boletas ganadoras</p>
                <div className="space-y-3">
                  {proof.winners.map((w) => (
                    <div
                      key={w.position}
                      className={`rounded-xl border-2 p-4 ${MEDAL_COLORS[w.position] ?? "border-gray-200 bg-gray-50"}`}
                    >
                      {/* Posición + usuario + estado de reclamación */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{MEDALS[w.position] ?? `#${w.position}`}</span>
                          <div>
                            <p className="text-xs text-gray-500">Ganador</p>
                            <p className="font-bold text-gray-900 text-sm">{w.userName}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 font-medium text-gray-600">
                            {w.prizeType === "DIGITAL" ? "Premio digital" : "Premio físico"}
                          </span>
                          {w.prizeClaimed ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                              ✅ Premio reclamado
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                              ⏳ Pendiente de reclamar
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detalles */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="bg-white rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-400">Boleta ganadora</p>
                          <p className="font-mono font-bold text-gray-800 text-sm">{w.ticketNumber}</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-400">Premio</p>
                          <p className="font-semibold text-gray-800 text-sm leading-tight">{w.prizeTitle}</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-400">Valor del premio</p>
                          <p className="font-bold text-[#c9a227] text-base">${w.prizeValue.toLocaleString("es-CO")}</p>
                        </div>
                      </div>

                      {/* Fechas de reclamación */}
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                        {w.claimDeadline && (
                          <span>
                            📅 Plazo para reclamar:{" "}
                            <span className="font-medium text-gray-700">
                              {new Date(w.claimDeadline).toLocaleDateString("es-CO")}
                            </span>
                          </span>
                        )}
                        {w.prizeClaimedAt && (
                          <span>
                            ✅ Reclamado el:{" "}
                            <span className="font-medium text-gray-700">
                              {new Date(w.prizeClaimedAt).toLocaleString("es-CO")}
                            </span>
                          </span>
                        )}
                        {w.prizeTrackingInfo && (
                          <span>
                            📦 Seguimiento:{" "}
                            <span className="font-medium text-gray-700">{w.prizeTrackingInfo}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {fullPrizeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setFullPrizeImage(null)}
        >
          <div
            className="relative max-w-3xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFullPrizeImage(null)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white text-sm hover:text-gray-300 transition"
            >
              <X className="w-5 h-5" />
              Cerrar
            </button>
            <img
              src={fullPrizeImage}
              alt="Premio"
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {showFullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setShowFullImage(false)}
        >
          <div
            className="relative max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white text-sm hover:text-gray-300 transition"
            >
              <X className="w-5 h-5" />
              Cerrar
            </button>
            <img
              src={result.raffleImageUrl}
              alt={result.raffleTitle}
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
