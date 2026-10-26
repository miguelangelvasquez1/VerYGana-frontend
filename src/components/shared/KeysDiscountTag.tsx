import React from "react";
import { Tag } from "lucide-react";

// Etiqueta "Paga con llaves y ahorra N%" de las tarjetas de producto. El tono
// de azul sube con el porcentaje; la promoción especial va en dorado.

interface KeysDiscountTagProps {
  pct: number;
  // Promoción especial de llaves vigente para el producto.
  special?: boolean;
}

const TIERS = [
  { min: 50, background: "linear-gradient(135deg, #03548C 0%, #0b1440 100%)" },
  { min: 30, background: "linear-gradient(135deg, #0089d6 0%, #03548C 100%)" },
  { min: 0, background: "linear-gradient(135deg, #00a4ff 0%, #0089d6 100%)" },
];

// Dorado con brillo metálico (admin-gold y admin-yellow): marca la promoción
// como única y limitada. El texto va en azul oscuro para que se lea sobre el oro.
export const SPECIAL_KEYS_BACKGROUND =
  "linear-gradient(135deg, #c9a227 0%, #FFD700 38%, #ffeb8a 52%, #FFD700 66%, #c9a227 100%)";
export const SPECIAL_KEYS_TEXT_CLASS = "text-[#0b1440]";

export function KeysDiscountTag({ pct, special = false }: KeysDiscountTagProps) {
  if (pct <= 0) return null;

  const background = special ? SPECIAL_KEYS_BACKGROUND : TIERS.find((tier) => pct >= tier.min)!.background;

  return (
    <div
      className={`absolute bottom-0 left-0 flex flex-col items-center justify-center text-center shadow-md rounded-tr-[10px] sm:rounded-tr-2xl min-w-12 sm:min-w-18 px-2 pt-1.5 pb-1.5 sm:pl-3 sm:pr-3.5 sm:pt-2.5 sm:pb-3 ${
        special ? SPECIAL_KEYS_TEXT_CLASS : "text-white"
      }`}
      style={{ background }}
    >
      <Tag className="w-2.5 h-2.5 sm:w-4 sm:h-4 opacity-80 mb-0.5" style={{ transform: "rotate(-45deg)" }} />
      <span className="font-semibold leading-none uppercase tracking-wide text-[6px] sm:text-[9px]">Paga con</span>
      <span className="font-semibold leading-none uppercase tracking-wide text-[6px] sm:text-[9px]">llaves y</span>
      <span className="font-bold leading-none uppercase tracking-wide text-[7px] sm:text-[10px]">ahorra</span>
      <span className="font-extrabold leading-none text-[17px] sm:text-[26px]" style={{ lineHeight: 1.1 }}>
        {pct}%
      </span>
    </div>
  );
}
