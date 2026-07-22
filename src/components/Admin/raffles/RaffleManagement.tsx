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
import { getRafflesByFilters } from "@/services/raffleService";
import { fileUploadService } from "@/services/FileUploadService";
import { useAdminSectionSearch } from "@/context/AdminSearchContext";

import RaffleCard from "@/components/admin/raffles/RaffleCardAdmin";
import CreateRaffleForm, {
  CreateRaffleFormSubmitPayload,
} from "@/components/admin/raffles/CreateRaffleForm";

const PAGE_SIZE = 10;

interface Props {
  onViewStats?: (raffle: RaffleSummaryResponseDTO) => void;
}

export default function AdminRafflesDashboard({ onViewStats }: Props) {
  /* ================== STATE ================== */

  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showCreateRaffle, setShowCreateRaffle] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [drawDateFilter, setDrawDateFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { searchTerm } = useAdminSectionSearch("Buscar rifas por título...");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const [stats, setStats] = useState({
    draftRaffles: 0,
    activeRaffles: 0,
    liveRaffles: 0,
    closedRaffles: 0,
    completedRaffles: 0,
  });

  /* ================== LOAD DATA ================== */

  const loadStats = async () => {
    const [
      draftRaffles,
      activeRaffles,
      liveRaffles,
      closedRaffles,
      completedRaffles,
    ] = await Promise.all([
      countRafflesByStatus("DRAFT"),
      countRafflesByStatus("ACTIVE"),
      countRafflesByStatus("LIVE"),
      countRafflesByStatus("CLOSED"),
      countRafflesByStatus("COMPLETED"),
    ]);

    setStats({
      draftRaffles,
      activeRaffles,
      liveRaffles,
      closedRaffles,
      completedRaffles,
    });
  };

  const loadRaffles = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getRafflesByFilters(
        statusFilter || undefined,
        debouncedSearch || undefined,
        drawDateFilter || undefined,
        typeFilter || undefined,
        PAGE_SIZE,
        page
      );

      setRaffles(response?.data ?? []);
      setTotalPages(response?.meta?.totalPages ?? 0);
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
  }, [statusFilter, typeFilter, drawDateFilter, debouncedSearch, page]);

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
      <div className="flex justify-between items-center">
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
          label="Rifas en vivo"
          value={stats.liveRaffles}
          color="red"
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

      <div className="flex gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Estado</p>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="border px-3 py-1 rounded-lg"
          >
            <option value="">Todos</option>
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
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            className="border px-3 py-2 rounded-lg"
          >
            <option value="">Todos</option>
            <option value="STANDARD">Estándar</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Fecha de sorteo</p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={drawDateFilter}
              onChange={(e) => {
                setDrawDateFilter(e.target.value);
                setPage(0);
              }}
              className="border px-3 py-1 rounded-lg"
            />
            {drawDateFilter && (
              <button
                onClick={() => {
                  setDrawDateFilter("");
                  setPage(0);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== RaffleCard ===== */}
      <RaffleCard raffles={raffles} onRefresh={loadDashboardData} onViewStats={onViewStats} />

      {/* ===== Paginador ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

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
  color: "blue" | "green" | "red" | "yellow" | "gray";
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-red-600",
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
