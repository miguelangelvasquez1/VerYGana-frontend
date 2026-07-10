"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  getMyRafflesByStatus,
  countMyRafflesByStatus,
  getWonPrizes,
  getUserTicketsByRaffle,
} from "@/services/raffleService";
import { getConsumerProfile } from "@/services/ConsumerService";

import {
  RaffleStatus,
  UserRaffleSummaryResponseDTO,
} from "@/types/raffles/raffle.types";

import { PrizeWonResponseDTO } from "@/types/raffles/raffleWinner.types";
import { PrizeStatus } from "@/types/raffles/prize.types";
import { RaffleTicketResponseDTO } from "@/types/raffles/raffleTicket.types";
import { PagedResponse } from "@/types/Generic.types";
import { useAuth } from "@/hooks/useAuth";
import ClaimPrizeModal from "@/components/consumer/raffles/ClaimPrizeModal";

type MainTab = "BOLETOS" | "PRIZES";
type RaffleSubTab = "ACTIVE" | "COMPLETED";
type PrizeFilter = "ALL" | "CLAIMED" | "PENDING" | "EXPIRED";

export default function MyParticipationsPage() {
  const { user } = useAuth();
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [mainTab, setMainTab] = useState<MainTab>("BOLETOS");
  const [raffleSubTab, setRaffleSubTab] = useState<RaffleSubTab>("ACTIVE");
  const [raffles, setRaffles] = useState<UserRaffleSummaryResponseDTO[]>([]);
  const [count, setCount] = useState<number>(0);
  const [prizes, setPrizes] = useState<PrizeWonResponseDTO[]>([]);
  const [prizeFilter, setPrizeFilter] = useState<PrizeFilter>("ALL");
  const [selectedRaffleId, setSelectedRaffleId] = useState<number | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [claimingPrize, setClaimingPrize] = useState<PrizeWonResponseDTO | null>(null);

  useEffect(() => {
    getConsumerProfile().then((p) => setRegisteredPhone(p.phoneNumber)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mainTab === "BOLETOS") fetchRaffles(raffleSubTab as RaffleStatus);
  }, [mainTab, raffleSubTab]);

  useEffect(() => {
    if (mainTab === "PRIZES") fetchPrizes();
  }, [mainTab, prizeFilter]);

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
      let status: PrizeStatus | null = null;
      if (prizeFilter === "CLAIMED") status = PrizeStatus.DELIVERED;
      if (prizeFilter === "PENDING") status = PrizeStatus.PENDING;
      if (prizeFilter === "EXPIRED") status = PrizeStatus.EXPIRED;
      const data: PagedResponse<PrizeWonResponseDTO> = await getWonPrizes(10, 0, status);
      setPrizes(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {/* ── HERO ── */}
      <header className="bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        {/* Decorative circles */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/5" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              🎟️ Historial de participaciones
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Mis participaciones
            </h1>
            <p className="text-white/70 text-sm max-w-md mb-7">
              Consulta tus boletos activos, rifas finalizadas y todos los premios que has ganado.
            </p>

            {/* Main tab switcher — integrated in hero */}
            <div className="flex gap-3">
              <button
                onClick={() => setMainTab("BOLETOS")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  mainTab === "BOLETOS"
                    ? "bg-white text-[#03548C] shadow-md"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                🎟️ Mis boletos
              </button>
              <button
                onClick={() => setMainTab("PRIZES")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  mainTab === "PRIZES"
                    ? "bg-white text-[#03548C] shadow-md"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                🏆 Mis premios
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10">

        {mainTab === "BOLETOS" ? (
          <>
            <div className="flex gap-2 mb-5">
              <FilterPill
                label={`Activas${raffleSubTab === "ACTIVE" ? ` (${count})` : ""}`}
                active={raffleSubTab === "ACTIVE"}
                onClick={() => setRaffleSubTab("ACTIVE")}
              />
              <FilterPill
                label={`Finalizadas${raffleSubTab === "COMPLETED" ? ` (${count})` : ""}`}
                active={raffleSubTab === "COMPLETED"}
                onClick={() => setRaffleSubTab("COMPLETED")}
              />
            </div>

            <div className="flex flex-col gap-4">
              {raffles.length === 0 && (
                <div className="text-center py-14">
                  <div className="text-4xl mb-3">🎟️</div>
                  <p className="text-gray-500 font-medium">No tienes participaciones en esta categoría</p>
                </div>
              )}
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
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              <FilterPill label="Todos" active={prizeFilter === "ALL"} onClick={() => setPrizeFilter("ALL")} />
              <FilterPill label="Reclamados" active={prizeFilter === "CLAIMED"} onClick={() => setPrizeFilter("CLAIMED")} />
              <FilterPill label="Pendientes" active={prizeFilter === "PENDING"} onClick={() => setPrizeFilter("PENDING")} />
              <FilterPill label="Expirados" active={prizeFilter === "EXPIRED"} onClick={() => setPrizeFilter("EXPIRED")} />
            </div>

            <div className="flex flex-col gap-4">
              {prizes.length === 0 && (
                <div className="text-center py-14">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="text-gray-500 font-medium">No tienes premios en esta categoría</p>
                </div>
              )}
              {prizes.map((p) => (
                <PrizeCard
                  key={p.prizeId}
                  prize={p}
                  isExpired={prizeFilter === "EXPIRED"}
                  onClaim={() => setClaimingPrize(p)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {isTicketModalOpen && selectedRaffleId && (
        <TicketsModal
          raffleId={selectedRaffleId}
          onClose={() => setIsTicketModalOpen(false)}
        />
      )}

      {claimingPrize && (
        <ClaimPrizeModal
          prize={claimingPrize}
          registeredEmail={user?.email ?? ""}
          registeredPhone={registeredPhone}
          onClose={() => setClaimingPrize(null)}
          onClaimed={(prizeId) => {
            setPrizes((prev) =>
              prev.map((p) =>
                p.prizeId === prizeId
                  ? { ...p, isClaimed: true, claimedAt: new Date().toISOString() }
                  : p
              )
            );
            setClaimingPrize(null);
          }}
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
  const isReady = useRef(false);

  const loadTickets = useCallback(async (currentPage: number) => {
    const res = await getUserTicketsByRaffle(raffleId, 12, currentPage);
    setTickets((prev) => {
      const merged = [...prev, ...res.data];
      const unique = Array.from(new Map(merged.map((t) => [t.id, t])).values());
      return unique;
    });
    setHasNext(res.meta.hasNext);
  }, [raffleId]);

  useEffect(() => {
    setTickets([]);
    setHasNext(true);
    isReady.current = false;
    setPage(0);
    getUserTicketsByRaffle(raffleId, 12, 0).then((res) => {
      setTickets(res.data);
      setHasNext(res.meta.hasNext);
      isReady.current = true;
    });
  }, [raffleId]);

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-5xl rounded-t-2xl md:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">🎟️ Mis boletos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
          {hasNext && <div ref={loader} className="h-10" />}
        </div>
      </div>
    </div>
  );
}

/* ================= TICKET ================= */

function TicketCard({ ticket }: { ticket: RaffleTicketResponseDTO }) {
  const isWinner = ticket.isWinner;

  return (
    <div className="relative group">
      <div
        className={`rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-[1.03] ${
          isWinner
            ? "bg-linear-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-600 shadow-xl shadow-yellow-300/40"
            : "bg-white border border-gray-200 shadow-md"
        }`}
      >
        {isWinner && (
          <div className="absolute inset-0 rounded-2xl bg-yellow-300 opacity-20 blur-xl" />
        )}

        <div className={`px-4 py-2 flex justify-between text-xs font-semibold ${isWinner ? "bg-yellow-600 text-white" : "bg-[#03548C]/5 text-[#03548C]"}`}>
          <span>{ticket.raffleTicketStatus}</span>
        </div>

        <div className="relative flex items-center">
          <div className="w-3 h-3 bg-gray-100 rounded-full -ml-1.5" />
          <div className="flex-1 border-t border-dashed border-gray-300" />
          <div className="w-3 h-3 bg-gray-100 rounded-full -mr-1.5" />
        </div>

        <div className="p-4 text-center">
          <p className="text-lg font-bold tracking-widest">#{ticket.ticketNumber}</p>
          <p className="text-xs mt-2 uppercase">{ticket.source.replace("_", " ")}</p>
          <p className="text-xs mt-1">📅 {new Date(ticket.issuedAt).toLocaleDateString("es-CO")}</p>
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

/* ================= RAFFLE CARD ================= */

function RaffleCard({
  raffle,
  onViewTickets,
}: {
  raffle: UserRaffleSummaryResponseDTO;
  onViewTickets: (id: number) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white">
      <div className="flex">
        <div className="shrink-0 w-28 md:w-40">
          <img src={raffle.imageUrl} className="w-full h-full object-cover min-h-30" />
        </div>

        <div className="flex-1 p-3 md:p-4 flex flex-col justify-between gap-2 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-sm md:text-base leading-tight">{raffle.title}</h2>
              {raffle.raffleStatus === "ACTIVE" ? (
                <span className="shrink-0 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Activa</span>
              ) : (
                <span className="shrink-0 text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">Finalizada</span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500">
              <span>🎲 {raffle.raffleType}</span>
              <span>🎟️ <span className="font-semibold text-gray-700">{raffle.userTicketCount}</span> boletos</span>
              <span>📅 {new Date(raffle.drawDate).toLocaleDateString("es-CO")}</span>
            </div>

            {raffle.isWinner && (
              <p className="text-xs text-[#c9a227] font-semibold mt-1.5">🏆 ¡Ganaste esta rifa!</p>
            )}
          </div>

          <button
            onClick={() => onViewTickets(raffle.id)}
            className="self-start bg-[#03548C] hover:bg-[#0b1440] active:scale-95 transition text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            Ver mis boletos
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= PRIZE CARD ================= */

function PrizeCard({
  prize,
  isExpired,
  onClaim,
}: {
  prize: PrizeWonResponseDTO;
  isExpired?: boolean;
  onClaim: () => void;
}) {
  const isClaimed = prize.isClaimed || !!prize.claimedAt;

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
    <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white">
      <div className="flex">
        {/* Image */}
        <div className="relative shrink-0 w-36 md:w-52">
          <img
            src={prize.imageUrl}
            alt={prize.title}
            className="w-full h-full object-cover min-h-40"
          />
          <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {prize.prizeType === "PHYSICAL" ? "🎁 Físico" : "💻 Digital"}
          </span>
          {prize.position && (
            <span className="absolute bottom-2 left-2 bg-[#FFD700] text-black text-xs font-bold px-2 py-0.5 rounded-full">
              #{prize.position}° lugar
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 md:p-4 flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-bold text-sm md:text-base leading-tight">{prize.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{prize.brand}</p>
            </div>
            {isClaimed ? (
              <span className="shrink-0 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                ✅ Reclamado
              </span>
            ) : isExpired ? (
              <span className="shrink-0 inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                ⌛ Expirado
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                ⏳ Pendiente
              </span>
            )}
          </div>

          <p className="text-base font-bold text-green-600">${prize.value.toLocaleString()}</p>

          {prize.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{prize.description}</p>
          )}

          <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 text-xs border-t border-gray-100 pt-2">
            <span className="text-gray-400">🎟️ Boleto ganador</span>
            <span className="font-mono font-semibold text-gray-700">{prize.ticketWinnerNumber}</span>

            <span className="text-gray-400">📦 Cantidad</span>
            <span className="text-gray-700">{prize.quantity} unidad{prize.quantity > 1 ? "es" : ""}</span>

            <span className="text-gray-400">📅 Fecha sorteo</span>
            <span className="text-gray-700">{drawnDate}</span>

            {claimedDate && (
              <>
                <span className="text-gray-400">✅ Reclamado el</span>
                <span className="text-gray-700">{claimedDate}</span>
              </>
            )}
          </div>

          {!isClaimed && !isExpired && (
            <div className="flex justify-end mt-1">
              <button
                onClick={onClaim}
                className="bg-[#03548C] hover:bg-[#0b1440] active:scale-95 transition text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Reclamar premio →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= UI ================= */

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        active
          ? "bg-[#03548C] text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}
