import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  ShoppingBag,
  Wallet,
  Landmark,
  Heart,
  ClipboardList,
  Gamepad2,
} from "lucide-react";

import {
  DashboardEngagement,
  DashboardSales,
} from "@/types/commercial/Dashboard.types";
import { formatCentsToCOP, formatCount } from "./dashboard.format";
import { DeltaChip } from "./dashboard.ui";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  deltaPct: number | null | undefined;
}

function KpiCard({ title, value, icon: Icon, deltaPct }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="p-2 rounded-lg bg-[#03548C]/10 shrink-0">
          <Icon className="w-4 h-4 text-[#03548C]" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <div className="mt-2">
        <DeltaChip deltaPct={deltaPct} />
        <span className="ml-1.5 text-xs text-gray-400">vs. periodo anterior</span>
      </div>
    </div>
  );
}

interface KpiSectionProps {
  sales?: DashboardSales | null;
  engagement?: DashboardEngagement | null;
}

export function KpiSection({ sales, engagement }: KpiSectionProps) {
  const cards: KpiCardProps[] = [];

  if (sales) {
    cards.push(
      {
        title: "Ventas",
        value: formatCentsToCOP(sales.current.salesAmountCents),
        icon: DollarSign,
        deltaPct: sales.salesAmountDeltaPct,
      },
      {
        title: "N.º de ventas",
        value: formatCount(sales.current.salesCount),
        icon: ShoppingBag,
        deltaPct: sales.salesCountDeltaPct,
      },
      {
        title: "Ingreso neto",
        value: formatCentsToCOP(sales.current.netEarningsCents),
        icon: Wallet,
        deltaPct: sales.netEarningsDeltaPct,
      },
      {
        title: "Comisión a la plataforma",
        value: formatCentsToCOP(sales.current.platformCommissionsCents),
        icon: Landmark,
        deltaPct: sales.platformCommissionsDeltaPct,
      },
    );
  }

  if (engagement?.adLikes) {
    cards.push({
      title: "Likes de anuncios",
      value: formatCount(engagement.adLikes.current),
      icon: Heart,
      deltaPct: engagement.adLikes.deltaPct,
    });
  }
  if (engagement?.surveyResponses) {
    cards.push({
      title: "Respuestas de encuestas",
      value: formatCount(engagement.surveyResponses.current),
      icon: ClipboardList,
      deltaPct: engagement.surveyResponses.deltaPct,
    });
  }
  if (engagement?.gamePlays) {
    cards.push({
      title: "Partidas de juegos",
      value: formatCount(engagement.gamePlays.current),
      icon: Gamepad2,
      deltaPct: engagement.gamePlays.deltaPct,
    });
  }

  if (!cards.length) return null;

  const noSales =
    !!sales &&
    sales.current.salesCount === 0 &&
    sales.current.salesAmountCents === 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>
      {noSales && (
        <p className="text-sm text-gray-500">
          Aún no tienes ventas en este periodo.
        </p>
      )}
    </div>
  );
}
