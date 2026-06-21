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

  const isPremium = raffle.raffleType === "PREMIUM";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO con gradiente de marca */}
      <div
        className="py-10"
        style={{
          background: isPremium
            ? "linear-gradient(135deg, #3b0764 0%, #7c3aed 40%, #014C92 100%)"
            : "linear-gradient(135deg, #014C92 0%, #1EA5BD 50%, #0369a1 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Imagen principal con glow */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-40"
              style={{ background: isPremium ? "#a855f7" : "#1EA5BD" }}
            />
            <img
              src={raffle.imageUrl}
              alt={raffle.title}
              className="relative w-full h-105 object-cover rounded-2xl shadow-2xl"
            />

            <span
              className="absolute top-4 left-4 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-lg"
              style={{
                background: isPremium
                  ? "linear-gradient(to right, #7c3aed, #a855f7)"
                  : "linear-gradient(to right, #014C92, #1EA5BD)",
              }}
            >
              {raffle.raffleType}
            </span>
          </div>

          {/* Info en tarjeta glass */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 flex flex-col justify-between text-white">
            <div>
              <h1 className="text-3xl font-bold mb-3 leading-tight">
                {raffle.title}
              </h1>

              <p className="text-white/75 text-sm mb-6 leading-relaxed">
                {raffle.description}
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-white/60 text-xs mb-1">Participantes</p>
                  <p className="font-bold text-lg">👥 {raffle.totalParticipants}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-white/60 text-xs mb-1">Tickets emitidos</p>
                  <p className="font-bold text-lg">🎟️ {raffle.totalTicketsIssued}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-white/60 text-xs mb-1">Premios</p>
                  <p className="font-bold text-lg">🏆 {raffle.prizes.length}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-white/60 text-xs mb-1">Fecha sorteo</p>
                  <p className="font-bold text-base">📅 {new Date(raffle.drawDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-white/60 mb-1.5">
                  <span>Tickets vendidos</span>
                  <span>{raffle.totalTicketsIssued} / {raffle.maxTotalTickets}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${getProgress()}%`,
                      background: "linear-gradient(to right, #fbbf24, #f59e0b)",
                    }}
                  />
                </div>
                <p className="text-xs text-white/50 mt-1">{getProgress().toFixed(0)}% completado</p>
              </div>
            </div>

            {/* CTA */}
            <button
              className="w-full font-bold py-4 rounded-xl text-lg transition hover:opacity-90 active:scale-95 shadow-lg mt-4"
              style={{
                background: "linear-gradient(to right, #fbbf24, #f59e0b)",
                color: "#000",
                boxShadow: "0 8px 24px rgba(251,191,36,0.35)",
              }}
            >
              Participar ahora
            </button>
          </div>
        </div>
      </div>

      {/* PREMIOS */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-1 h-8 rounded-full"
            style={{ background: "linear-gradient(to bottom, #014C92, #1EA5BD)" }}
          />
          <h2 className="text-2xl font-bold text-gray-900">🎁 Premios</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {raffle.prizes.map((prize) => (
            <div
              key={prize.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative">
                <img
                  src={prize.imageUrl}
                  alt={prize.title}
                  className="w-full h-44 object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 right-3 text-xs font-bold bg-yellow-400 text-black px-2.5 py-1 rounded-full shadow">
                  #{prize.position}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{prize.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{prize.description}</p>

                <div
                  className="inline-block px-3 py-1 rounded-lg text-sm font-bold text-white"
                  style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
                >
                  ${prize.value.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REGLAS */}
      <div className="max-w-7xl mx-auto px-6 pb-14">
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-1 h-8 rounded-full"
            style={{ background: "linear-gradient(to bottom, #7c3aed, #a855f7)" }}
          />
          <h2 className="text-2xl font-bold text-gray-900">📜 Cómo participar</h2>
        </div>

        <div className="space-y-3">
          {raffle.rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white p-4 rounded-xl shadow-sm text-sm border-l-4 flex items-center gap-3 hover:shadow-md transition"
              style={{ borderLeftColor: "#7c3aed" }}
            >
              <span className="text-lg">🎯</span>
              <div>
                <span className="font-semibold text-gray-800">
                  {rule.ticketEarningRuleResponseDTO.ruleName}
                </span>
                <span className="text-gray-500 ml-2 text-xs">
                  (Máx: {rule.maxTicketsBySource} tickets)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
