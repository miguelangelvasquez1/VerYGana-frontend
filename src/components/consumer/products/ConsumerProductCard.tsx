"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Heart, Building2 } from "lucide-react";

import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { AddToCartButton } from "./AddToCartButton";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useActiveKeyPromotions } from "@/hooks/keys/useKeyPromotions";
import { KeyPromotionBadge } from "./KeyPromotionBadge";
import { KeysDiscountTag } from "@/components/shared/KeysDiscountTag";

interface ConsumerProductCardProps {
  product: ProductSummaryResponseDTO;
}

const ConsumerProductCard: React.FC<ConsumerProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { role } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { byProductId } = useActiveKeyPromotions();
  const promotion = byProductId.get(product.id);
  // Con promoción vigente el tope sube del ordinario al de la promoción.
  const keysPct = promotion ? Math.max(promotion.keysPct, product.maxKeysPct) : product.maxKeysPct;

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

        {promotion && (
          <div className="absolute top-3 left-3 right-14">
            <KeyPromotionBadge promotion={promotion} />
          </div>
        )}

        <KeysDiscountTag pct={keysPct} special={!!promotion} />

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
                router.push(`/commercial/${product.commercialPublicId}`);
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
