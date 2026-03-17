"use client";

import React, { useEffect, useState } from "react";
import { getRaffleById } from "@/services/raffleService";
import { RaffleResponseDTO } from "@/types/raffles/raffle.types";
import LiveLeaderboard from "./LiveLeaderBoard";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Calendar,
  Users,
  Ticket,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";

interface Props {
  raffleId: number;
}

export default function RaffleDetailExperience({ raffleId }: Props) {
  const [raffle, setRaffle] = useState<RaffleResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const loadRaffle = async () => {
      try {
        const data = await getRaffleById(raffleId);
        setRaffle(data);
      } catch (err) {
        console.error("Error loading raffle", err);
      } finally {
        setLoading(false);
      }
    };

    loadRaffle();
  }, [raffleId]);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400">
        Cargando experiencia...
      </div>
    );

  if (!raffle) return null;

  const progress =
    (raffle.totalTicketsIssued / raffle.maxTotalTickets) * 100;

  const mainPrize = raffle.prizes?.[0];

  return (
    <div className="space-y-16 text-white">
      {/* ================= HERO ================= */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-black via-gray-900 to-black">
        <img
          src={
            mainPrize?.imageUrl ||
            "https://images.unsplash.com/photo-1607083206968-13611e3d76db"
          }
          alt={mainPrize?.title}
          className="w-full h-[400px] object-cover opacity-70"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent p-10 flex flex-col justify-end">
          <h1 className="text-4xl font-extrabold mb-4">
            {raffle.title}
          </h1>

          <p className="text-lg text-gray-300 max-w-2xl">
            {raffle.description}
          </p>

          {mainPrize && (
            <div className="mt-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-xl w-fit font-bold text-xl shadow-lg">
              🎁 Premio: ${mainPrize.value}
            </div>
          )}
        </div>
      </div>

      {/* ================= PROGRESO GIGANTE ================= */}
      <div className="bg-gray-900 rounded-3xl p-10 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Ticket className="text-green-400" />
          Progreso de la Rifa
        </h2>

        <div className="w-full bg-gray-700 rounded-full h-8 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
            className="bg-gradient-to-r from-green-400 to-green-600 h-8"
          />
        </div>

        <div className="flex justify-between mt-4 text-sm text-gray-300">
          <span>
            🎟 {raffle.totalTicketsIssued} emitidos
          </span>
          <span>
            🎯 {raffle.maxTotalTickets} máximos
          </span>
        </div>
      </div>

      {/* ================= LEADERBOARD ================= */}
      <LiveLeaderboard raffleId={raffleId} />

      {/* ================= ESTADÍSTICAS ================= */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <Users className="text-purple-400 mb-2" />
          <p className="text-sm text-gray-400">
            Participantes
          </p>
          <p className="text-2xl font-bold">
            {raffle.totalParticipants}
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <Calendar className="text-blue-400 mb-2" />
          <p className="text-sm text-gray-400">
            Fecha de sorteo
          </p>
          <p className="text-lg font-semibold">
            {new Date(raffle.drawDate).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
          <ShieldCheck className="text-green-400 mb-2" />
          <p className="text-sm text-gray-400">
            Método
          </p>
          <p className="font-semibold">
            {raffle.drawMethod === "RANDOM_ORG"
              ? "Random.org verificado"
              : "Sistema interno seguro"}
          </p>
        </div>
      </div>

      {/* ================= MÉTODO + PROOF ================= */}
      <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl shadow-2xl">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Lock className="text-green-400" />
          Transparencia del Sorteo
        </h2>

        <p className="text-gray-400 mb-4">
          Método utilizado:{" "}
          <span className="font-semibold text-white">
            {raffle.drawMethod}
          </span>
        </p>

      </div>

      {/* ================= TÉRMINOS ================= */}
      <div className="bg-gray-900 rounded-3xl p-6 shadow-xl">
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="flex justify-between w-full items-center text-lg font-semibold"
        >
          📜 Términos y Condiciones
          {showTerms ? <ChevronUp /> : <ChevronDown />}
        </button>

        {showTerms && (
          <div className="mt-4 text-sm text-gray-400 whitespace-pre-line">
            {raffle.termsAndConditions}
          </div>
        )}
      </div>
    </div>
  );
}
