"use client";

import { useEffect, useState } from "react";
import { getActiveRaffles } from "@/services/raffleService";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import { PagedResponse } from "@/types/GenericTypes";
import RaffleCard from "./RaffleCard";

type RaffleTypeFilter = "ALL" | "STANDARD" | "PREMIUM";

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
        setPage(0); // reset paginación
    };

    return (
        <div>
            {/* Header + filtros */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    Rifas disponibles
                </h2>

                <div className="flex gap-2">
                    {["ALL", "STANDARD", "PREMIUM"].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange(type as RaffleTypeFilter)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filter === type
                                    ? "bg-yellow-500 text-black"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            {type === "ALL"
                                ? "Todas"
                                : type === "STANDARD"
                                    ? "Estándar"
                                    : "Premium"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <p className="text-center text-gray-500">Cargando rifas...</p>
            ) : raffles.length === 0 ? (
                <p className="text-center text-gray-500">
                    No hay rifas disponibles.
                </p>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {raffles.map((raffle) => (
                        <RaffleCard key={raffle.id} raffle={raffle} />
                    ))}
                </div>
            )}

            {/* Paginador */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-10 gap-2">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
                    >
                        ← Anterior
                    </button>

                    <span className="text-sm text-gray-600">
                        Página {page + 1} de {totalPages}
                    </span>

                    <button
                        disabled={page === totalPages - 1}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-50"
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}