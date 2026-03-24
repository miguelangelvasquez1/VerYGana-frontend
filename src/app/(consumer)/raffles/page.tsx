"use client";

import NavBar from "@/components/bars/NavBar";
import Footer from "@/components/Footer";
import LiveRafflesCarousel from "@/components/consumer/raffles/LiveRafflesCarousel";
import ActiveRafflesSection from "@/components/consumer/raffles/ActiveRafflesSection";
import LastRafflesResultsPanel from "@/components/consumer/raffles/LastRafflesResultsPanel";
import LastWinnersPanel from "@/components/consumer/raffles/LastWinnersPanel";

export default function RafflesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      {/* Layout principal */}
      <section className="max-w-7xl mx-auto px-6 py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* IZQUIERDA (70%) */}
          <div className="lg:col-span-2 flex flex-col gap-10">

            {/* Carrusel LIVE */}
            <LiveRafflesCarousel />

            {/* Rifas activas */}
            <ActiveRafflesSection />

          </div>

          {/* DERECHA (30%) */}
          <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">

            {/* Resultados */}
            <LastRafflesResultsPanel />
            
            {/* Ganadores */}
            <LastWinnersPanel />

          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}