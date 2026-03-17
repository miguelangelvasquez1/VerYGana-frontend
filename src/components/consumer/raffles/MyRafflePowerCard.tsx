"use client";

import React, { useEffect, useState } from "react";
import { Ticket, Zap, Gift, Gamepad2, Users, ShoppingBag } from "lucide-react";
import * as raffleTicketService from "@/services/raffleService";

interface MyRafflePowerCardProps {
  raffleId?: number; // opcional si quieres balance por rifa específica
}

const MyRafflePowerCard: React.FC<MyRafflePowerCardProps> = ({ raffleId }) => {
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);

        let total = 0;

        if (raffleId) {
          total = await raffleTicketService.getUserTicketBalanceByRaffle();
        } else {
          total = await raffleTicketService.getUserTotalTickets("ACTIVE");
        }

        setTotalTickets(total);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [raffleId]);

  const hasTickets = totalTickets > 0;

  const getLevelBadge = () => {
    if (totalTickets >= 25)
      return "🔥 Nivel Pro";
    if (totalTickets >= 10)
      return "🎯 Jugador serio";
    if (totalTickets > 0)
      return "🎟 En juego";
    return null;
  };

  return (
    <div
      className={`
        relative rounded-2xl p-6 transition-all duration-300
        ${hasTickets 
          ? "border-2 border-green-400 shadow-[0_0_25px_rgba(34,197,94,0.7)] bg-gradient-to-br from-gray-900 to-black"
          : "bg-gray-800 border border-gray-600"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="text-green-400" />
          <h2 className="text-lg font-bold text-white">
            Tu Poder en la Rifa
          </h2>
        </div>

        {getLevelBadge() && (
          <span className="text-xs bg-yellow-500 text-black px-3 py-1 rounded-full font-bold animate-pulse">
            {getLevelBadge()}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-gray-400 animate-pulse">Cargando tickets...</div>
      ) : hasTickets ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-extrabold text-green-400">
              {totalTickets}
            </span>
            <span className="text-gray-300 text-sm">
              Tickets Activos
            </span>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            💡 Cuantos más tickets tengas, más probabilidades tienes de ganar.
          </p>

          {/* Motivadores */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-yellow-400" />
              Gana más viendo anuncios
            </div>

            <div className="flex items-center gap-2">
              <Gift size={14} className="text-pink-400" />
              Dale like y participa
            </div>

            <div className="flex items-center gap-2">
              <Gamepad2 size={14} className="text-purple-400" />
              Juega y desbloquea tickets
            </div>

            <div className="flex items-center gap-2">
              <Users size={14} className="text-blue-400" />
              Invita amigos y gana más
            </div>

            <div className="flex items-center gap-2">
              <ShoppingBag size={14} className="text-green-400" />
              Compra productos y suma poder
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-center py-4">
            <h3 className="text-xl font-bold text-white mb-2">
              ⚡ No te quedes fuera
            </h3>

            <p className="text-gray-400 text-sm mb-4">
              Estás a un paso de ganar premios increíbles.
            </p>

            <button
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 
                         text-black font-bold shadow-lg hover:scale-105 transition"
            >
              🎟 Consigue tu primer ticket ahora
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MyRafflePowerCard;
