"use client";

import { useEffect, useState } from "react";
import { getActiveRaffles } from "@/services/raffleService";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import { PagedResponse } from "@/types/Generic.types";
import RaffleUserCard from "./RaffleUserCard";

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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Rifas disponibles
                </h2>

                <div className="flex gap-2">
                    {["ALL", "STANDARD", "PREMIUM"].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange(type as RaffleTypeFilter)}
                            className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold transition ${filter === type
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
                        className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        ←
                    </button>

                    {[...Array(totalPages)].slice(0, 5).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`w-9 h-9 rounded-lg ${page === i ? "bg-yellow-500 text-black" : "bg-gray-200"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        disabled={page === totalPages - 1}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        →
                    </button>

                </div>
            )}
        </div>
    );
}