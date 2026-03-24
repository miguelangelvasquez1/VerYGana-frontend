"use client";

import { useEffect, useState } from "react";
import { getLastRafflesResults } from "@/services/raffleService";
import { RaffleSummaryResultResponseDTO } from "@/types/raffles/raffleResult.types";

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
    <div className="bg-white rounded-2xl shadow-md p-4 h-[420px] flex flex-col">
      {/* Header */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Resultados de Rifas
      </h3>

      {/* Lista animada */}
      <div className="flex flex-col gap-3 overflow-hidden relative">
        {visibleResults.map((result, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 transition-all duration-500 hover:bg-gray-100"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                {result.raffleTitle}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(result.drawnAt).toLocaleDateString()}
              </p>
            </div>

            <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-500 text-black">
              {result.raffleType}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}