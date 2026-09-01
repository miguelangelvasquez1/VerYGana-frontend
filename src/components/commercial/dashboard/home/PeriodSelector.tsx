import React from "react";

import { DASHBOARD_PERIOD_OPTIONS } from "@/services/commercial/DashboardService";
import { DashboardPeriodType } from "@/types/commercial/Dashboard.types";

interface PeriodSelectorProps {
  value: DashboardPeriodType;
  onChange: (period: DashboardPeriodType) => void;
  // true mientras se re-consulta el nuevo periodo.
  loading?: boolean;
}

export function PeriodSelector({ value, onChange, loading }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Periodo">
      {DASHBOARD_PERIOD_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={loading && active}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              active
                ? "bg-[#03548C] text-white"
                : "text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
