"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRaffleById } from "@/services/raffleService";
import { RaffleResponseDTO } from "@/types/raffles/raffle.types";
import RaffleDetail from "@/components/consumer/raffles/RaffleDetail";
import Link from "next/link";

export default function RaffleDetailPage() {
  const params = useParams();
  const [raffle, setRaffle] = useState<RaffleResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    loadRaffle(Number(params.id));
  }, [params]);

  const loadRaffle = async (id: number) => {
    try {
      const data = await getRaffleById(id);
      setRaffle(data);
    } catch (error) {
      console.error("Error loading raffle", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div
          className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "#014C92", borderTopColor: "transparent" }}
        />
        <p className="text-gray-500 font-medium">Cargando rifa...</p>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-7xl mb-5">🎫</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Rifa no encontrada</h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          La rifa que buscas no existe o ya no está disponible.
        </p>
        <Link
          href="/raffles"
          className="text-white font-bold px-6 py-3 rounded-xl transition hover:opacity-90"
          style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
        >
          Ver todas las rifas
        </Link>
      </div>
    );
  }

  return <RaffleDetail raffle={raffle} />;
}
