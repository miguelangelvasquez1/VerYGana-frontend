"use client";

import React, { useEffect, useState, useRef } from "react";
import { getRaffleWinners } from "@/services/raffleService";
import { WinnerSummaryResponseDTO } from "@/types/raffles/raffleWinner.types";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy } from "lucide-react";

interface Props {
  raffleId: number;
}

export default function WinnersCarousel({ raffleId }: Props) {
  const [winners, setWinners] = useState<WinnerSummaryResponseDTO[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadWinners = async () => {
      try {
        const data = await getRaffleWinners(raffleId);
        setWinners(data ?? []);

        // 🎉 Confetti efecto celebración
        if (data && data.length > 0) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error("Error loading winners", err);
      }
    };

    loadWinners();
  }, [raffleId]);

  if (!winners.length) return null;

  // Duplicamos para loop infinito
  const marqueeItems = [...winners, ...winners];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-900 via-black to-yellow-900 py-6 shadow-[0_0_40px_rgba(255,215,0,0.4)]">
      
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-pulse pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400 font-bold text-lg">
        <Trophy className="animate-pulse" />
        Ganadores Recientes
      </div>

      {/* Marquee */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
      >
        <motion.div
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "linear",
          }}
        >
          {marqueeItems.map((winner, index) => (
            <div
              key={`${winner.winnerId}-${index}`}
              className="flex items-center gap-2 text-white text-sm md:text-base"
            >
              <span className="text-green-400 text-lg">🎉</span>

              <span className="font-semibold text-yellow-300">
                {winner.consumerName}
              </span>

              <span>
                ganó
              </span>

              <span className="font-bold text-white">
                {winner.prizeTitle}
              </span>

              <span className="text-gray-400">
                (Ticket #{winner.ticketNumber})
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
