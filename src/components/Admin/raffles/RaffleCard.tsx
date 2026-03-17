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
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

interface Props {
  raffles: RaffleSummaryResponseDTO[];
  onRefresh: () => Promise<void>;
}

export default function RaffleCard({ raffles, onRefresh }: Props) {
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

    await onRefresh();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-200 text-gray-800",
      ACTIVE: "bg-green-100 text-green-700",
      CLOSED: "bg-red-100 text-red-700",
      DRAWING: "bg-yellow-100 text-yellow-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-gray-300 text-gray-900",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Título</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Tickets</th>
              <th className="p-4">Participantes</th>
              <th className="p-4">Premios</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {raffles.map((raffle) => (
              <tr key={raffle.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{raffle.title}</td>
                <td className="p-4">{raffle.raffleType}</td>
                <td className="p-4">
                  {getStatusBadge(raffle.raffleStatus)}
                </td>
                <td className="p-4">{raffle.totalTicketsIssued}</td>
                <td className="p-4">{raffle.totalParticipants}</td>
                <td className="p-4">{raffle.prizeCount}</td>

                <td className="p-4 text-right space-x-3">

                  {/* 👁 VER */}
                  <button
                    onClick={() =>
                      router.push(`/admin/raffles/${raffle.id}`)
                    }
                    className="text-gray-600 hover:text-black inline-flex items-center gap-1"
                  >
                    <Eye size={16} />
                    Ver
                  </button>

                  {raffle.raffleStatus === "DRAFT" && (
                    <button
                      onClick={() => {
                        setSelectedRaffle(raffle);
                        setActionType("activate");
                      }}
                      className="text-green-600 hover:underline"
                    >
                      Activar
                    </button>
                  )}

                  {raffle.raffleStatus === "ACTIVE" && (
                    <button
                      onClick={() => {
                        setSelectedRaffle(raffle);
                        setActionType("close");
                      }}
                      className="text-yellow-600 hover:underline"
                    >
                      Cerrar
                    </button>
                  )}

                  {raffle.raffleStatus === "CLOSED" && (
                    <button
                      onClick={() => {
                        setSelectedRaffle(raffle);
                        setActionType("draw");
                      }}
                      className="text-purple-600 hover:underline"
                    >
                      Sortear
                    </button>
                  )}

                  {raffle.raffleStatus === "COMPLETED" && (
                    <button
                      onClick={() => {
                        setSelectedRaffle(raffle);
                        setActionType("verify");
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Verificar
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRaffle(raffle);
                      setActionType("delete");
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
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
