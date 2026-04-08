"use client";

import { useEffect, useState } from "react";
import { getLiveRaffles } from "@/services/raffleService";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import Link from "next/link";

const AUTO_PLAY_INTERVAL = 5000;

export default function LiveRafflesCarousel() {
  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
      <div className="w-full h-[420px] bg-gray-200 animate-pulse rounded-2xl" />
    );
  }

  if (raffles.length === 0) return null;

  const raffle = raffles[currentIndex];

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden shadow-lg">
      {/* Imagen fondo */}
      <img
        src={raffle.imageUrl}
        alt={raffle.title}
        className="w-full h-full object-cover"
      />

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

      {/* Contenido */}
      <div className="absolute inset-0 flex flex-col justify-center px-10 text-white">
        <span className="text-2xl bg-red-500 text-white px-3 py-1 rounded-full w-fit mb-3 font-semibold">
         en vivo
        </span>

        <h2 className="text-4xl md:text-5xl font-extrabold max-w-2xl leading-tight">
          {raffle.title}
        </h2>

        <div className="mt-4 space-y-1 text-sm text-gray-200">
          <p>👥 {raffle.totalParticipants} participantes</p>
          <p>🎟️ {raffle.totalTicketsIssued} boletos generados</p>
          <p>🏆 {raffle.prizeCount} premios</p>
        </div>

        {/* Countdown */}
        <div className="mt-6 text-lg font-semibold">
          ⏳ Inicia en:{" "}
          <span className="text-yellow-400">
            {getTimeRemaining(raffle.drawDate)}
          </span>
        </div>

        {/* CTA */}
        <Link
          href={`/raffles/${raffle.id}/live`}
          className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-2 rounded-xl w-fit transition">
          Ver sorteo
        </Link>
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {raffles.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-yellow-400" : "bg-white/50"
              }`}
          />
        ))}
      </div>
    </div>
  );
}