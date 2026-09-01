"use client";

import React, { useMemo, useState } from "react";

import {
  DashboardActiveAsset,
  DashboardActiveAssets,
} from "@/types/commercial/Dashboard.types";
import { DashboardCard, EmptyState, SectionTitle } from "./dashboard.ui";

type AssetKey = keyof DashboardActiveAssets;

const TAB_CONFIG: {
  key: AssetKey;
  label: string;
  emptyMessage: string;
}[] = [
  { key: "ads", label: "Anuncios", emptyMessage: "No tienes anuncios activos." },
  {
    key: "brandedGames",
    label: "Juegos",
    emptyMessage: "No tienes juegos activos.",
  },
  {
    key: "surveys",
    label: "Encuestas",
    emptyMessage: "No tienes encuestas activas.",
  },
  {
    key: "products",
    label: "Productos",
    emptyMessage: "No tienes productos activos.",
  },
];

// Colores del chip de status. Se normaliza a mayúsculas y se cae a un neutro
// para cualquier valor no previsto.
function statusChipClass(status: string): string {
  const s = status.toUpperCase();
  if (/(ACTIV|APROB|APPROV|PUBLISH|LIVE|RUNNING)/.test(s))
    return "bg-green-100 text-green-700";
  if (/(PEND|REVIEW|REVIS|DRAFT|BORRADOR)/.test(s))
    return "bg-amber-100 text-amber-700";
  if (/(PAUS|RECHAZ|REJECT|EXPIR|FINAL|CLOSED|ARCHIV)/.test(s))
    return "bg-gray-200 text-gray-600";
  return "bg-gray-100 text-gray-600";
}

function AssetCard({ asset }: { asset: DashboardActiveAsset }) {
  const hasProgress =
    asset.progressPct != null && Number.isFinite(asset.progressPct);
  const pct = hasProgress
    ? Math.min(100, Math.max(0, asset.progressPct as number))
    : 0;

  return (
    <div className="rounded-lg border border-gray-100 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          {asset.title}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusChipClass(
            asset.status,
          )}`}
        >
          {asset.status}
        </span>
      </div>

      {hasProgress && (
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-[#03548C]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {asset.secondaryLabel && (
        <p className="mt-1.5 text-xs text-gray-500">{asset.secondaryLabel}</p>
      )}
    </div>
  );
}

export function ActiveAssetsSection({
  activeAssets,
}: {
  activeAssets: DashboardActiveAssets;
}) {
  // Solo las pestañas cuya clave viene presente (no null/ausente).
  const tabs = useMemo(
    () =>
      TAB_CONFIG.filter((tab) => {
        const list = activeAssets[tab.key];
        return list != null;
      }),
    [activeAssets],
  );

  const [activeKey, setActiveKey] = useState<AssetKey | null>(
    tabs[0]?.key ?? null,
  );

  if (!tabs.length) return null;

  const currentKey = tabs.some((t) => t.key === activeKey)
    ? (activeKey as AssetKey)
    : tabs[0].key;
  const currentTab = tabs.find((t) => t.key === currentKey)!;
  const items = activeAssets[currentKey] ?? [];

  return (
    <DashboardCard>
      <SectionTitle title="Activos activos" />

      <div className="mb-4 flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.key === currentKey;
          const count = activeAssets[tab.key]?.length ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                active
                  ? "border-[#03548C] text-[#03548C]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyState message={currentTab.emptyMessage} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
