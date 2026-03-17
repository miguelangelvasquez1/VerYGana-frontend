"use client";

import React, { useEffect, useState } from "react";
import { getRaffleStats } from "@/services/raffleService";
import { RaffleStatsResponseDTO } from "@/types/raffles/raffle.types";
import { motion } from "framer-motion";
import { Ticket, Users, DollarSign, BarChart3 } from "lucide-react";

interface Props {
  raffleId: number;
}

interface SourceConfig {
  key: string;
  label: string;
  color: string;
  max: number;
}

export default function RaffleStatsCasino({ raffleId }: Props) {
  const [stats, setStats] = useState<RaffleStatsResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getRaffleStats(raffleId);
        setStats(data);
      } catch (err) {
        console.error("Error loading stats", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [raffleId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        Cargando estadísticas...
      </div>
    );
  }

  if (!stats) return null;

  const sources: SourceConfig[] = [
    {
      key: "PURCHASE",
      label: "Compras",
      color: "from-green-400 to-green-600",
      max: stats.maxTicketsFromPurchases,
    },
    {
      key: "ADS_WATCHED",
      label: "Anuncios",
      color: "from-yellow-400 to-yellow-600",
      max: stats.maxTicketsFromAds,
    },
    {
      key: "GAME_ACHIEVEMENT",
      label: "Juegos",
      color: "from-purple-400 to-purple-600",
      max: stats.maxTicketsFromGames,
    },
    {
      key: "REFERRAL",
      label: "Referidos",
      color: "from-blue-400 to-blue-600",
      max: stats.maxTicketsFromReferrals,
    },
  ];

  const ticketsBySource = Object.fromEntries(stats.ticketsBySource || []);

  const totalTickets = Object.values(ticketsBySource).reduce(
    (acc: number, val: any) => acc + Number(val),
    0
  );

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-3xl p-10 shadow-2xl text-white space-y-10">
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 text-2xl font-bold">
        <BarChart3 className="text-green-400" />
        Estadísticas en Tiempo Real
      </div>

      {/* ================= DASHBOARD CARDS ================= */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <Ticket className="text-green-400 mb-2" />
          <p className="text-sm text-gray-400">
            Tickets Totales Emitidos
          </p>
          <p className="text-3xl font-extrabold">
            {totalTickets}
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <Users className="text-purple-400 mb-2" />
          <p className="text-sm text-gray-400">
            Participantes
          </p>
          <p className="text-3xl font-extrabold">
            —
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <DollarSign className="text-yellow-400 mb-2" />
          <p className="text-sm text-gray-400">
            Valor Total Premios
          </p>
          <p className="text-3xl font-extrabold">
            ${stats.totalPrizesValue}
          </p>
        </div>
      </div>

      {/* ================= BARRAS POR FUENTE ================= */}
      <div className="space-y-6">
        {sources.map((source, index) => {
          const current = Number(ticketsBySource[source.key] || 0);
          const percentage =
            source.max > 0 ? (current / source.max) * 100 : 0;
          const remaining = source.max - current;

          return (
            <div key={source.key}>
              <div className="flex justify-between mb-2 text-sm">
                <span className="font-semibold">
                  {source.label}
                </span>
                <span>
                  {current}/{source.max} • {remaining} restantes
                </span>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                  className={`bg-gradient-to-r ${source.color} h-6`}
                />
              </div>

              <div className="text-right text-xs text-gray-400 mt-1">
                {percentage.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
