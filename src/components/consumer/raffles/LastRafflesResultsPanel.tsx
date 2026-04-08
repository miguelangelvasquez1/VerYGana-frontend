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

  const visibleResults = results.slice(
    startIndex,
    startIndex + VISIBLE_ITEMS
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 h-[460px] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Resultados de Rifas
        </h3>
      </div>

      {/* Lista */}
      <div className="flex flex-col justify-between flex-1 gap-3">

        {visibleResults.map((result) => (
          <div
            key={result.raffleId}
            className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition"
          >
            {/* Info */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {result.raffleTitle}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {new Date(result.drawnAt).toLocaleDateString()}
                </span>

                <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-black font-bold text-[10px]">
                  {result.raffleType}
                </span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={`/raffles/${result.raffleId}/results`}
              className="ml-3 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
            >
              Ver
            </Link>
          </div>
        ))}

      </div>
    </div>
  );
}