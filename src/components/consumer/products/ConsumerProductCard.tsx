"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Tag, Heart, Building2 } from "lucide-react";

import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { AddToCartButton } from "./AddToCartButton";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

interface ConsumerProductCardProps {
  product: ProductSummaryResponseDTO;
}

const ConsumerProductCard: React.FC<ConsumerProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { role } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <div
      className="bg-white border border-gray-300 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden flex flex-col"
      onClick={() => router.push(`/products/${product.id}`)}
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
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

        {role === "CONSUMER" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"
              }`}
            />
          </button>
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
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
          </div>
          <span className="text-xs sm:text-sm text-gray-400 sm:ml-0.5">
            ({product.reviewCount} {product.reviewCount === 1 ? "reseña" : "reseñas"})
          </span>
        </div>

        <div className="flex flex-wrap sm:flex-col items-start gap-1.5 sm:gap-1 w-full min-w-0">
          {product.companyName && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/commercial/${product.commercialId}`);
              }}
              className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 min-w-0 max-w-full border border-gray-200 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-cyan-500 transition cursor-pointer text-left"
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

        <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
          <AddToCartButton product={product} variant="primary" />
        </div>
      </div>
    </div>
  );
};

export default ConsumerProductCard;
