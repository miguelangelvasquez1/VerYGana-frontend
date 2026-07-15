"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Eye, Pencil, Trash, Tag, Trophy, HelpCircle, X, Building2 } from "lucide-react";

import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { usePlanState } from "@/components/commercial/layout/DashboardLayout";
import { PlanCode } from "@/types/finance/plans/Plan.types";

interface CommercialProductCardProps {
  product: ProductSummaryResponseDTO;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onMarkAsReward?: (id: number) => void;
}

const helpItems = [
  {
    icon: <Eye className="w-5 h-5 text-blue-600" />,
    label: "Ver",
    description:
      "Consulta los detalles completos del producto: imágenes, descripción, reseñas y stock disponible.",
  },
  {
    icon: <Pencil className="w-5 h-5 text-yellow-600" />,
    label: "Editar",
    description:
      "Modifica el nombre, descripción, categoría, precio e imagen del producto.",
  },
  {
    icon: <Trash className="w-5 h-5 text-red-600" />,
    label: "Eliminar",
    description:
      "Elimina permanentemente el producto. Esta acción no se puede deshacer.",
  },
  {
    icon: <Trophy className="w-5 h-5 text-[#03548C]" />,
    label: "Marcar como recompensa",
    description:
      "Marca este producto como recompensa para que sea promocionado al final de los juegos que personalices y asi potencies tus ventas entre los jugadores. Máximo puedes tener 3 productos activos como recompensa simultáneamente.",
  },
];

const CommercialProductCard: React.FC<CommercialProductCardProps> = ({
  product,
  onView,
  onEdit,
  onDelete,
  onMarkAsReward,
}) => {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const { planState } = usePlanState();

  // Lee el estado directamente del DTO — no depende de prop externo
  const isGameReward = product.isGameReward;

  const canUseGameRewards =
    planState?.effectivePlan === PlanCode.STANDARD ||
    planState?.effectivePlan === PlanCode.PREMIUM;

  return (
    <>
      <div
        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden flex flex-col"
        onClick={() => onView?.(product.id)}
      >
        {/* Image */}
        <div className="relative w-full aspect-4/3 bg-gray-100 overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

          {product.maxKeysPct > 0 && (
            <div
              className="absolute bottom-0 left-0 flex flex-col items-center justify-center text-center shadow-md rounded-tr-[10px] sm:rounded-tr-2xl min-w-12 sm:min-w-18 px-2 pt-1.5 pb-1.5 sm:pl-3 sm:pr-3.5 sm:pt-2.5 sm:pb-3"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              <Tag
                className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white/80 mb-0.5"
                style={{ transform: "rotate(-45deg)" }}
              />
              <span className="text-white font-semibold leading-none uppercase tracking-wide text-[6px] sm:text-[9px]">Paga con</span>
              <span className="text-white font-semibold leading-none uppercase tracking-wide text-[6px] sm:text-[9px]">llaves y</span>
              <span className="text-white font-bold leading-none uppercase tracking-wide text-[7px] sm:text-[10px]">ahorra</span>
              <span className="text-white font-extrabold leading-none text-[17px] sm:text-[26px]" style={{ lineHeight: 1.1 }}>
                {product.maxKeysPct}%
              </span>
            </div>
          )}

          {canUseGameRewards && isGameReward && (
            <div className="absolute top-2 right-2 bg-[#03548C] text-white rounded-full px-2 py-0.5 flex items-center gap-1 shadow-md text-xs font-semibold">
              <Trophy className="w-3 h-3" />
              Recompensa activa
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 flex flex-col flex-1">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {product.name}
          </h3>

          <p className="text-sm sm:text-base font-bold text-gray-900">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(product.price)}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    i < Math.round(product.averageRate ?? 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-600 font-medium ml-0.5">
                {product.averageRate?.toFixed(1) ?? "0.0"}
              </span>
            </div>
            <span className="text-xs text-gray-400 ml-0.5">
              ({product.reviewCount})
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start gap-1.5 sm:gap-1 w-full min-w-0">
            {product.companyName && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/commercial/profile`);
                }}
                className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 min-w-0 max-w-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-[#03548C]/5 hover:border-[#03548C]/20 hover:text-[#03548C] transition cursor-pointer text-left"
              >
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{product.companyName}</span>
              </button>
            )}

            <p
              className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit whitespace-nowrap ${
                product.stock > 10
                  ? "bg-green-100 text-green-700"
                  : product.stock > 0
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
            </p>
          </div>

          {/* Commercial actions */}
          <div
            className="flex flex-wrap items-center gap-1 pt-2 border-t mt-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onView?.(product.id)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-[#00a4ff]/10 text-[#00a4ff] rounded-md hover:bg-[#00a4ff]/20 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Ver
            </button>

            <button
              onClick={() => onEdit?.(product.id)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>

            <button
              onClick={() => onDelete?.(product.id)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition cursor-pointer"
            >
              <Trash className="w-3.5 h-3.5" /> Eliminar
            </button>

            {canUseGameRewards && (
              <button
                onClick={() => onMarkAsReward?.(product.id)}
                className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-md transition cursor-pointer ${
                  isGameReward
                    ? "bg-[#03548C] text-white hover:bg-[#0b1440]"
                    : "bg-[#03548C]/10 text-[#03548C] hover:bg-[#03548C]/20"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                {isGameReward ? "Desmarcar como recompensa" : "Marcar como recompensa"}
              </button>
            )}

            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition ml-auto"
              title="Ayuda"
            >
              <HelpCircle className="w-3.5 h-3.5 cursor-pointer" />
            </button>
          </div>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Acciones del producto</h3>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5 cursor-pointer" />
              </button>
            </div>

            <ul className="space-y-4">
              {helpItems
                .filter((item) => item.label !== "Marcar como recompensa" || canUseGameRewards)
                .map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <span className="shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default CommercialProductCard;
