"use client";

import { useEffect, useState } from "react";
import { getLastWinners } from "@/services/raffleService";
import { WinnerSummaryResponseDTO } from "@/types/raffles/raffleWinner.types";

const VISIBLE_ITEMS = 5;
const INTERVAL = 3500;

const getPositionStyle = (position: number) => {
  if (position === 1) return { background: "linear-gradient(to right, #f59e0b, #fbbf24)", color: "#000" };
  if (position === 2) return { background: "linear-gradient(to right, #9ca3af, #d1d5db)", color: "#000" };
  if (position === 3) return { background: "linear-gradient(to right, #f97316, #fb923c)", color: "#fff" };
  return { background: "linear-gradient(to right, #0b1440, #03548C)", color: "#fff" };
};

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

  const visibleWinners = winners.slice(startIndex, startIndex + VISIBLE_ITEMS);

  return (
    <div className="rounded-2xl shadow-md overflow-hidden flex flex-col">

      {/* Header con gradiente de marca */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg, #0b1440, #03548C)" }}
      >
        <span className="text-lg">🥇</span>
        <h3 className="text-base font-bold text-white">Últimos Ganadores</h3>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2 p-4 bg-white">
        {visibleWinners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-4xl mb-3">🏅</div>
            <p className="text-sm text-gray-400 font-medium">Sin ganadores aún</p>
          </div>
        ) : (
          visibleWinners.map((winner, index) => (
            <div
              key={index}
              className="flex flex-col bg-gray-50 rounded-xl px-3 py-2.5 transition-all duration-500 hover:bg-blue-50 border-l-4"
              style={{ borderLeftColor: "#03548C" }}
            >
              {/* Usuario + posición */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  {winner.userName}
                </p>

                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={getPositionStyle(winner.position)}
                >
                  #{winner.position}
                </span>
              </div>

              {/* Rifa */}
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                {winner.raffleTitle}
              </p>

              {/* Premio */}
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-600 line-clamp-1 flex-1 mr-2">
                  {winner.prizeTitle}
                </p>

                <span className="text-xs font-bold" style={{ color: "#03548C" }}>
                  ${winner.prizeValue.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
