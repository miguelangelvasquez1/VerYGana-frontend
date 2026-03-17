"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/bars/NavBar";
import WinnersCarousel from "@/components/consumer/raffles/WinnersCarousel";
import MyRafflePowerCard from "@/components/consumer/raffles/MyRafflePowerCard";
import RaffleStatsCasino from "@/components/consumer/raffles/RaffleStatsCasino";
import Footer from "@/components/Footer";
import { getRafflesByStatusAndType } from "@/services/raffleService";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";

export default function RafflesPage() {
  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const response = await getRafflesByStatusAndType("ACTIVE");
      setRaffles(response.data); // 👈 AQUÍ está la corrección
    } catch (error) {
      console.error("Error loading raffles", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      {raffles.length > 0 && (
        <WinnersCarousel raffleId={raffles[0].id} />
      )}


      {/* Hero institucional limpio */}
      <section className="text-center py-16 px-6 bg-white shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900">
          Participa en sorteos transparentes y verificados
        </h1>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Cada rifa es auditada y los resultados se publican en tiempo real.
          Compra tu ticket y participa con total confianza.
        </p>
      </section>

      {/* Grid profesional de rifas */}
      <section className="max-w-7xl mx-auto px-6 py-16 flex-1">
        {loading ? (
          <p className="text-center text-gray-500">Cargando rifas...</p>
        ) : raffles.length === 0 ? (
          <p className="text-center text-gray-500">
            No hay rifas disponibles actualmente.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {raffles.map((raffle) => (
              <MyRafflePowerCard key={raffle.id} raffleId={raffle.id} />
            ))}

          </div>
        )}
      </section>

      {/* Sección institucional opcional */}
      <section className="bg-white py-16 border-t">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Transparencia y Estadísticas
          </h2>

          {/* Puedes pasarle datos globales o de una rifa destacada */}
          {raffles.length > 0 && (
            <RaffleStatsCasino raffleId={raffles[0].id} />
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
