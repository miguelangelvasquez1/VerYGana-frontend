"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Star, Eye, Pencil, Trash, Heart, Tag } from "lucide-react";

import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { AddToCartButton } from "./AddToCartButton";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

interface ProductCardProps {
  product: ProductSummaryResponseDTO;
  mode?: "consumer" | "commercial";
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  mode = "consumer",
  onView,
  onEdit,
  onDelete,
}) => {
  const router = useRouter();
  const { role } = useAuth();

  const { isFavorite, toggleFavorite } = useFavorites();

  const handleClick = () => {
    if (mode === "commercial") {
      onView?.(product.id);
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden flex flex-col"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* Subtle bottom overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

        {/* Discount badge — tag-style sticker, bottom-left */}
        {product.maxKeysPct > 0 && (
          <div
            className="absolute bottom-0 left-0 flex flex-col items-center justify-center text-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              borderRadius: "0 16px 0 0",
              padding: "10px 14px 12px 12px",
              minWidth: "72px",
            }}
          >
            {/* Tag icon */}
            <Tag
              className="w-4 h-4 text-white/80 mb-0.5"
              style={{ transform: "rotate(-45deg)" }}
            />
            {/* Label */}
            <span
              className="text-white font-semibold leading-none uppercase tracking-wide"
              style={{ fontSize: "9px" }}
            >
              Paga con
            </span>
            <span
              className="text-white font-semibold leading-none uppercase tracking-wide"
              style={{ fontSize: "9px" }}
            >
              llaves y
            </span>
            <span
              className="text-white font-bold leading-none uppercase tracking-wide"
              style={{ fontSize: "10px" }}
            >
              ahorra
            </span>
            {/* Percentage — hero number */}
            <span
              className="text-white font-extrabold leading-none"
              style={{ fontSize: "26px", lineHeight: 1.1 }}
            >
              {product.maxKeysPct}%
            </span>
          </div>
        )}

        {/* Favorite button (CONSUMER only) */}
        {mode === "consumer" && role === "CONSUMER" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite(product.id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400"
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex flex-col flex-1">
        {/* Name */}
        <h3 className="text-base font-semibold text-gray-800 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-xl font-bold" style={{ color: "#000000" }}>
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(product.price)}
        </p>

        {/* Rating + review count */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(product.averageRate ?? 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-200"
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 font-medium ml-1">
            {product.averageRate?.toFixed(1) ?? "0.0"}
          </span>
          {product.reviewCount > 0 && (
            <span className="text-sm text-gray-400">
              ({product.reviewCount} reseñas)
            </span>
          )}
        </div>

        {/* Keys discount pill */}
        {product.maxKeysPct > 0 && (
          <p
            className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 w-fit border"
            style={{
              color: "#c2410c",
              backgroundColor: "#fff7ed",
              borderColor: "#fed7aa",
            }}
          >
            🔑 Ahorra hasta un {product.maxKeysPct}% usando llaves
          </p>
        )}

        {/* Stock */}
        <p
          className={`text-xs font-semibold px-3 py-1 rounded-full inline-block w-fit ${
            product.stock > 10
              ? "bg-green-100 text-green-700"
              : product.stock > 0
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
        </p>

        {/* Commercial actions */}
        {mode === "commercial" && (
          <div
            className="flex items-center justify-between pt-3 border-t mt-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onView?.(product.id)}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
            >
              <Eye className="w-4 h-4" /> Ver
            </button>

            <button
              onClick={() => onEdit?.(product.id)}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>

            <button
              onClick={() => onDelete?.(product.id)}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
            >
              <Trash className="w-4 h-4" /> Eliminar
            </button>
          </div>
        )}

        {/* Consumer actions */}
        {mode === "consumer" && (
          <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
            <AddToCartButton product={product} variant="primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;