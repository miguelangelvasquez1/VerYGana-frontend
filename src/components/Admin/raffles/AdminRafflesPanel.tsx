"use client";

import { useState } from "react";
import { Gift, TicketIcon, ShieldAlert, BarChart3 } from "lucide-react";
import RaffleManagement from "./RaffleManagement";
import TicketRulesManagement from "@/components/admin/ticket-rules/TicketRulesManagement";
import AuditLogPanel from "./AuditLogPanel";
import CompletedRafflesStats from "./CompletedRafflesStats";
import { RaffleSummaryResponseDTO } from "@/types/raffles/raffle.types";

type TabKey = "raffles" | "ticket-rules" | "stats" | "audit";

const TABS: { key: TabKey; label: string; icon: typeof Gift }[] = [
  { key: "raffles", label: "Rifas", icon: Gift },
  { key: "ticket-rules", label: "Reglas de boletos", icon: TicketIcon },
  { key: "stats", label: "Estadísticas", icon: BarChart3 },
  { key: "audit", label: "Auditoría", icon: ShieldAlert },
];

export default function AdminRafflesPanel() {
  const [tab, setTab] = useState<TabKey>("raffles");
  const [statsRaffle, setStatsRaffle] = useState<RaffleSummaryResponseDTO | null>(null);

  const handleViewStats = (raffle: RaffleSummaryResponseDTO) => {
    setStatsRaffle(raffle);
    setTab("stats");
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition border-b-2 -mb-px cursor-pointer ${
              tab === key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "raffles" && <RaffleManagement onViewStats={handleViewStats} />}
      {tab === "ticket-rules" && <TicketRulesManagement />}
      {tab === "stats" && (
        <CompletedRafflesStats
          initialRaffle={statsRaffle}
          onInitialRaffleConsumed={() => setStatsRaffle(null)}
        />
      )}
      {tab === "audit" && <AuditLogPanel />}
    </div>
  );
}
