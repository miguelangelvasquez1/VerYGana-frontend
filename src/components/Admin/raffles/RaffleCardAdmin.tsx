"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/generic/ConfirmDialog";
import {
    activateRaffle,
    closeRaffle,
    deleteRaffle,
    conductDraw,
    verifyDrawIntegrity,
} from "@/services/admin/AdminRaffleService";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";
import { useRouter } from "next/navigation";
import {
    Eye,
    BarChart3,
    Trash2,
    Dices,
    Play,
    Lock,
    ShieldCheck,
    RefreshCw,
} from "lucide-react";

interface Props {
    raffles: RaffleSummaryResponseDTO[];
    onRefresh: () => Promise<void>;
    onViewStats?: (raffle: RaffleSummaryResponseDTO) => void;
}

export default function RaffleCard({
                                       raffles,
                                       onRefresh,
                                       onViewStats,
                                   }: Props) {
    const router = useRouter();

    const [selectedRaffle, setSelectedRaffle] =
        useState<RaffleSummaryResponseDTO | null>(null);
    const [actionType, setActionType] = useState<
        "activate" | "close" | "delete" | "draw" | "verify" | null
    >(null);

    const closeDialog = () => {
        setSelectedRaffle(null);
        setActionType(null);
    };

    const handleAction = async () => {
        if (!selectedRaffle || !actionType) return;

        try {
            switch (actionType) {
                case "activate":
                    await activateRaffle(selectedRaffle.id);
                    toast.success("Rifa activada correctamente");
                    break;

                case "close":
                    await closeRaffle(selectedRaffle.id);
                    toast.success("Rifa cerrada correctamente");
                    break;

                case "delete":
                    await deleteRaffle(selectedRaffle.id);
                    toast.success("Rifa eliminada correctamente");
                    break;

                case "draw":
                    await conductDraw(selectedRaffle.id);
                    toast.success("Sorteo realizado correctamente");
                    break;

                case "verify":
                    const result = await verifyDrawIntegrity(selectedRaffle.id);
                    if (result) {
                        toast.success("Integridad verificada correctamente");
                    } else {
                        toast.error("El sorteo no pasó la verificación");
                    }
                    break;
            }
        } catch (err: any) {
            toast.error(getFriendlyErrorMessage(err));
        } finally {
            closeDialog();
            await onRefresh();
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
            ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
            CLOSED: "bg-rose-50 text-rose-700 border-rose-200",
            LIVE: "bg-purple-50 text-purple-700 border-purple-200 animate-pulse",
            DRAWING: "bg-amber-50 text-amber-700 border-amber-200",
            COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
            CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
            MISSED_DRAW: "bg-orange-50 text-orange-700 border-orange-200",
        };

        return (
            <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                    styles[status] || "bg-gray-100 text-gray-600 border-gray-200"
                }`}
            >
        {status}
      </span>
        );
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                        <th className="p-4">Título</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-center">Tickets</th>
                        <th className="p-4 text-center">Participantes</th>
                        <th className="p-4 text-center">Premios</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {raffles.map((raffle) => (
                        <tr
                            key={raffle.id}
                            className="hover:bg-gray-50/60 transition-colors"
                        >
                            <td className="p-4 font-semibold text-gray-900">
                                {raffle.title}
                            </td>
                            <td className="p-4 text-xs font-medium text-gray-500">
                                {raffle.raffleType}
                            </td>
                            <td className="p-4">{getStatusBadge(raffle.raffleStatus)}</td>
                            <td className="p-4 text-center text-gray-600">
                                {raffle.totalTicketsIssued}
                            </td>
                            <td className="p-4 text-center text-gray-600">
                                {raffle.totalParticipants}
                            </td>
                            <td className="p-4 text-center text-gray-600">{raffle.prizeCount}</td>

                            <td className="p-4 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                    {/* DRAFT -> Activar (Verde semántico suave y profesional) */}
                                    {raffle.raffleStatus === "DRAFT" && (
                                        <button
                                            onClick={() => {
                                                setSelectedRaffle(raffle);
                                                setActionType("activate");
                                            }}
                                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all"
                                        >
                                            <Play size={13} />
                                            Activar
                                        </button>
                                    )}

                                    {/* ACTIVE -> Cerrar (Ámbar semántico suave) */}
                                    {raffle.raffleStatus === "ACTIVE" && (
                                        <button
                                            onClick={() => {
                                                setSelectedRaffle(raffle);
                                                setActionType("close");
                                            }}
                                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all"
                                        >
                                            <Lock size={13} />
                                            Cerrar
                                        </button>
                                    )}

                                    {/* LIVE -> Sortear (Índigo/Morado armónico) */}
                                    {raffle.raffleStatus === "LIVE" && (
                                        <button
                                            onClick={() => {
                                                setSelectedRaffle(raffle);
                                                setActionType("draw");
                                            }}
                                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all"
                                        >
                                            <Dices size={13} />
                                            Sortear
                                        </button>
                                    )}

                                    {/* MISSED_DRAW -> Reactivar */}
                                    {raffle.raffleStatus === "MISSED_DRAW" && (
                                        <button
                                            onClick={() =>
                                                router.push(`/admin/raffles/${raffle.id}`)
                                            }
                                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-all"
                                        >
                                            <RefreshCw size={13} />
                                            Reactivar
                                        </button>
                                    )}

                                    {/* COMPLETED -> Verificar / Estadísticas */}
                                    {raffle.raffleStatus === "COMPLETED" && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedRaffle(raffle);
                                                    setActionType("verify");
                                                }}
                                                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all"
                                            >
                                                <ShieldCheck size={13} />
                                                Verificar
                                            </button>

                                            {onViewStats && (
                                                <button
                                                    onClick={() => onViewStats(raffle)}
                                                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all"
                                                >
                                                    <BarChart3 size={13} />
                                                    Estadísticas
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Ver (Secundario neutro) */}
                                    <button
                                        onClick={() =>
                                            router.push(`/admin/raffles/${raffle.id}`)
                                        }
                                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                                    >
                                        <Eye size={13} className="text-gray-400" />
                                        Ver
                                    </button>

                                    {/* Eliminar (Destructivo sutil) */}
                                    <button
                                        onClick={() => {
                                            setSelectedRaffle(raffle);
                                            setActionType("delete");
                                        }}
                                        className="cursor-pointer p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Eliminar rifa"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={!!selectedRaffle}
                title="Confirmar acción"
                description={
                    actionType === "delete"
                        ? "Esta acción eliminará la rifa permanentemente."
                        : actionType === "activate"
                            ? "La rifa pasará a estado ACTIVE."
                            : actionType === "close"
                                ? "La rifa pasará a estado CLOSED."
                                : actionType === "draw"
                                    ? "Se realizará el sorteo oficial."
                                    : "Se verificará la integridad del sorteo."
                }
                confirmText="Confirmar"
                variant="danger"
                requireTextConfirmation={
                    actionType === "delete" || actionType === "draw"
                }
                confirmationText={
                    actionType === "delete"
                        ? "ELIMINAR"
                        : actionType === "draw"
                            ? "SORTEAR"
                            : undefined
                }
                onConfirm={handleAction}
                onClose={closeDialog}
            />
        </>
    );
}
