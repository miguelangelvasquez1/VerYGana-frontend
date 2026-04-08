"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRaffleById } from "@/services/raffleService";
import { RaffleResponseDTO } from "@/types/raffles/raffle.types";
import RaffleDetail from "@/components/consumer/raffles/RaffleDetail";

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

  if (loading) return <div className="p-10">Cargando...</div>;
  if (!raffle) return <div className="p-10">Rifa no encontrada</div>;

  return <RaffleDetail raffle={raffle} />;
}