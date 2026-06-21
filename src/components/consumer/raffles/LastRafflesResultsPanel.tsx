"use client";

import { useEffect, useState } from "react";
import { getLastRafflesResults } from "@/services/raffleService";
import { RaffleSummaryResultResponseDTO } from "@/types/raffles/raffleResult.types";
import Link from "next/link";

const VISIBLE_ITEMS = 5;
const INTERVAL = 3000;

export default function LastRafflesResultsPanel() {
  const [results, setResults] = useState<RaffleSummaryResultResponseDTO[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    if (results.length === 0) return;

    const interval = setInterval(() => {
      setStartIndex((prev) =>
        prev + 1 > results.length - VISIBLE_ITEMS ? 0 : prev + 1
      );
    }, INTERVAL);

    return () => clearInterval(interval);
  }, [results]);

  const loadResults = async () => {
    try {
      const data = await getLastRafflesResults();
      setResults(data);
    } catch (error) {
      console.error("Error loading raffle results", error);
    }
  };

  const visibleResults = results.slice(startIndex, startIndex + VISIBLE_ITEMS);

  return (
    <div className="rounded-2xl shadow-md overflow-hidden h-115 flex flex-col">

      {/* Header con gradiente de marca */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg, #014C92, #1EA5BD)" }}
      >
        <span className="text-lg">🏆</span>
        <h3 className="text-base font-bold text-white">Resultados de Rifas</h3>
      </div>

      {/* Lista */}
      <div className="flex flex-col justify-between flex-1 gap-2 p-4 bg-white">
        {visibleResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-gray-400 font-medium">Sin resultados aún</p>
          </div>
        ) : (
          visibleResults.map((result) => (
            <div
              key={result.raffleId}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-blue-50 transition border-l-4 bg-gray-50"
              style={{ borderLeftColor: "#014C92" }}
            >
              {/* Info */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {result.raffleTitle}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{new Date(result.drawnAt).toLocaleDateString()}</span>

                  <span
                    className="px-2 py-0.5 rounded-full text-white font-bold text-[10px]"
                    style={{
                      background:
                        result.raffleType === "PREMIUM"
                          ? "linear-gradient(to right, #7c3aed, #a855f7)"
                          : "linear-gradient(to right, #014C92, #1EA5BD)",
                    }}
                  >
                    {result.raffleType}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/raffles/${result.raffleId}/results`}
                className="ml-3 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition hover:opacity-80"
                style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
              >
                Ver
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
