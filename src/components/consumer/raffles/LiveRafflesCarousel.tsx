"use client";

import { useEffect, useState } from "react";
import { getLiveRaffles } from "@/services/raffleService";
import { RaffleSummaryResponseDTO, RaffleStatus } from "@/types/raffles/raffle.types";
import Link from "next/link";
import { Maximize2, X } from "lucide-react";

const AUTO_PLAY_INTERVAL = 5000;

export default function LiveRafflesCarousel() {
  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    loadRaffles();
  }, []);

  useEffect(() => {
    if (raffles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % raffles.length);
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [raffles]);

  const loadRaffles = async () => {
    try {
      const data = await getLiveRaffles();
      setRaffles(data);
    } catch (error) {
      console.error("Error loading live raffles", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (drawDate: string) => {
    const diff = new Date(drawDate).getTime() - new Date().getTime();

    if (diff <= 0) return "Iniciando...";

    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div
        className="w-full h-64 sm:h-80 md:h-105 rounded-2xl animate-pulse"
        style={{ background: "linear-gradient(135deg, #0b1440 0%, #03548C 50%, #0b1440 100%)" }}
      />
    );
  }

  if (raffles.length === 0) {
    return (
      <div
        className="relative w-full h-64 sm:h-80 md:h-105 rounded-2xl overflow-hidden shadow-xl flex flex-col items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg, #0b1440 0%, #03548C 50%, #0b1440 100%)" }}
      >
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative z-10 text-center px-8">
          <div className="text-5xl md:text-7xl mb-5">🎯</div>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm font-semibold tracking-widest">EN VIVO</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">No hay sorteos en vivo</h2>
          <p className="text-white/70 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
            Los sorteos en tiempo real aparecerán aquí cuando estén activos. ¡Vuelve pronto!
          </p>

          <div className="mt-7 flex gap-2.5 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  const raffle = raffles[currentIndex];
  const isLive = raffle.raffleStatus === RaffleStatus.LIVE;

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-105 rounded-2xl overflow-hidden shadow-xl">
      {/* Background image */}
      <img
        src={raffle.imageUrl}
        alt={raffle.title}
        className="w-full h-full object-cover"
      />

      {/* Fullscreen button */}
      <button
        onClick={() => setShowFullImage(true)}
        className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg transition"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isLive
            ? "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)"
            : "linear-gradient(to right, rgba(1,76,146,0.92) 0%, rgba(30,165,189,0.55) 55%, transparent 100%)",
        }}
      />

      {/* Mobile: bottom frosted card */}
      <div className="absolute inset-x-0 bottom-0 md:hidden">
        <div className="px-4 pt-3 pb-4 text-white">
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-red-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              EN VIVO
            </span>
          </div>

          <h2 className="text-base font-extrabold leading-tight mb-2 line-clamp-1">
            {raffle.title}
          </h2>

          <div className="flex flex-wrap gap-1.5 text-xs mb-3">
            <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-1 rounded-lg border border-white/20">
              👥 {raffle.totalParticipants} participantes
            </span>
            <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-1 rounded-lg border border-white/20">
              🎟️ {raffle.totalTicketsIssued} boletos
            </span>
            <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-1 rounded-lg border border-white/20">
              🏆 {raffle.prizeCount} premios
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-white/70 text-xs shrink-0">⏳ Inicia en:</span>
              <span className="text-yellow-400 text-sm font-bold truncate">
                {getTimeRemaining(raffle.drawDate)}
              </span>
            </div>

            <Link
              href={`/raffles/${raffle.id}/live`}
              className="shrink-0 inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-yellow-400/30 text-sm"
            >
              Ver sorteo →
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop: left side content */}
      <div className="absolute inset-0 hidden md:flex flex-col justify-center px-10 lg:px-12 text-white">
        {isLive ? (
          /* LIVE: text directly over image, drop-shadow for readability */
          <div className="max-w-sm lg:max-w-md">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-red-500/40">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                EN VIVO
              </span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
              {raffle.title}
            </h2>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
                👥 {raffle.totalParticipants} participantes
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
                🎟️ {raffle.totalTicketsIssued} boletos
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
                🏆 {raffle.prizeCount} premios
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-white/70 text-sm">⏳ Inicia en:</span>
              <span className="text-yellow-400 text-xl font-bold">
                {getTimeRemaining(raffle.drawDate)}
              </span>
            </div>

            <Link
              href={`/raffles/${raffle.id}/live`}
              className="mt-5 inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-7 py-3 rounded-xl w-fit transition-all shadow-lg shadow-yellow-400/30 text-base"
            >
              Ver sorteo →
            </Link>
          </div>
        ) : (
          /* Non-LIVE: text over the gradient overlay */
          <div className="max-w-lg">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-red-500/40">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                EN VIVO
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow-lg">
              {raffle.title}
            </h2>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
                👥 {raffle.totalParticipants} participantes
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
                🎟️ {raffle.totalTicketsIssued} boletos
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
                🏆 {raffle.prizeCount} premios
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span className="text-white/70 text-sm">⏳ Inicia en:</span>
              <span className="text-yellow-400 text-xl font-bold">
                {getTimeRemaining(raffle.drawDate)}
              </span>
            </div>

            <Link
              href={`/raffles/${raffle.id}/live`}
              className="mt-6 inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 rounded-xl w-fit transition-all shadow-lg shadow-yellow-400/30 text-base"
            >
              Ver sorteo →
            </Link>
          </div>
        )}
      </div>

      {/* Indicators — desktop only to avoid overlap with mobile bottom card */}
      {raffles.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden md:flex gap-2">
          {raffles.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-7 bg-yellow-400" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
      {showFullImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setShowFullImage(false)}
        >
          <div
            className="relative max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white text-sm hover:text-gray-300 transition"
            >
              <X className="w-5 h-5" />
              Cerrar
            </button>
            <img
              src={raffle.imageUrl}
              alt={raffle.title}
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
