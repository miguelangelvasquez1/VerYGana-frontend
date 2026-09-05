"use client";

import React, { useMemo, useState } from "react";
import { Calendar, Download, Lock } from "lucide-react";

import { usePlanState } from "../layout/DashboardLayout";
import { PlanCode } from "@/types/finance/plans/Plan.types";
import { isBudgetSuspended, WALLET_EXHAUSTED_TOOLTIP } from "../plans/WalletBudgetAlerts";
import { ANALYTICS_SECTIONS, SectionId, hasPlanAccess } from "../analytics/sections.config";
import { PlanLockedSection } from "../analytics/PlanLockedSection";
import type { DateRangeFilter } from "../analytics/analytics.types";

import { OverviewSection } from "../analytics/sections/OverviewSection";
import { AdsMetricsSection } from "../analytics/sections/AdsMetricsSection";
import { SurveysMetricsSection } from "../analytics/sections/SurveysMetricsSection";
import { GamesMetricsSection } from "../analytics/sections/GamesMetricsSection";
import { ReferralMetricsSection } from "../analytics/sections/ReferralMetricsSection";
import { PremiumExtrasSection } from "../analytics/sections/PremiumExtrasSection";
import SalesAnalytics from "../analytics/SalesAnalytics";

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const rangeForDays = (days: number): DateRangeFilter => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
};

type RangePreset = "7d" | "30d" | "90d" | "custom";

const RANGE_PRESETS: { id: RangePreset; label: string; days: number | null }[] = [
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "90d", label: "90 días", days: 90 },
  { id: "custom", label: "Personalizado", days: null },
];

// Gating de las pestañas conectadas a la API real. El resto de secciones
// (ventas, premium) sigue con el gating por plan de `sections.config`.
const FLAG_GATED: Partial<Record<SectionId, "performance" | "pageVisits">> = {
  ads: "performance",
  surveys: "performance",
  games: "performance",
  referrals: "pageVisits",
};

const UPSELL_MESSAGE: Record<"performance" | "pageVisits", string> = {
  performance: "Disponible en los planes Estándar y Premium",
  pageVisits: "Disponible exclusivamente en el plan Premium",
};

export function AnalyticsDashboard() {
  const { planState, loadingPlan } = usePlanState();
  const effectivePlan = (planState?.effectivePlan as PlanCode | null) ?? null;

  // Por defecto: últimos 30 días (el backend usa el mismo rango si no se envían params).
  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => rangeForDays(30));
  const [activeSection, setActiveSection] = useState<SectionId>("overview");

  const isSectionUnlocked = useMemo(
    () => (id: SectionId): boolean => {
      const cfg = ANALYTICS_SECTIONS.find((s) => s.id === id);
      const planOk = hasPlanAccess(effectivePlan, cfg?.allowedPlans ?? null);
      // Las pestañas conectadas se gatean por los flags de plan-state; si el
      // backend todavía no los envía se cae al gating por plan de siempre.
      const gate = FLAG_GATED[id];
      if (gate === "performance") return planState?.canViewPerformanceMetrics ?? planOk;
      if (gate === "pageVisits") return planState?.canViewPageVisitMetrics ?? planOk;
      return planOk;
    },
    [planState, effectivePlan],
  );

  const hasExportPlan = hasPlanAccess(effectivePlan, [PlanCode.PREMIUM]);
  // El export del reporte ejecutivo consume presupuesto — se bloquea con
  // el saldo agotado, igual que crear anuncios/encuestas/campañas.
  const budgetSuspended = isBudgetSuspended(planState);
  const canExportPdf = hasExportPlan && !budgetSuspended;
  const exportBlockedTitle = !hasExportPlan
    ? "Disponible solo en el plan Premium"
    : budgetSuspended
    ? WALLET_EXHAUSTED_TOOLTIP
    : undefined;

  const applyPreset = (preset: RangePreset) => {
    setRangePreset(preset);
    const match = RANGE_PRESETS.find((p) => p.id === preset);
    if (match?.days != null) {
      setDateRange(rangeForDays(match.days));
    }
  };

  const activeSectionConfig = useMemo(
    () => ANALYTICS_SECTIONS.find((s) => s.id === activeSection)!,
    [activeSection],
  );

  const renderContent = () => {
    if (activeSection !== "overview" && !isSectionUnlocked(activeSection)) {
      const gate = FLAG_GATED[activeSection];
      return (
        <PlanLockedSection
          title={`${activeSectionConfig.label} no disponible`}
          message={gate ? UPSELL_MESSAGE[gate] : activeSectionConfig.lockedMessage}
          ctaHref={gate ? "/commercial/plan-change" : "/plans"}
          ctaLabel={gate ? "Cambiar de plan" : "Ver planes disponibles"}
        />
      );
    }

    switch (activeSection) {
      case "sales":
        return <SalesAnalytics dateRange={dateRange} />;
      case "ads":
        return <AdsMetricsSection dateRange={dateRange} />;
      case "surveys":
        return <SurveysMetricsSection dateRange={dateRange} />;
      case "games":
        return <GamesMetricsSection dateRange={dateRange} />;
      case "referrals":
        return <ReferralMetricsSection dateRange={dateRange} />;
      case "premium":
        return <PremiumExtrasSection dateRange={dateRange} />;
      case "overview":
      default:
        return (
          <OverviewSection
            isSectionUnlocked={isSectionUnlocked}
            onNavigate={setActiveSection}
          />
        );
    }
  };

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ================== CONTROLES ================== */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* RANGE PRESETS */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex items-center gap-1.5">
                {RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      rangePreset === preset.id
                        ? "bg-[#03548C] text-white border-[#03548C]"
                        : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM DATE RANGE */}
            {rangePreset === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-sm text-gray-600">
                  Desde
                  <input
                    type="date"
                    value={dateRange.startDate}
                    max={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((r) => ({ ...r, startDate: e.target.value }))
                    }
                    className="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-sm text-gray-600">
                  Hasta
                  <input
                    type="date"
                    value={dateRange.endDate}
                    min={dateRange.startDate}
                    max={toIsoDate(new Date())}
                    onChange={(e) =>
                      setDateRange((r) => ({ ...r, endDate: e.target.value }))
                    }
                    className="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
                  />
                </label>
              </div>
            )}
          </div>

          {/* EXPORT BUTTON — solo plan Premium */}
          <button
            type="button"
            disabled={!canExportPdf}
            title={exportBlockedTitle}
            className={`flex items-center px-4 py-2 rounded-md transition-colors cursor-pointer ${
              canExportPdf
                ? "bg-[#03548C] text-white hover:bg-[#0b1440]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {canExportPdf ? (
              <Download className="w-4 h-4 mr-2" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            Generar Reporte PDF
          </button>
        </div>

        {/* ================== NAVEGACIÓN POR SECCIONES ================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {ANALYTICS_SECTIONS.map((section) => {
            const unlocked = isSectionUnlocked(section.id);
            const isActive = section.id === activeSection;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#03548C] text-white"
                    : unlocked
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.shortLabel}
                {!unlocked && <Lock className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================== CONTENIDO DINÁMICO ================== */}
      <div className="space-y-6">
        {renderContent()}
      </div>

    </div>
  );
}
