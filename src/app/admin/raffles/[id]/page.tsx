"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import RaffleDetailCard from "@/components/admin/raffles/RaffleDetailCard";
import { RaffleResponseDTO } from "@/types/raffles/raffle.types";
import {
    getRaffleById,
    conductDraw,
    cancelRaffle,
} from "@/services/admin/AdminRaffleService";
import AdminLayout from "@/components/admin/AdminLayout";

export default function RaffleDetailPage() {
    const params = useParams();
    const router = useRouter();

    const raffleId = Number(params.id);

    const [raffle, setRaffle] = useState<RaffleResponseDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRaffle = async () => {
        try {
            setLoading(true);
            const response = await getRaffleById(raffleId);
            setRaffle(response);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Error al cargar la información de la rifa"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!raffleId || isNaN(raffleId)) {
            setError("ID de rifa inválido");
            setLoading(false);
            return;
        }
        fetchRaffle();
    }, [raffleId]);

    const handleDraw = async (id: number) => {
        try {
            await conductDraw(id);
            toast.success("Sorteo realizado correctamente");
            await fetchRaffle();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ||
                "Error al realizar el sorteo"
            );
        }
    };

    const handleCancel = async (id: number) => {
        await cancelRaffle(id);
        toast.success("Rifa cancelada correctamente");
        await fetchRaffle();
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse bg-white rounded-2xl h-96 shadow-md" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-red-600 font-semibold">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg"
                >
                    Volver
                </button>
            </div>
        );
    }

    if (!raffle) return null;

    return (
    <AdminLayout>
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <RaffleDetailCard
                    raffle={raffle}
                    onDraw={handleDraw}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    </AdminLayout>
);


}
