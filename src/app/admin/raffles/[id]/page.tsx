"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import RaffleDetailCard from "@/components/admin/raffles/RaffleDetailAdmin";
import { RaffleResponseDTO, UpdateRaffleRequestDTO } from "@/types/raffles/raffle.types";
import {
    conductDraw,
    cancelRaffle,
    updateRaffle,
    activateRaffle,
    deleteRaffle,
} from "@/services/admin/AdminRaffleService";
import { getRaffleById } from "@/services/raffleService";
import AdminLayout from "@/components/admin/AdminLayout";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

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
            setError(null);
        } catch (err: any) {
            const friendlyMessage = getFriendlyErrorMessage(err);
            setError(friendlyMessage);
            // También mostrar toast con el mensaje amigable
            toast.error(friendlyMessage);
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
            const friendlyMessage = getFriendlyErrorMessage(err);
            toast.error(friendlyMessage);
        }
    };

    const handleCancel = async (id: number) => {
        try {
            await cancelRaffle(id);
            toast.success("Rifa cancelada correctamente");
            await fetchRaffle();
        } catch (err: any) {
            const friendlyMessage = getFriendlyErrorMessage(err);
            toast.error(friendlyMessage);
        }
    };

    const handleActivate = async (id: number) => {
        try {
            await activateRaffle(id);
            toast.success("Rifa reactivada correctamente");
            await fetchRaffle();
        } catch (err: any) {
            const friendlyMessage = getFriendlyErrorMessage(err);
            toast.error(friendlyMessage);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteRaffle(id);
            toast.success("Rifa eliminada correctamente");
            router.push("/admin/raffles");
        } catch (err: any) {
            const friendlyMessage = getFriendlyErrorMessage(err);
            toast.error(friendlyMessage);
        }
    };

    const handleUpdate = async (id: number, data: UpdateRaffleRequestDTO) => {
        try {
            await updateRaffle(id, data);
            toast.success("Rifa actualizada correctamente");
            await fetchRaffle();
        } catch (err: any) {
            const friendlyMessage = getFriendlyErrorMessage(err);
            toast.error(friendlyMessage);
            throw err;
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-gray-50 p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="animate-pulse bg-white rounded-2xl h-96 shadow-md" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-gray-50 p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white rounded-2xl p-8 shadow-md text-center space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Error al cargar la rifa</h2>
                                    <p className="text-gray-600 mt-2 max-w-md">{error}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => fetchRaffle()}
                                        className="cursor-pointer px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                                    >
                                        Reintentar
                                    </button>
                                    <button
                                        onClick={() => router.back()}
                                        className="cursor-pointer px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
                                    >
                                        Volver
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!raffle) return null;

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <RaffleDetailCard
                        raffle={raffle}
                        onClose={() => router.push("/admin/raffles")}
                        onDraw={handleDraw}
                        onCancel={handleCancel}
                        onUpdate={handleUpdate}
                        onActivate={handleActivate}
                        onDelete={handleDelete}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}