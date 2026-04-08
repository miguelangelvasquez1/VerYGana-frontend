"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  getMyRafflesByStatus,
  countMyRafflesByStatus,
  getWonPrizes,
  getUserTicketsByRaffle,
} from "@/services/raffleService";

import {
  RaffleStatus,
  UserRaffleSummaryResponseDTO,
} from "@/types/raffles/raffle.types";

import { PrizeWonResponseDTO } from "@/types/raffles/raffleWinner.types";
import { RaffleTicketResponseDTO } from "@/types/raffles/raffleTicket.types";
import { PagedResponse } from "@/types/Generic.types";

type Tab = RaffleStatus | "PRIZES";
type PrizeFilter = "ALL" | "CLAIMED" | "PENDING";

export default function MyParticipationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>(RaffleStatus.ACTIVE);
  const [raffles, setRaffles] = useState<UserRaffleSummaryResponseDTO[]>([]);
  const [count, setCount] = useState<number>(0);
  const [prizes, setPrizes] = useState<PrizeWonResponseDTO[]>([]);
  const [prizeFilter, setPrizeFilter] = useState<PrizeFilter>("ALL");

  const [selectedRaffleId, setSelectedRaffleId] = useState<number | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === "PRIZES") fetchPrizes();
    else fetchRaffles(activeTab);
  }, [activeTab, prizeFilter]);

  const fetchRaffles = async (status: RaffleStatus) => {
    try {
      const data: PagedResponse<UserRaffleSummaryResponseDTO> =
        await getMyRafflesByStatus(status, 10, 0);

      const total = await countMyRafflesByStatus(status);

      setRaffles(data.data);
      setCount(total);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPrizes = async () => {
    try {
      let isClaimed: boolean | null = null;

      if (prizeFilter === "CLAIMED") isClaimed = true;
      if (prizeFilter === "PENDING") isClaimed = false;

      const data: PagedResponse<PrizeWonResponseDTO> =
        await getWonPrizes(10, 0, isClaimed);

      setPrizes(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Mis participaciones</h1>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Tab
            label={`Activas (${activeTab === "ACTIVE" ? count : ""})`}
            active={activeTab === "ACTIVE"}
            onClick={() => setActiveTab(RaffleStatus.ACTIVE)}
          />
          <Tab
            label={`Finalizadas (${activeTab === "COMPLETED" ? count : ""})`}
            active={activeTab === "COMPLETED"}
            onClick={() => setActiveTab(RaffleStatus.COMPLETED)}
          />
          <Tab
            label="Mis premios"
            active={activeTab === "PRIZES"}
            onClick={() => setActiveTab("PRIZES")}
          />
        </div>

        {activeTab === "PRIZES" ? (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              <FilterTab label="Todos" active={prizeFilter === "ALL"} onClick={() => setPrizeFilter("ALL")} />
              <FilterTab label="Reclamados" active={prizeFilter === "CLAIMED"} onClick={() => setPrizeFilter("CLAIMED")} />
              <FilterTab label="Pendientes" active={prizeFilter === "PENDING"} onClick={() => setPrizeFilter("PENDING")} />
            </div>

            <div className="grid gap-6">
              {prizes.length === 0 && <p>No tienes premios aún</p>}
              {prizes.map((p) => (
                <PrizeCard key={p.prizeId} prize={p} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid gap-6">
            {raffles.length === 0 && <p>No tienes participaciones aún</p>}

            {raffles.map((r) => (
              <RaffleCard
                key={r.id}
                raffle={r}
                onViewTickets={(id: number) => {
                  setSelectedRaffleId(id);
                  setIsTicketModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {isTicketModalOpen && selectedRaffleId && (
        <TicketsModal
          raffleId={selectedRaffleId}
          onClose={() => setIsTicketModalOpen(false)}
        />
      )}
    </>
  );
}

/* ================= MODAL ================= */

function TicketsModal({ raffleId, onClose }: { raffleId: number; onClose: () => void }) {
  const [tickets, setTickets] = useState<RaffleTicketResponseDTO[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const loader = useRef<HTMLDivElement | null>(null);
  // 🔧 FIX: flag para saber si el reset ya terminó y está listo para cargar
  const isReady = useRef(false);

  const loadTickets = useCallback(async (currentPage: number) => {
    const res = await getUserTicketsByRaffle(raffleId, 12, currentPage);

    setTickets((prev) => {
      const merged = [...prev, ...res.data];
      const unique = Array.from(
        new Map(merged.map((t) => [t.id, t])).values()
      );
      return unique;
    });

    setHasNext(res.meta.hasNext);
  }, [raffleId]);

  // 🔧 FIX: cuando cambia el raffleId, reseteamos todo y marcamos como listo
  useEffect(() => {
    setTickets([]);
    setHasNext(true);
    isReady.current = false;
    // Usar page 0 directamente en lugar de depender del estado
    setPage(0);
    // Cargamos la primera página directamente aquí para evitar la doble ejecución
    getUserTicketsByRaffle(raffleId, 12, 0).then((res) => {
      setTickets(res.data);
      setHasNext(res.meta.hasNext);
      isReady.current = true;
    });
  }, [raffleId]);

  // 🔧 FIX: este effect solo corre para páginas > 0, nunca para la inicial
  useEffect(() => {
    if (!isReady.current || page === 0) return;
    loadTickets(page);
  }, [page, loadTickets]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNext && isReady.current) {
        setPage((prev) => prev + 1);
      }
    },
    [hasNext]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1 });
    if (loader.current) observer.observe(loader.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-5xl rounded-t-2xl md:rounded-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">🎟️ Mis boletos</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>

        {hasNext && <div ref={loader} className="h-10" />}
      </div>
    </div>
  );
}


/* ================= 🎫 TICKET ================= */

function TicketCard({ ticket }: { ticket: RaffleTicketResponseDTO }) {
  const isWinner = ticket.isWinner;

  return (
    <div className="relative group">
      <div
        className={`rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-[1.03]
        ${isWinner
            ? "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-600 shadow-xl shadow-yellow-300/40"
            : "bg-white border border-gray-200 shadow-md"
          }`}
      >
        {isWinner && (
          <div className="absolute inset-0 rounded-2xl bg-yellow-300 opacity-20 blur-xl"></div>
        )}

        <div
          className={`px-4 py-2 flex justify-between text-xs font-semibold ${isWinner ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
        >
          <span>{ticket.raffleTicketStatus}</span>
        </div>

        <div className="relative flex items-center">
          <div className="w-3 h-3 bg-gray-100 rounded-full -ml-1.5"></div>
          <div className="flex-1 border-t border-dashed border-gray-300"></div>
          <div className="w-3 h-3 bg-gray-100 rounded-full -mr-1.5"></div>
        </div>

        <div className="p-4 text-center">
          <p className="text-lg font-bold tracking-widest">
            #{ticket.ticketNumber}
          </p>

          <p className="text-xs mt-2 uppercase">
            {ticket.source.replace("_", " ")}
          </p>

          <p className="text-xs mt-1">
            📅 Fecha de adquisición: {new Date(ticket.issuedAt).toLocaleDateString("es-CO")}
          </p>

          {isWinner && (
            <div className="mt-3 text-xs font-bold text-white bg-black/70 px-2 py-1 rounded-full inline-block animate-pulse">
              🏆 GANADOR
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= RAFFLE CARD (TU ESTILO ORIGINAL + CLICK) ================= */

function RaffleCard({
  raffle,
  onViewTickets,
}: {
  raffle: UserRaffleSummaryResponseDTO;
  onViewTickets: (id: number) => void;
}) {
  return (
    <div className="border rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3">
          <img src={raffle.imageUrl} className="w-full h-52 md:h-full object-cover" />
        </div>

        <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg md:text-xl">{raffle.title}</h2>

            <p className="text-xs text-gray-500 mt-1">
              🎲 Tipo: {raffle.raffleType}
            </p>

            <p className="text-sm mt-2">
              🎟️ Boletos: <span className="font-semibold">{raffle.userTicketCount}</span>
            </p>

            <p className="text-sm text-gray-600 mt-1">
              📅 Sorteo: {new Date(raffle.drawDate).toLocaleString("es-CO")}
            </p>

            <div className="mt-3">
              {raffle.raffleStatus === "ACTIVE" ? (
                <span className="text-green-600 text-sm font-medium">🟢 Activa</span>
              ) : (
                <span className="text-gray-500 text-sm font-medium">⚪ Finalizada</span>
              )}
            </div>

            {raffle.isWinner && (
              <p className="text-yellow-500 font-semibold mt-2">
                🏆 ¡Ganaste esta rifa!
              </p>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={() => onViewTickets(raffle.id)}
              className="bg-blue-500 hover:bg-blue-700 hover:scale-105 transition-all text-white text-sm px-4 py-2 rounded-xl cursor-pointer"
            >
              Ver mis boletos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PRIZE CARD (INTACTO) ================= */

function PrizeCard({ prize }: { prize: PrizeWonResponseDTO }) {
  const [expanded, setExpanded] = useState(false);

  const shortDescription =
    prize.description.length > 120 && !expanded
      ? prize.description.slice(0, 120) + "..."
      : prize.description;

  const prizeTypeLabel = prize.prizeType === "PHYSICAL" ? "🎁 Físico" : "💻 Digital";

  const drawnDate = new Date(prize.drawnAt).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const claimedDate = prize.claimedAt
    ? new Date(prize.claimedAt).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : null;

  return (
    <div className="border rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition">
      <div className="flex flex-col md:flex-row">

        {/* Imagen */}
        <div className="md:w-1/3 relative">
          <img
            src={prize.imageUrl}
            className="w-full h-52 md:h-full object-cover"
          />
          <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-1 rounded-full shadow">
            {prizeTypeLabel}
          </span>
          {prize.position && (
            <span className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full shadow">
              🏆 #{prize.position}° lugar
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-5 flex-1 flex flex-col justify-between gap-3">

          {/* Header */}
          <div>
            <h2 className="font-bold text-lg md:text-xl">{prize.title}</h2>
            <p className="text-sm text-gray-500">Marca: <span className="font-medium text-gray-700">{prize.brand}</span></p>
            <p className="text-xl font-bold text-green-600 mt-1">
              ${prize.value.toLocaleString()}
            </p>
          </div>

          {/* Descripción */}
          <div>
            <p className="text-sm text-gray-600 whitespace-pre-line">{shortDescription}</p>
            {prize.description.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-600 text-xs mt-1 hover:underline"
              >
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            )}
          </div>

          {/* Detalles del sorteo */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 border-t pt-3">
            <span>🎟️ Boleto ganador</span>
            <span className="font-mono font-semibold text-gray-700">{prize.ticketWinnerNumber}</span>

            <span>📦 Cantidad</span>
            <span className="font-medium text-gray-700">{prize.quantity} unidad{prize.quantity > 1 ? "es" : ""}</span>

            <span>📅 Fecha sorteo</span>
            <span className="font-medium text-gray-700">{drawnDate}</span>

            {claimedDate && (
              <>
                <span>✅ Reclamado el</span>
                <span className="font-medium text-gray-700">{claimedDate}</span>
              </>
            )}
          </div>

          {/* Footer estado / botón */}
          <div className="mt-1">
            {prize.isClaimed ? (
              <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                ✅ Premio reclamado
              </span>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="text-orange-500 text-sm font-medium">⏳ Pendiente de reclamar</span>
                <button className="w-full sm:w-auto sm:ml-auto bg-green-600 hover:bg-green-700 active:scale-95 transition text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
                  Reclamar premio
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ================= UI ================= */

function Tab({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm ${active ? "bg-black text-white" : "bg-gray-200"
        }`}
    >
      {label}
    </button>
  );
}

function FilterTab({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm ${active ? "bg-blue-600 text-white" : "bg-gray-200"
        }`}
    >
      {label}
    </button>
  );
}