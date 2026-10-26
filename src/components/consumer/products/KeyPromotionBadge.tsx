"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { ActiveKeyPromotionDTO } from "@/types/keys/KeyPromotion.types";
import { formatColombiaDate, formatColombiaDateTime } from "@/utils/keys";
import { SPECIAL_KEYS_BACKGROUND, SPECIAL_KEYS_TEXT_CLASS } from "@/components/shared/KeysDiscountTag";

// Insignia y aviso de promoción especial de llaves (MP-12).
//
// OJO (exigencia del contrato): una promoción NO es un premio — nunca decir
// que el usuario "ganó" el producto — y siempre se muestra la fecha de fin.
// Es informativo: el tope real del usuario lo da la cotización del checkout.

// Insignia compacta para las tarjetas del catálogo.
export function KeyPromotionBadge({ promotion }: { promotion: ActiveKeyPromotionDTO }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold leading-tight shadow-md sm:text-[11px] ${SPECIAL_KEYS_TEXT_CLASS}`}
      style={{ background: SPECIAL_KEYS_BACKGROUND }}
    >
      <Sparkles className="h-3 w-3 shrink-0" />
      <span className="truncate">
        Hasta {promotion.keysPct} % con Llaves · hasta {formatColombiaDate(promotion.endsAt)}
      </span>
    </span>
  );
}

// Aviso completo para el detalle del producto, con los términos.
export function KeyPromotionNotice({ promotion }: { promotion: ActiveKeyPromotionDTO }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-700">
        <Sparkles className="h-3.5 w-3.5" />
        Promoción especial · {promotion.promotionName}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-gray-900">
        Puedes cubrir hasta el {promotion.keysPct} % de este producto con tus Llaves.
      </p>
      <p className="mt-1 text-xs text-gray-600">
        Válida hasta {formatColombiaDateTime(promotion.endsAt)}. El tope exacto para tu compra lo verás antes de pagar.
      </p>
      {promotion.termsText && (
        <p className="mt-2 whitespace-pre-line border-t border-orange-200 pt-2 text-xs leading-relaxed text-gray-500">
          {promotion.termsText}
        </p>
      )}
    </div>
  );
}
