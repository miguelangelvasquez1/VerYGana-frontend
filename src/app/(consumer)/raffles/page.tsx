"use client";

import { Gift } from "lucide-react";
import LiveRafflesCarousel from "@/components/consumer/raffles/LiveRafflesCarousel";
import ActiveRafflesSection from "@/components/consumer/raffles/ActiveRafflesSection";
import LastRafflesResultsPanel from "@/components/consumer/raffles/LastRafflesResultsPanel";
import LastWinnersPanel from "@/components/consumer/raffles/LastWinnersPanel";

export default function RafflesPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* ══════════════ HERO ══════════════ */}
      <section
        className="relative overflow-hidden text-white bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440]"
        style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative w-full px-6 sm:px-8 lg:px-10 pt-8 pb-14 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Gift className="w-3.5 h-3.5 text-[#FFD700]" />
            Compra boletos y gana premios increíbles
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight">
            Participa en rifas
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-lg mx-auto">
            Usa tus llaves para participar y ganar premios en efectivo y productos exclusivos.
          </p>
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-0">
          <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ══════════════ CONTENT ══════════════ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6 max-w-full">

          {/* Main */}
          <main className="flex-1 min-w-0 space-y-10">
            <LiveRafflesCarousel />
            <ActiveRafflesSection />
          </main>

          {/* Sidebar */}
          <aside className="hidden xl:block w-[320px] shrink-0">
            <div className="sticky top-24 space-y-4">
              <LastRafflesResultsPanel />
              <LastWinnersPanel />
            </div>
          </aside>

        </div>
      </div>

    </div>
  );
}
