"use client";

import React, { useMemo, useState } from "react";
import { Calendar, Download, Lock } from "lucide-react";

import { usePlanState } from "../layout/DashboardLayout";
import { PlanCode } from "@/types/finance/plans/Plan.types";
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

const makeDefaultRange = (): DateRangeFilter => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
};

const QUICK_RANGES = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

export function AnalyticsDashboard() {
  const { planState, loadingPlan } = usePlanState();
  const effectivePlan = (planState?.effectivePlan as PlanCode | null) ?? null;

  const [dateRange, setDateRange] = useState<DateRangeFilter>(makeDefaultRange);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");

  const canExportPdf = hasPlanAccess(effectivePlan, [PlanCode.PREMIUM]);

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({ startDate: toIsoDate(start), endDate: toIsoDate(end) });
  };

  const activeSectionConfig = useMemo(
    () => ANALYTICS_SECTIONS.find((s) => s.id === activeSection)!,
    [activeSection],
  );

  const renderContent = () => {
    if (activeSection !== "overview" && !hasPlanAccess(effectivePlan, activeSectionConfig.allowedPlans)) {
      return (
        <PlanLockedSection
          title={`${activeSectionConfig.label} no disponible`}
          message={activeSectionConfig.lockedMessage}
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
        return <OverviewSection effectivePlan={effectivePlan} onNavigate={setActiveSection} />;
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
            {/* DATE RANGE */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                Desde
                <input
                  type="date"
                  value={dateRange.startDate}
                  max={dateRange.endDate}
                  onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                Hasta
                <input
                  type="date"
                  value={dateRange.endDate}
                  min={dateRange.startDate}
                  onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))}
                  className="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C]"
                />
              </label>
            </div>

            {/* QUICK RANGES */}
            <div className="flex items-center gap-1.5">
              {QUICK_RANGES.map((r) => (
                <button
                  key={r.days}
                  type="button"
                  onClick={() => applyQuickRange(r.days)}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* EXPORT BUTTON — solo plan Premium */}
          <button
            type="button"
            disabled={!canExportPdf}
            title={canExportPdf ? undefined : "Disponible solo en el plan Premium"}
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
            const unlocked = hasPlanAccess(effectivePlan, section.allowedPlans);
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
