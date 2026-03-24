"use client";

import { useEffect, useState } from "react";
import { getLastWinners } from "@/services/raffleService";
import { WinnerSummaryResponseDTO } from "@/types/raffles/raffleWinner.types";

const VISIBLE_ITEMS = 5;
const INTERVAL = 3500;

export default function LastWinnersPanel() {
  const [winners, setWinners] = useState<WinnerSummaryResponseDTO[]>([]);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    loadWinners();
  }, []);

  useEffect(() => {
    if (winners.length === 0) return;

    const interval = setInterval(() => {
      setStartIndex((prev) =>
        prev + 1 > winners.length - VISIBLE_ITEMS ? 0 : prev + 1
      );
    }, INTERVAL);

    return () => clearInterval(interval);
  }, [winners]);

  const loadWinners = async () => {
    try {
      const data = await getLastWinners();
      setWinners(data);
    } catch (error) {
      console.error("Error loading winners", error);
    }
  };

  const visibleWinners = winners.slice(
    startIndex,
    startIndex + VISIBLE_ITEMS
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 h-[420px] flex flex-col">
      {/* Header */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Últimos Ganadores
      </h3>

      {/* Lista */}
      <div className="flex flex-col gap-3 overflow-hidden">
        {visibleWinners.map((winner, index) => (
          <div
            key={index}
            className="flex flex-col bg-gray-50 rounded-xl px-3 py-2 transition-all duration-500 hover:bg-gray-100"
          >
            {/* Usuario + posición */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                {winner.userName}
              </p>

              <span className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded-full">
                #{winner.position}
              </span>
            </div>

            {/* Rifa */}
            <p className="text-xs text-gray-500 line-clamp-1">
              {winner.raffleTitle}
            </p>

            {/* Premio */}
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-600 line-clamp-1">
                {winner.prizeTitle}
              </p>

              <span className="text-xs font-bold text-yellow-600">
                ${winner.prizeValue.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}