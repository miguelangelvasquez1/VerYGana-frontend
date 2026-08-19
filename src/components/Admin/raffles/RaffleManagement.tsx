"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Plus,
  FileEdit,
  PlayCircle,
  Radio,
  Lock,
  CheckCircle2,
  RotateCcw
} from "lucide-react";
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

  /* ================== RESET FILTERS ================== */

  const handleResetFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setDrawDateFilter("");
    setPage(0);
  };

  /* ================== ORQUESTADOR CREATE RAFFLE ================== */
  const handleCreateRaffle = async (
      payload: CreateRaffleFormSubmitPayload
  ) => {
    const loadingToast = toast.loading("Creando rifa...");

    try {
      const { raffleData, raffleImageFile, prizeImageFiles } = payload;

      const prepareRequest = {
        raffleData,
        raffleImageMetadata: buildFileMetadata(raffleImageFile),
        prizeImageMetadataList: prizeImageFiles.map(buildFileMetadata),
      };

      const prepareResponse = await prepareRaffleCreation(prepareRequest);

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

  const cards = [
    {
      label: "Borradores",
      count: stats.draftRaffles,
      icon: FileEdit,
      borderColor: "border-t-amber-500",
      iconBg: "bg-amber-50 text-amber-600",
      badgeColor: null,
      isLive: false,
    },
    {
      label: "Rifas Activas",
      count: stats.activeRaffles,
      icon: PlayCircle,
      borderColor: "border-t-emerald-500",
      iconBg: "bg-emerald-50 text-emerald-600",
      badgeColor: null,
      isLive: false,
    },
    {
      label: "Rifas En Vivo",
      count: stats.liveRaffles,
      icon: Radio,
      borderColor: "border-t-red-600",
      iconBg: "bg-red-50 text-red-600",
      badgeColor: "bg-red-500 text-white animate-pulse",
      isLive: true,
    },
    {
      label: "Rifas Cerradas",
      count: stats.closedRaffles,
      icon: Lock,
      borderColor: "border-t-blue-500",
      iconBg: "bg-blue-50 text-blue-600",
      badgeColor: null,
      isLive: false,
    },
    {
      label: "Finalizadas",
      count: stats.completedRaffles,
      icon: CheckCircle2,
      borderColor: "border-t-slate-400",
      iconBg: "bg-slate-100 text-slate-600",
      badgeColor: null,
      isLive: false,
    },
  ];

  /* ================== RENDER ================== */

  if (isLoading && raffles.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-medium">{error}</p>
          <button
              onClick={loadRaffles}
              className="cursor-pointer mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
    );
  }

  return (
      <div className="space-y-6 relative">
        {/* ===== CABECERA Y ACCIÓN PRINCIPAL ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Rifas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Administra el ciclo de vida y estado de los sorteos
            </p>
          </div>
          <button
              onClick={() => setShowCreateRaffle(true)}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-admin-blue hover:bg-admin-blue-dark rounded-lg shadow-xs transition-all"
          >
            <Plus size={18} />
            Crear Rifa
          </button>
        </div>

        {/* ===== TARJETAS DE ESTADÍSTICAS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
                <div
                    key={i}
                    className={`bg-white p-4.5 rounded-xl border border-gray-200/90 border-t-4 ${card.borderColor} shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {card.label}
                </span>
                    <div className={`p-2 rounded-lg ${card.iconBg}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-gray-900">
                  {card.count}
                </span>
                    {card.isLive && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                    ● LIVE
                  </span>
                    )}
                  </div>
                </div>
            );
          })}
        </div>

        {/* ===== BARRA DE FILTROS INTEGRADA ===== */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs flex flex-wrap items-center gap-4">
          {/* Filtro Estado */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Estado:</label>
            <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="py-1.5 px-3 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700 cursor-pointer font-medium"
            >
              <option value="">Todos</option>
              <option value="DRAFT">Borradores</option>
              <option value="ACTIVE">Activas</option>
              <option value="CLOSED">Cerradas</option>
              <option value="LIVE">En vivo</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
              <option value="MISSED_DRAW">Sorteo no realizado</option>
            </select>
          </div>

          {/* Filtro Tipo */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Tipo:</label>
            <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="py-1.5 px-3 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700 cursor-pointer font-medium"
            >
              <option value="">Todos</option>
              <option value="STANDARD">Estándar</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          {/* Filtro Fecha */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Sorteo:</label>
            <input
                type="date"
                value={drawDateFilter}
                onChange={(e) => {
                  setDrawDateFilter(e.target.value);
                  setPage(0);
                }}
                className="py-1.5 px-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-gray-700 cursor-pointer font-medium"
            />
          </div>

          {/* Botón Reset */}
          {(statusFilter || typeFilter || drawDateFilter) && (
              <button
                  onClick={handleResetFilters}
                  className="cursor-pointer p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                  title="Limpiar filtros"
              >
                <RotateCcw size={16} />
              </button>
          )}
        </div>

        {/* ===== LISTA DE RIFAS ===== */}
        <RaffleCard
            raffles={raffles}
            onRefresh={loadDashboardData}
            onViewStats={onViewStats}
        />

        {/* ===== PAGINADOR ===== */}
        {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">
            Página <strong className="text-gray-800">{page + 1}</strong> de{" "}
            <strong className="text-gray-800">{totalPages}</strong>
          </span>
              <div className="flex gap-2">
                <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                    className="cursor-pointer text-sm px-3.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-medium text-gray-700"
                >
                  Anterior
                </button>
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="cursor-pointer text-sm px-3.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-medium text-gray-700"
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
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full relative shadow-lg overflow-y-auto max-h-[90vh]">
          <button
              onClick={onClose}
              className="cursor-pointer absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
          {children}
        </div>
      </div>
  );
}
