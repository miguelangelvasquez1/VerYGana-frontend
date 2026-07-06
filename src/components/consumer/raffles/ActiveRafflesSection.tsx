"use client";

import { useEffect, useState } from "react";
import { getActiveRaffles } from "@/services/raffleService";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import { PagedResponse } from "@/types/Generic.types";
import RaffleUserCard from "./RaffleUserCard";

type RaffleTypeFilter = "ALL" | "STANDARD" | "PREMIUM";

const filterButtonClass = (filter: RaffleTypeFilter, type: string) => {
  if (filter !== type) return "bg-gray-100 text-gray-600 hover:bg-gray-200";
  if (type === "STANDARD") return "bg-[#03548C] text-white shadow-md shadow-blue-200";
  if (type === "PREMIUM") return "bg-[#0b1440] text-white shadow-md shadow-slate-200";
  return "bg-[#FFD700] text-gray-900 shadow-md shadow-yellow-200";
};

export default function ActiveRafflesSection() {
  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<RaffleTypeFilter>("ALL");

  useEffect(() => {
    loadRaffles();
  }, [page, filter]);

  const loadRaffles = async () => {
    setLoading(true);
    try {
      const type = filter === "ALL" ? "" : filter;

      const response: PagedResponse<RaffleSummaryResponseDTO> =
        await getActiveRaffles(type, page);

      setRaffles(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error("Error loading active raffles", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type: RaffleTypeFilter) => {
    setFilter(type);
    setPage(0);
  };

  return (
    <div>
      {/* Header + filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-8 rounded-full"
            style={{ background: "linear-gradient(to bottom, #0b1440, #03548C)" }}
          />
          <h2 className="text-2xl font-bold text-gray-900">
            Rifas disponibles
          </h2>
        </div>

        <div className="flex gap-2">
          {(["ALL", "STANDARD", "PREMIUM"] as RaffleTypeFilter[]).map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filterButtonClass(filter, type)}`}
            >
              {type === "ALL" ? "Todas" : type === "STANDARD" ? "Estándar" : "Premium"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-80 animate-pulse"
              style={{ background: "linear-gradient(135deg, #e8f0fe, #dbeafe)" }}
            />
          ))}
        </div>
      ) : raffles.length === 0 ? (
        <div
          className="relative rounded-2xl overflow-hidden py-20 flex flex-col items-center justify-center text-center px-6"
          style={{ background: "linear-gradient(135deg, #0b1440 0%, #03548C 50%, #0b1440 100%)" }}
        >
          {/* Decorative */}
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-bold text-white mb-2">
              No hay rifas disponibles
            </h3>
            <p className="text-white/70 text-sm max-w-xs mx-auto">
              {filter === "ALL"
                ? "Por el momento no hay rifas activas. ¡Vuelve pronto para participar!"
                : `No hay rifas ${filter === "STANDARD" ? "estándar" : "premium"} disponibles en este momento.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {raffles.map((raffle) => (
            <RaffleUserCard key={raffle.id} raffle={raffle} />
          ))}
        </div>
      )}

      {/* Paginador */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 gap-3">
          <button
            disabled={page === 0}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 font-semibold transition"
          >
            ←
          </button>

          {[...Array(totalPages)].slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-lg font-semibold text-sm transition ${
                page === i
                  ? "text-gray-900 shadow-md shadow-yellow-200 bg-[#FFD700]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages - 1}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 font-semibold transition"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
