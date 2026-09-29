import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  DashboardPlanUsage,
  DashboardSlotType,
} from "@/types/commercial/Dashboard.types";
import { formatCount } from "./dashboard.format";
import { DashboardCard, EmptyState, SectionTitle } from "./dashboard.ui";

const SLOT_LABELS: Record<DashboardSlotType, string> = {
  PRODUCTS: "Productos",
  ADS: "Anuncios",
  BRANDED_GAMES: "Juegos brandeados",
  SURVEYS: "Encuestas",
};

export function PlanUsageCard({ usage }: { usage: DashboardPlanUsage }) {
  const anyFull = usage.slots.some(
    (slot) => slot.max >= 0 && slot.used >= slot.max,
  );

  return (
    <DashboardCard>
      <SectionTitle
        title="Uso vs. límites del plan"
        action={
          anyFull ? (
            <Link
              href="/plans"
              className="inline-flex items-center gap-1 rounded-lg bg-[#03548C] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0b1440] whitespace-nowrap"
            >
              Mejorar plan
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          ) : undefined
        }
      />
      {usage.slots.length === 0 ? (
        <EmptyState message="Tu plan no tiene límites de activos configurados." />
      ) : (
        <ul className="space-y-3">
          {usage.slots.map((slot) => {
            const unlimited = slot.max < 0;
            const full = !unlimited && slot.used >= slot.max;
            const pct = unlimited
              ? 0
              : Math.min(100, (slot.used / Math.max(slot.max, 1)) * 100);

            return (
              <li key={slot.slot}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{SLOT_LABELS[slot.slot]}</span>
                  <span
                    className={`font-semibold ${
                      full ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {formatCount(slot.used)}
                    {unlimited ? (
                      <span className="text-gray-400"> / ilimitado</span>
                    ) : (
                      <span className="text-gray-400"> / {formatCount(slot.max)}</span>
                    )}
                  </span>
                </div>
                {!unlimited && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-1.5 rounded-full ${
                        full ? "bg-red-500" : "bg-[#03548C]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
