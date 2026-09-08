// Helpers de formato para el panel de inicio del comercial.

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const DECIMAL = new Intl.NumberFormat("es-CO");

// Montos en CENTAVOS -> "$1.234.567"
export const formatCentsToCOP = (cents: number | null | undefined): string =>
  COP.format(Math.round((cents ?? 0) / 100));

// Montos ya en PESOS (ej. topProducts[].price) -> "$1.234.567"
export const formatPesosToCOP = (pesos: number | null | undefined): string =>
  COP.format(Math.round(pesos ?? 0));

export const formatCount = (value: number | null | undefined): string =>
  DECIMAL.format(value ?? 0);

// "yyyy-MM-dd" -> "12 ago" (sin depender de la zona horaria del navegador).
export const formatShortDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};

export const formatLongDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export type DeltaDirection = "up" | "down" | "flat" | "new";

export interface DeltaDisplay {
  label: string;
  direction: DeltaDirection;
  // Clases de color para el chip (texto + fondo).
  chipClass: string;
}

// deltaPct: número (variación % vs periodo anterior). null => el periodo
// anterior fue 0 => etiqueta "nuevo".
export function describeDelta(
  deltaPct: number | null | undefined,
): DeltaDisplay {
  if (deltaPct == null) {
    return {
      label: "nuevo",
      direction: "new",
      chipClass: "text-[#03548C] bg-[#03548C]/10",
    };
  }

  const rounded = Math.round(deltaPct * 10) / 10;

  if (rounded === 0) {
    return {
      label: "0 %",
      direction: "flat",
      chipClass: "text-gray-500 bg-gray-100",
    };
  }

  const up = rounded > 0;
  const arrow = up ? "▲" : "▼";
  const abs = DECIMAL.format(Math.abs(rounded));

  return {
    label: `${arrow} ${abs} %`,
    direction: up ? "up" : "down",
    chipClass: up ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100",
  };
}
