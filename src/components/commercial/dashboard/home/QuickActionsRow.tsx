import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Megaphone,
  ClipboardList,
  Gamepad2,
  PackagePlus,
  FileDown,
  Wallet,
  Handshake,
} from "lucide-react";

import {
  DashboardQuickAction,
  DashboardQuickActionType,
} from "@/types/commercial/Dashboard.types";
import { DashboardCard, SectionTitle } from "./dashboard.ui";

const ACTION_CONFIG: Record<
  DashboardQuickActionType,
  { label: string; href: string; icon: LucideIcon }
> = {
  CREATE_AD: {
    label: "Crear anuncio",
    href: "/commercial/ads/create",
    icon: Megaphone,
  },
  CREATE_SURVEY: {
    label: "Crear encuesta",
    href: "/commercial/surveys/new",
    icon: ClipboardList,
  },
  CREATE_BRANDED_GAME: {
    label: "Crear juego",
    href: "/commercial/branding",
    icon: Gamepad2,
  },
  ADD_PRODUCT: {
    label: "Añadir producto",
    href: "/commercial/products/create",
    icon: PackagePlus,
  },
  EXPORT_REPORT: {
    label: "Exportar reporte",
    href: "/commercial/analytics",
    icon: FileDown,
  },
  RECHARGE_WALLET: {
    label: "Recargar billetera",
    href: "/commercial/balance",
    icon: Wallet,
  },
  MANAGE_ALLIES: {
    label: "Gestionar aliados",
    href: "/commercial/allies",
    icon: Handshake,
  },
};

function QuickActionButton({ action }: { action: DashboardQuickAction }) {
  const config = ACTION_CONFIG[action.action];
  if (!config) return null;

  const Icon = config.icon;
  const base =
    "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors";

  if (!action.enabled) {
    return (
      <span
        title={action.disabledReason ?? undefined}
        aria-disabled="true"
        className={`${base} cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300`}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  }

  return (
    <Link
      href={config.href}
      className={`${base} border-gray-200 bg-white text-gray-700 hover:border-[#03548C]/40 hover:text-[#03548C]`}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </Link>
  );
}

export function QuickActionsRow({
  actions,
}: {
  actions: DashboardQuickAction[];
}) {
  if (!actions.length) return null;

  return (
    <DashboardCard>
      <SectionTitle title="Accesos directos" />
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <QuickActionButton key={action.action} action={action} />
        ))}
      </div>
    </DashboardCard>
  );
}
