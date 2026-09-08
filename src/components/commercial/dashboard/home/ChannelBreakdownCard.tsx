import React from "react";

import {
  DashboardChannel,
  DashboardChannelBreakdownItem,
  DashboardChannelUnit,
} from "@/types/commercial/Dashboard.types";
import { formatCount } from "./dashboard.format";
import { DashboardCard, EmptyState, SectionTitle } from "./dashboard.ui";

const CHANNEL_LABELS: Record<DashboardChannel, string> = {
  MARKETPLACE: "Marketplace",
  ADS: "Anuncios",
  SURVEYS: "Encuestas",
  GAMES: "Juegos",
};

const UNIT_LABELS: Record<DashboardChannelUnit, string> = {
  SALES: "Ventas por canal",
  INTERACTIONS: "Interacciones por canal",
};

const CHANNEL_COLORS: Record<DashboardChannel, string> = {
  MARKETPLACE: "bg-[#03548C]",
  ADS: "bg-emerald-500",
  SURVEYS: "bg-violet-500",
  GAMES: "bg-amber-500",
};

function ChannelGroup({
  unit,
  items,
}: {
  unit: DashboardChannelUnit;
  items: DashboardChannelBreakdownItem[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {UNIT_LABELS[unit]}
      </p>
      <ul className="mt-2 space-y-2.5">
        {items.map((item) => (
          <li key={`${item.unit}-${item.channel}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {CHANNEL_LABELS[item.channel]}
              </span>
              <span className="font-semibold text-gray-900">
                {formatCount(item.value)}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className={`h-1.5 rounded-full ${CHANNEL_COLORS[item.channel]}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChannelBreakdownCard({
  breakdown,
}: {
  breakdown: DashboardChannelBreakdownItem[];
}) {
  const sales = breakdown.filter((i) => i.unit === "SALES");
  const interactions = breakdown.filter((i) => i.unit === "INTERACTIONS");

  return (
    <DashboardCard>
      <SectionTitle title="Rendimiento por canal" />
      {breakdown.length === 0 ? (
        <EmptyState message="Sin datos de canales en este periodo." />
      ) : (
        <div className="space-y-5">
          {sales.length > 0 && <ChannelGroup unit="SALES" items={sales} />}
          {interactions.length > 0 && (
            <ChannelGroup unit="INTERACTIONS" items={interactions} />
          )}
        </div>
      )}
    </DashboardCard>
  );
}
