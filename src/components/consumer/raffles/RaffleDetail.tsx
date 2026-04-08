"use client";

import { RaffleResponseDTO } from "@/types/raffles/raffle.types";

interface Props {
  raffle: RaffleResponseDTO;
}

export default function RaffleDetail({ raffle }: Props) {
  const getProgress = () => {
    return Math.min(
      (raffle.totalTicketsIssued / raffle.maxTotalTickets) * 100,
      100
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Imagen principal */}
        <div className="relative">
          <img
            src={raffle.imageUrl}
            alt={raffle.title}
            className="w-full h-[420px] object-cover rounded-2xl shadow-lg"
          />

          <span className="absolute top-4 left-4 bg-yellow-500 text-black px-4 py-1 rounded-full font-bold text-sm">
            {raffle.raffleType}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {raffle.title}
            </h1>

            <p className="text-gray-600 mb-6">
              {raffle.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <p>👥 {raffle.totalParticipants} participantes</p>
              <p>🎟️ {raffle.totalTicketsIssued} tickets</p>
              <p>🏆 {raffle.prizes.length} premios</p>
              <p>📅 Sorteo: {new Date(raffle.drawDate).toLocaleDateString()}</p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {raffle.totalTicketsIssued} / {raffle.maxTotalTickets} tickets
              </p>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl text-lg transition">
            Participar ahora
          </button>
        </div>
      </div>

      {/* PREMIOS */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">🎁 Premios</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {raffle.prizes.map((prize) => (
            <div
              key={prize.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              <img
                src={prize.imageUrl}
                alt={prize.title}
                className="w-full h-40 object-cover"
              />

              <div className="p-4">
                <h3 className="font-semibold text-gray-900">
                  {prize.title}
                </h3>

                <p className="text-xs text-gray-500 line-clamp-2">
                  {prize.description}
                </p>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-yellow-600 font-bold">
                    ${prize.value.toLocaleString()}
                  </span>

                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    #{prize.position}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REGLAS */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">📜 Cómo participar</h2>

        <div className="space-y-3">
          {raffle.rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white p-4 rounded-xl shadow-sm text-sm"
            >
              🎯 {rule.ticketEarningRuleResponseDTO.ruleName}  
              (Máx: {rule.maxTicketsBySource})
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}