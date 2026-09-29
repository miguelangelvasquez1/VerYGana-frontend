"use client";

import React, { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { useCommercialDashboard } from "@/hooks/commercial/useCommercialDashboard";
import { DEFAULT_DASHBOARD_PERIOD } from "@/services/commercial/DashboardService";
import { DashboardPeriodType } from "@/types/commercial/Dashboard.types";

import { formatLongDate } from "./dashboard.format";
import { DashboardAlerts } from "./DashboardAlerts";
import { PeriodSelector } from "./PeriodSelector";
import { KpiSection } from "./KpiSection";
import { SalesTrendChart } from "./SalesTrendChart";
import { TopProductsCard } from "./TopProductsCard";
import { ChannelBreakdownCard } from "./ChannelBreakdownCard";
import { PlanUsageCard } from "./PlanUsageCard";
import { ActiveAssetsSection } from "./ActiveAssetsSection";
import { QuickActionsRow } from "./QuickActionsRow";
import { AllyPromotionsCard } from "./AllyPromotionsCard";

export function CommercialDashboard() {
  const [period, setPeriod] = useState<DashboardPeriodType>(
    DEFAULT_DASHBOARD_PERIOD,
  );
  const { data, isLoading, isError, isFetching, refetch } =
    useCommercialDashboard(period);

  // Carga inicial (sin datos previos todavía).
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <p className="text-sm font-semibold text-gray-900">
          No pudimos cargar tu panel
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Ocurrió un error al obtener el resumen. Intenta de nuevo.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#03548C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0b1440] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  const {
    period: periodInfo,
    sales,
    salesTrend,
    topProducts,
    engagement,
    channelBreakdown,
    planUsage,
    activeAssets,
    allyPromotions,
    quickActions,
    alerts,
  } = data;

  const showSecondRow = topProducts != null || channelBreakdown != null;

  return (
    <div className="space-y-6">
      {/* 1. Pendientes */}
      <DashboardAlerts alerts={alerts} />

      {/* 2. Selector de periodo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-400">
            {formatLongDate(periodInfo.startDate)} —{" "}
            {formatLongDate(periodInfo.endDate)}
          </p>
          {isFetching && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Actualizando…
            </p>
          )}
        </div>
        <PeriodSelector
          value={period}
          onChange={setPeriod}
          loading={isFetching}
        />
      </div>

      {/* 3. KPIs */}
      <KpiSection sales={sales} engagement={engagement} />

      {/* 4. Tendencia de ventas */}
      {salesTrend != null && <SalesTrendChart trend={salesTrend} />}

      {/* 5. Top productos + rendimiento por canal */}
      {showSecondRow && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topProducts != null && <TopProductsCard products={topProducts} />}
          {channelBreakdown != null && (
            <ChannelBreakdownCard breakdown={channelBreakdown} />
          )}
        </div>
      )}

      {/* 6. Uso vs. límites del plan */}
      {planUsage != null && <PlanUsageCard usage={planUsage} />}

      {/* 7. Activos activos */}
      {activeAssets != null && (
        <ActiveAssetsSection activeAssets={activeAssets} />
      )}

      {/* 8. Accesos directos */}
      <QuickActionsRow actions={quickActions} />

      {/* 9. Aliados (solo PREMIUM) */}
      {allyPromotions != null && (
        <AllyPromotionsCard allyPromotions={allyPromotions} />
      )}
    </div>
  );
}
