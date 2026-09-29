import React from "react";
import Link from "next/link";
import { Handshake, ArrowRight, Package } from "lucide-react";

import { DashboardAllyPromotions } from "@/types/commercial/Dashboard.types";
import { formatCentsToCOP } from "./dashboard.format";
import { DashboardCard, EmptyState, SectionTitle } from "./dashboard.ui";

export function AllyPromotionsCard({
  allyPromotions,
}: {
  allyPromotions: DashboardAllyPromotions;
}) {
  return (
    <DashboardCard>
      <SectionTitle
        title="Aliados"
        subtitle={`Estás promocionando ${allyPromotions.promotedCount} ${
          allyPromotions.promotedCount === 1 ? "producto" : "productos"
        } de aliados`}
        action={
          <Link
            href="/commercial/allies"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#03548C] hover:underline whitespace-nowrap"
          >
            Ver todo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {allyPromotions.allies.length === 0 ? (
        <EmptyState message="Aún no promocionas productos de aliados." />
      ) : (
        <ul className="divide-y divide-gray-50">
          {allyPromotions.allies.map((ally) => (
            <li
              key={ally.productId}
              className="flex items-center gap-3 py-2.5"
            >
              {ally.productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ally.productImageUrl}
                  alt={ally.productName}
                  className="w-11 h-11 rounded-lg object-cover bg-gray-100 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {ally.productName}
                </p>
                <p className="truncate text-xs text-gray-500 inline-flex items-center gap-1">
                  <Handshake className="w-3 h-3 text-gray-400" />
                  {ally.allyCommercialName}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[#03548C]">
                {formatCentsToCOP(ally.priceCents)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
