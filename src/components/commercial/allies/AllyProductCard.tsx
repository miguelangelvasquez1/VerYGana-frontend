"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Building2, Check, Loader2, Megaphone } from "lucide-react";

import { ProductSummaryResponseDTO } from "@/types/products/Product.types";

interface AllyProductCardProps {
  product: ProductSummaryResponseDTO;
  isPromoted: boolean;
  isToggling: boolean;
  onTogglePromote: (productId: number) => void;
}

const AllyProductCard: React.FC<AllyProductCardProps> = ({
  product,
  isPromoted,
  isToggling,
  onTogglePromote,
}) => {
  const router = useRouter();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center"
        />
        {isPromoted && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
            <Megaphone className="w-3 h-3" />
            Promocionando
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex flex-col flex-1">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        <p className="text-base sm:text-xl font-bold text-gray-900">
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(product.price)}
        </p>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                i < Math.round(product.averageRate ?? 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-200"
              }`}
            />
          ))}
          <span className="text-xs sm:text-sm text-gray-600 font-medium ml-0.5 sm:ml-1">
            {product.averageRate?.toFixed(1) ?? "0.0"}
          </span>
          <span className="text-xs sm:text-sm text-gray-400">
            ({product.reviewCount})
          </span>
        </div>

        {product.companyName && (
          <button
            onClick={() => router.push(`/commercial/allies/${product.commercialId}`)}
            className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 min-w-0 max-w-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-cyan-500 transition cursor-pointer text-left w-fit"
          >
            <Building2 className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{product.companyName}</span>
          </button>
        )}

        <div className="mt-auto pt-2">
          <button
            onClick={() => onTogglePromote(product.id)}
            disabled={isToggling}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
              isPromoted
                ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100"
                : "text-white hover:opacity-90"
            }`}
            style={
              isPromoted
                ? undefined
                : { background: "linear-gradient(135deg, #014C92, #1EA5BD)" }
            }
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPromoted ? (
              <>
                <Check className="w-4 h-4" />
                Promocionando
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                Promocionar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllyProductCard;
