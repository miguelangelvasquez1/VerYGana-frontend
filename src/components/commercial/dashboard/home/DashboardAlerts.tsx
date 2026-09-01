import React from "react";
import Link from "next/link";
import { AlertTriangle, Info, ArrowRight } from "lucide-react";

import {
  DashboardAlert,
  DashboardAlertSeverity,
  DashboardAlertType,
} from "@/types/commercial/Dashboard.types";

// Alertas de saldo publicitario (agotado / bajo): NO se pintan aquí porque el
// layout del panel comercial ya muestra un banner global
// (WalletExhaustedBanner / WalletLowBalanceBanner) en todas las pantallas
// cuando el presupuesto se agota o queda bajo. Evita el banner duplicado.
const ALERTS_HANDLED_BY_LAYOUT: DashboardAlertType[] = [
  "BUDGET_SUSPENDED",
  "LOW_BALANCE",
];

// A dónde lleva el CTA de cada tipo de alerta.
const ALERT_HREF: Record<DashboardAlertType, string> = {
  ONBOARDING_INCOMPLETE: "/commercial-onboarding",
  PLAN_CHANGE_PENDING: "/commercial/plan-change",
  BUDGET_SUSPENDED: "/commercial/balance",
  LOW_BALANCE: "/commercial/balance",
};

const SEVERITY_STYLES: Record<
  DashboardAlertSeverity,
  { wrap: string; icon: string; title: string; body: string; cta: string }
> = {
  CRITICAL: {
    wrap: "bg-red-50 border-red-200",
    icon: "text-red-500",
    title: "text-red-800",
    body: "text-red-700",
    cta: "bg-red-600 text-white hover:bg-red-700",
  },
  WARNING: {
    wrap: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    title: "text-amber-800",
    body: "text-amber-700",
    cta: "bg-amber-600 text-white hover:bg-amber-700",
  },
  INFO: {
    wrap: "bg-gray-50 border-gray-200",
    icon: "text-gray-500",
    title: "text-gray-800",
    body: "text-gray-600",
    cta: "bg-[#03548C] text-white hover:bg-[#0b1440]",
  },
};

function AlertBanner({ alert }: { alert: DashboardAlert }) {
  const styles = SEVERITY_STYLES[alert.severity];
  const Icon = alert.severity === "INFO" ? Info : AlertTriangle;
  const href = ALERT_HREF[alert.type];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${styles.wrap}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${styles.icon}`} />
      <p className={`flex-1 min-w-0 text-sm font-medium ${styles.body}`}>
        <span className={`font-semibold ${styles.title}`}>{alert.message}</span>
      </p>
      {alert.actionHint && href && (
        <Link
          href={href}
          className={`shrink-0 inline-flex items-center gap-1.5 self-center rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${styles.cta}`}
        >
          {alert.actionHint}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// Lista de "Pendientes" — se renderiza arriba del todo si hay alguna.
// Orden: CRITICAL primero, luego WARNING, luego INFO.
const SEVERITY_ORDER: Record<DashboardAlertSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

export function DashboardAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  const visible = alerts.filter(
    (alert) => !ALERTS_HANDLED_BY_LAYOUT.includes(alert.type),
  );

  if (!visible.length) return null;

  const sorted = [...visible].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div className="space-y-2">
      {sorted.map((alert, i) => (
        <AlertBanner key={`${alert.type}-${i}`} alert={alert} />
      ))}
    </div>
  );
}
