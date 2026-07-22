"use client";

import { useEffect, useState } from "react";
import { Trophy, Ticket, ShoppingBag, LogIn, Users2, Sparkles } from "lucide-react";
import { getRafflesByFilters } from "@/services/raffleService";
import { getRaffleStats } from "@/services/admin/AdminRaffleService";
import { RaffleStatsResponseDTO, RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";
import { useAdminSectionSearch } from "@/context/AdminSearchContext";

const PAGE_SIZE = 8;

const KNOWN_SOURCES = new Set(["PURCHASE", "DAILY_LOGIN", "REFERRAL"]);

interface Props {
  initialRaffle?: RaffleSummaryResponseDTO | null;
  onInitialRaffleConsumed?: () => void;
}

export default function CompletedRafflesStats({ initialRaffle, onInitialRaffleConsumed }: Props) {
  const [raffles, setRaffles] = useState<RaffleSummaryResponseDTO[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [selectedRaffle, setSelectedRaffle] = useState<RaffleSummaryResponseDTO | null>(null);
  const [stats, setStats] = useState<RaffleStatsResponseDTO | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const { searchTerm } = useAdminSectionSearch("Buscar rifa completada por título...");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    const load = async () => {
      setIsLoadingList(true);
      try {
        const response = await getRafflesByFilters(
          "COMPLETED",
          debouncedSearch || undefined,
          undefined,
          undefined,
          PAGE_SIZE,
          page
        );
        setRaffles(response?.data ?? []);
        setTotalPages(response?.meta?.totalPages ?? 0);
      } catch (err) {
        console.error("Error cargando rifas completadas:", err);
      } finally {
        setIsLoadingList(false);
      }
    };
    load();
  }, [debouncedSearch, page]);

  const handleSelectRaffle = async (raffle: RaffleSummaryResponseDTO) => {
    setSelectedRaffle(raffle);
    setStats(null);
    setIsLoadingStats(true);
    try {
      const data = await getRaffleStats(raffle.id);
      setStats(data);
    } catch (err) {
      console.error("Error cargando estadísticas de la rifa:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Preselecciona la rifa recibida desde la tabla de "Rifas" (botón "Estadísticas")
  useEffect(() => {
    if (!initialRaffle) return;
    handleSelectRaffle(initialRaffle);
    onInitialRaffleConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRaffle]);

  const totalTicketsIssued = stats
    ? Object.values(stats.ticketsBySource ?? {}).reduce((sum, n) => sum + n, 0)
    : 0;

  const sourceRows = stats
    ? [
        {
          key: "PURCHASE",
          label: "Compras",
          icon: ShoppingBag,
          issued: stats.ticketsBySource?.["PURCHASE"] ?? 0,
          max: stats.maxTicketsFromPurchases,
        },
        {
          key: "DAILY_LOGIN",
          label: "Inicio de sesión diario",
          icon: LogIn,
          issued: stats.ticketsBySource?.["DAILY_LOGIN"] ?? 0,
          max: stats.maxTicketsFromDailyLogin,
        },
        {
          key: "REFERRAL",
          label: "Referidos",
          icon: Users2,
          issued: stats.ticketsBySource?.["REFERRAL"] ?? 0,
          max: stats.maxTicketsFromReferrals,
        },
      ]
    : [];

  const otherSources = stats
    ? Object.entries(stats.ticketsBySource ?? {}).filter(([key]) => !KNOWN_SOURCES.has(key))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      {/* ===== Lista de rifas completadas ===== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-bold text-[#0b1440]">Rifas completadas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Selecciona una para ver sus estadísticas</p>
        </div>

        <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
          {isLoadingList ? (
            <div className="p-6 text-center text-sm text-gray-400">Cargando rifas...</div>
          ) : raffles.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              No hay rifas completadas{debouncedSearch ? " con ese título" : ""}.
            </div>
          ) : (
            raffles.map((raffle) => (
              <button
                key={raffle.id}
                type="button"
                onClick={() => handleSelectRaffle(raffle)}
                className={`w-full text-left px-5 py-3 transition cursor-pointer ${
                  selectedRaffle?.id === raffle.id ? "bg-[#03548C]/10" : "hover:bg-gray-50"
                }`}
              >
                <p
                  className={`text-sm font-semibold truncate ${
                    selectedRaffle?.id === raffle.id ? "text-[#03548C]" : "text-gray-800"
                  }`}
                >
                  {raffle.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sorteada el {new Date(raffle.drawDate).toLocaleDateString("es-CO")} · {raffle.prizeCount} premio(s)
                </p>
              </button>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-400">
              Página {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* ===== Panel de estadísticas ===== */}
      <div>
        {!selectedRaffle ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200 text-center p-10">
            <Sparkles className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Selecciona una rifa completada para ver sus estadísticas.</p>
          </div>
        ) : isLoadingStats ? (
          <div className="h-full min-h-[320px] flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="w-10 h-10 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !stats ? (
          <div className="h-full min-h-[320px] flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
            <p className="text-sm text-gray-500">No se pudieron cargar las estadísticas de esta rifa.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-linear-to-r from-[#0b1440] to-[#03548C] rounded-2xl p-6 text-white">
              <p className="text-xs uppercase tracking-wide text-white/60 font-semibold">Rifa completada</p>
              <h2 className="text-xl font-bold mt-1">{selectedRaffle.title}</h2>
              <p className="text-sm text-white/70 mt-1">
                Sorteada el{" "}
                {new Date(selectedRaffle.drawDate).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-linear-to-br from-[#FFD700] to-[#c9a227] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-[#0b1440]/70">
                  <Trophy className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">Valor total en premios</p>
                </div>
                <p className="text-3xl font-extrabold text-[#0b1440] mt-2">
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  }).format(stats.totalPrizesValue)}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500">
                  <Ticket className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">Tickets emitidos (todas las fuentes)</p>
                </div>
                <p className="text-3xl font-extrabold text-[#03548C] mt-2">{totalTicketsIssued}</p>
              </div>
            </div>

            {/* Sources breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
              <h3 className="text-sm font-bold text-[#0b1440]">
                Tickets emitidos vs. límite configurado por fuente
              </h3>

              {sourceRows.map(({ key, label, icon: Icon, issued, max }) => {
                const pct = max > 0 ? Math.min(100, (issued / max) * 100) : 0;

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#03548C]" />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {issued} / {max > 0 ? max : "—"} tickets
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-linear-to-r from-[#00a4ff] to-[#0089d6] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {otherSources.length > 0 && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Otras fuentes</p>
                  {otherSources.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{key}</span>
                      <span className="text-xs text-gray-500">{value} tickets</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
