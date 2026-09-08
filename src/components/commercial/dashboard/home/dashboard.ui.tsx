import React from "react";

import { describeDelta } from "./dashboard.format";

// Tarjeta base reutilizada por todas las secciones del panel.
export function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-gray-400">{message}</p>
  );
}

// Chip con la variación vs. periodo anterior (▲/▼ y %, o "nuevo").
export function DeltaChip({
  deltaPct,
}: {
  deltaPct: number | null | undefined;
}) {
  const delta = describeDelta(deltaPct);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${delta.chipClass}`}
    >
      {delta.label}
    </span>
  );
}
