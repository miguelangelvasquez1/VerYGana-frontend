import React from "react";
import { ShoppingCart, Calendar, Users } from "lucide-react";
import { TicketEarningRuleType } from "@/types/raffles/ticketEarningRule.types";

/* ============================================================
   FUENTE ÚNICA DE VERDAD para tipos de regla de tickets.

   Antes cada componente (form, card, management) mantenía su
   propio mapa de labels/colores/íconos, lo que permitía que se
   desincronizaran (p. ej. un tipo con un color en el filtro y
   otro en la tarjeta). Centralizarlo garantiza consistencia
   visual entre las 3 vistas (heurística de Nielsen "consistencia
   y estándares").
   ============================================================ */

export interface RuleTypeMeta {
  label: string;
  hint: string;
  icon: React.ReactNode;
  badgeClass: string;
}

export const RULE_TYPE_ORDER: TicketEarningRuleType[] = [
  TicketEarningRuleType.PURCHASE,
  TicketEarningRuleType.DAILY_LOGIN,
  TicketEarningRuleType.REFERRAL,
];

export const RULE_TYPE_META: Record<TicketEarningRuleType, RuleTypeMeta> = {
  [TicketEarningRuleType.PURCHASE]: {
    label: "Por Compra",
    hint: "Otorga tickets al realizar una compra que supere el monto mínimo",
    icon: <ShoppingCart className="w-4 h-4" />,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  [TicketEarningRuleType.DAILY_LOGIN]: {
    label: "Login Diario",
    hint: "Otorga tickets por cada día que el usuario inicie sesión",
    icon: <Calendar className="w-4 h-4" />,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [TicketEarningRuleType.REFERRAL]: {
    label: "Por Referido",
    hint: "Otorga tickets al referir la cantidad indicada de nuevos usuarios",
    icon: <Users className="w-4 h-4" />,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
};
