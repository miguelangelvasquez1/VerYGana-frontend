"use client";

import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";

import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import {
  countRafflesByStatus,
  prepareRaffleCreation,
  confirmRaffleCreation,
} from "@/services/admin/AdminRaffleService";
import { getRafflesByStatusAndType } from "@/services/raffleService";
import { fileUploadService } from "@/services/FileUploadService";

import RaffleCard from "@/components/admin/raffles/RaffleCardAdmin";
import CreateRaffleForm, {
  CreateRaffleFormSubmitPayload,
} from "@/components/admin/raffles/CreateRaffleForm";

export default function AdminRafflesDashboard() {
  /* ================== STATE ================== */

  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showCreateRaffle, setShowCreateRaffle] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [typeFilter, setTypeFilter] = useState("STANDARD");

  const [stats, setStats] = useState({
    draftRaffles: 0,
    activeRaffles: 0,
    closedRaffles: 0,
    completedRaffles: 0,
  });

  /* ================== LOAD DATA ================== */

  const loadStats = async () => {
    const [
      draftRaffles,
      activeRaffles,
      closedRaffles,
      completedRaffles,
    ] = await Promise.all([
      countRafflesByStatus("DRAFT"),
      countRafflesByStatus("ACTIVE"),
      countRafflesByStatus("CLOSED"),
      countRafflesByStatus("COMPLETED"),
    ]);

    setStats({
      draftRaffles,
      activeRaffles,
      closedRaffles,
      completedRaffles,
    });
  };

  const loadRaffles = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getRafflesByStatusAndType(
        statusFilter,
        typeFilter
      );

      setRaffles(response?.data ?? []);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar rifas");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    await Promise.all([loadStats(), loadRaffles()]);
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadRaffles();
  }, [statusFilter, typeFilter]);

  /* ================== ORQUESTADOR CREATE RAFFLE ================== */
  const handleCreateRaffle = async (
    payload: CreateRaffleFormSubmitPayload
  ) => {
    const loadingToast = toast.loading("Creando rifa...");

    try {
      const { raffleData, raffleImageFile, prizeImageFiles } = payload;

      // 🔹 STEP 1 — PREPARE
      const prepareRequest = {
        raffleData,
        raffleImageMetadata: buildFileMetadata(raffleImageFile),
        prizeImageMetadataList: prizeImageFiles.map(buildFileMetadata),
      };

      const prepareResponse = await prepareRaffleCreation(
        prepareRequest
      );

      // En handleCreateRaffle, antes del STEP 2
      console.log('raffleImageFile size:', raffleImageFile.size);
      prizeImageFiles.forEach((f, i) =>
        console.log(`prize[${i}] size:`, f.size, 'type:', f.type)
      );

      // 🔹 STEP 2 — UPLOADS
      await Promise.all([
        fileUploadService.uploadToR2(
          prepareResponse.raffleImagePermission.uploadUrl,
          raffleImageFile
        ),
        ...prepareResponse.prizeUploadSlots.map((slot) =>
          fileUploadService.uploadToR2(
            slot.permission.uploadUrl,
            prizeImageFiles[slot.prizeIndex]
          )
        ),
      ]);

      // 🔹 STEP 3 — CONFIRM
      const confirmRequest = {
        raffleAssetId: prepareResponse.raffleAssetId,
        prizeAssetIds: prepareResponse.prizeUploadSlots
          .sort((a, b) => a.prizeIndex - b.prizeIndex)
          .map((s) => s.prizeAssetId),
        raffleData,
      };

      const result = await confirmRaffleCreation(confirmRequest);

      toast.dismiss(loadingToast);
      toast.success("🎉 Rifa creada exitosamente");

      setShowCreateRaffle(false);
      await loadDashboardData();

      return result;
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err?.response?.data?.message || "Error al crear la rifa");
      throw err;
    }
  };

  /* ================== HELPERS ================== */

  const buildFileMetadata = (file: File) => ({
    originalFileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  });

  /* ================== RENDER ================== */

  if (isLoading && raffles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadRaffles}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* ===== Header ===== */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Gestión de Rifas
          </h2>
          <p className="text-gray-600">
            Administra rifas, visualiza estadísticas y controla el ciclo de vida de cada una.
          </p>
        </div>

        <button
          onClick={() => setShowCreateRaffle(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Crear Rifa
        </button>
      </div>

      {/* ===== Stats ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Borradores"
          value={stats.draftRaffles}
          color="yellow"
        />
        <StatCard
          label="Rifas activas"
          value={stats.activeRaffles}
          color="green"
        />
        <StatCard
          label="Rifas cerradas"
          value={stats.closedRaffles}
          color="blue"
        />
        <StatCard
          label="Finalizadas"
          value={stats.completedRaffles}
          color="gray"
        />
      </div>

      {/* ===== FILTROS ===== */}
      <h3 className="text-lg font-semibold ml-2">Filtros</h3>
      <div className="flex gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Estado</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-1 rounded-lg"
          >
            <option value="DRAFT">Borradores</option>
            <option value="ACTIVE">Activas</option>
            <option value="CLOSED">Cerradas</option>
            <option value="LIVE">En vivo</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Tipo</p>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            <option value="STANDARD">Estándar</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </div>
      </div>

      {/* ===== RaffleCard ===== */}
      <RaffleCard raffles={raffles} onRefresh={loadDashboardData} />

      {/* ===== MODAL ===== */}
      {showCreateRaffle && (
        <Modal onClose={() => setShowCreateRaffle(false)}>
          <CreateRaffleForm onSubmit={handleCreateRaffle} />
        </Modal>
      )}
    </div>
  );
}

/* ================== MODAL ================== */

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full relative shadow-lg overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "gray";
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    gray: "from-gray-600 to-gray-700",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 text-white`}
    >
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
