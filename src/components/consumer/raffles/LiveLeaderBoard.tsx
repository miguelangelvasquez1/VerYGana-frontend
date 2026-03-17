"use client";

import React, { useEffect, useState } from "react";
import { getRaffleLeaderBoard } from "@/services/raffleService";
import { ParticipantLeaderboardDTO } from "@/types/raffles/raffle.types";
import { Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  raffleId: number;
}

export default function LiveLeaderboard({ raffleId }: Props) {
  const [participants, setParticipants] = useState<
    ParticipantLeaderboardDTO[]
  >([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const loadLeaderboard = async () => {
    try {
      const data = await getRaffleLeaderBoard(raffleId);
      setParticipants(data ?? []);
    } catch (error) {
      console.error("Error loading leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [raffleId]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        Cargando leaderboard...
      </div>
    );
  }

  const topThree = participants.slice(0, 3);
  const others = participants.slice(3);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 text-white shadow-2xl">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Trophy className="text-yellow-400 animate-pulse" />
        Top 10 Probabilidades
      </h2>

      {/* ================= TOP 3 ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {topThree.map((p, index) => {
          const isCurrentUser = Number(user?.id) === p.consumerId;

          return (
            <motion.div
              key={p.consumerId}
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-2xl p-6 text-center relative ${
                index === 0
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black scale-105"
                  : index === 1
                  ? "bg-gradient-to-br from-gray-200 to-gray-400 text-black"
                  : "bg-gradient-to-br from-orange-400 to-orange-600 text-black"
              } ${isCurrentUser ? "ring-4 ring-green-400" : ""}`}
            >
              <motion.div
                animate={index === 0 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-3xl"
              >
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </motion.div>

              <div className="flex justify-center mt-4">
                <img
                  src={
                    p.avatarUrl ||
                    "https://ui-avatars.com/api/?name=" + p.userName
                  }
                  alt={p.userName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>

              <p className="mt-4 font-bold text-lg">
                {p.userName}
              </p>

              <p className="text-sm mt-1">
                🎟 {p.ticketsCount} tickets
              </p>

              <motion.p
                key={p.winProbability}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-xl font-bold mt-2"
              >
                {p.winProbability.toFixed(2)}%
              </motion.p>

              {isCurrentUser && (
                <p className="text-xs mt-2 font-semibold">
                  Eres tú 🔥
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ================= RESTO ================= */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        <AnimatePresence>
          {others.map((p, index) => {
            const isCurrentUser = Number(user?.id) === p.consumerId;
            const position = index + 4;

            return (
              <motion.div
                key={p.consumerId}
                layout
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`flex items-center justify-between bg-gray-800 p-4 rounded-xl ${
                  isCurrentUser
                    ? "ring-2 ring-green-400"
                    : "hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold w-8">
                    #{position}
                  </span>

                  <img
                    src={
                      p.avatarUrl ||
                      "https://ui-avatars.com/api/?name=" + p.userName
                    }
                    alt={p.userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div>
                    <p className="font-medium">
                      {p.userName}
                    </p>

                    <div className="w-48 bg-gray-600 rounded-full h-2 mt-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            p.winProbability,
                            100
                          )}%`,
                        }}
                        transition={{ duration: 0.6 }}
                        className="bg-purple-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    {p.ticketsCount}
                  </p>
                  <p className="text-xs text-gray-300">
                    {p.winProbability.toFixed(2)}%
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
