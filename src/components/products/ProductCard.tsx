"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Eye, Pencil, Trash, Heart } from "lucide-react";

import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { AddToCartButton } from "./AddToCartButton";
import { addToFavorites, removeFromFavorites } from "@/services/ProductService";
import { useAuth } from "@/hooks/useAuth";

interface ProductCardProps {
  product: ProductSummaryResponseDTO;
  mode?: "consumer" | "seller"; // default: consumer
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
  const { role, isAuthenticated } = useAuth();

  // ====== Estado local para favoritos (UX optimista) ======
  const [isFavorite, setIsFavorite] = useState<boolean>(product.isFavorite);
  const [favLoading, setFavLoading] = useState(false);

  // ====== Click principal de la card ======
  const handleClick = () => {
    if (mode === "seller") {
      onView?.(product.id);
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  // ====== Favoritos (solo CONSUMER) ======
  const handleToggleFavorite = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (!isAuthenticated || role !== "CONSUMER") return;

    try {
      setFavLoading(true);

      if (isFavorite) {
        await removeFromFavorites(product.id);
        setIsFavorite(false);
      } else {
        await addToFavorites(product.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite", error);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden border"
      onClick={handleClick}
    >
      {/* ===== Image ===== */}
      <div className="relative w-full h-52 bg-gray-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* ===== Favorite button (CONSUMER only) ===== */}
        {mode === "consumer" && role === "CONSUMER" && (
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:scale-105 transition"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400"
              }`}
            />
          </button>
        )}
      </div>

      {/* ===== Content ===== */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-xl font-bold text-gray-900">
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
          }).format(product.price)}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 text-yellow-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(product.averageRate ?? 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 ml-1">
            {product.averageRate?.toFixed(1) ?? "0.0"}
          </span>
        </div>

        {/* Stock */}
        <p
          className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
            product.stock > 10
              ? "bg-green-100 text-green-700"
              : product.stock > 0
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {product.stock > 0
            ? `${product.stock} disponibles`
            : "Sin stock"}
        </p>

        {/* ===== Seller actions ===== */}
        {mode === "seller" && (
          <div
            className="flex items-center justify-between pt-3 border-t"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onView?.(product.id)}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <Eye className="w-4 h-4" /> Ver
            </button>

            <button
              onClick={() => onEdit?.(product.id)}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>

            <button
              onClick={() => onDelete?.(product.id)}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <Trash className="w-4 h-4" /> Eliminar
            </button>
          </div>
        )}

        {/* ===== Consumer actions ===== */}
        {mode === "consumer" && (
          <div onClick={(e) => e.stopPropagation()}>
            <AddToCartButton product={product} variant="primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
