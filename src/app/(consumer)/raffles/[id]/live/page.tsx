"use client";

import NavBar from "@/components/bars/NavBar";
import LiveRafflesShowcase from "@/components/consumer/raffles/LiveRafflesShowcase";
import LiveLeaderBoard from "@/components/consumer/raffles/LiveLeaderBoard";
import Footer from "@/components/Footer";

export default function LiveRafflesPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />

      {/* Encabezado institucional */}
      <section className="bg-white py-16 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900">
          Sorteos en Vivo
        </h1>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Sigue en tiempo real los sorteos activos y consulta el historial
          de resultados oficiales.
        </p>
      </section>

      {/* Rifas activas en vivo */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <LiveRafflesShowcase />
      </section>

      {/* Ranking / actividad */}
      <section className="bg-white py-16 border-t">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Actividad en Vivo
          </h2>

          <LiveLeaderBoard raffleId={1} />

        </div>
      </section>

      <Footer />
    </div>
  );
}
