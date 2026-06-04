"use client";

import React, { useState } from "react";
import { Star, Minus, Plus, Heart } from "lucide-react";
import { ProductResponseDTO } from "@/types/products/Product.types";
import { AddToCartButton } from "./AddToCartButton";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

interface Props {
  product: ProductResponseDTO;
  mode?: "consumer" | "commercial";
}

const ProductDetail: React.FC<Props> = ({ product, mode = "consumer" }) => {
  const { role } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <div className="space-y-10">

      {/* ===== MAIN PRODUCT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT – Images */}
        <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {mode === "consumer" && role === "CONSUMER" && (
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-md hover:scale-110 transition"
              >
                <Heart
                  className={`w-6 h-6 ${
                    isFavorite(product.id)
                      ? "fill-red-500 text-red-500"
                      : "text-gray-400"
                  }`}
                />
              </button>
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedImage(product.imageUrl)}
              className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                selectedImage === product.imageUrl
                  ? "border-[#014C92] shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={product.imageUrl}
                alt="thumb"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* RIGHT – Info */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">

          {/* Brand top strip */}
          <div
            className="h-1.5 w-full shrink-0"
            style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
          />

          <div className="p-6 space-y-5 flex flex-col flex-1">

            {/* Category badge */}
            <span
              className="inline-block text-white text-sm font-semibold px-3 py-1 rounded-full w-fit"
              style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
            >
              {product.categoryName}
            </span>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < product.averageRate
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.averageRate} ({product.reviewCount} reseñas)
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-extrabold" style={{ color: "#014C92" }}>
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(product.price)}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed text-sm">
              {product.description}
            </p>

            {/* Stock */}
            <span
              className={`inline-block text-sm font-semibold px-3 py-1 rounded-full w-fit ${
                product.stock > 10
                  ? "bg-green-100 text-green-700"
                  : product.stock > 0
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {product.stock > 0
                ? `${product.stock} unidades disponibles`
                : "Sin stock"}
            </span>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Cantidad</span>

                <div className="flex items-center border-2 rounded-xl overflow-hidden" style={{ borderColor: "#014C92" }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-blue-50 transition"
                    style={{ color: "#014C92" }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span
                    className="px-5 py-2 font-bold text-sm border-x-2"
                    style={{ borderColor: "#014C92", color: "#014C92" }}
                  >
                    {quantity}
                  </span>

                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="p-2 hover:bg-blue-50 transition"
                    style={{ color: "#014C92" }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA */}
            {mode === "consumer" && (
              <div className="mt-auto pt-2">
                <AddToCartButton
                  product={product}
                  quantity={quantity}
                  variant="primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== REVIEWS ===== */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Header con gradiente */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #014C92, #1EA5BD)" }}
        >
          <span className="text-lg">⭐</span>
          <h2 className="text-lg font-bold text-white">
            Reseñas del producto
          </h2>
          {product.reviews.length > 0 && (
            <span className="ml-auto text-sm text-white/80 font-medium">
              {product.reviews.length} reseña{product.reviews.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="p-6">
          {product.reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 font-medium">Este producto aún no tiene reseñas.</p>
              <p className="text-gray-400 text-sm mt-1">¡Sé el primero en opinar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border-l-4 rounded-xl bg-gray-50 hover:bg-blue-50/40 transition"
                  style={{ borderLeftColor: "#014C92" }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800">{review.consumerName}</h3>

                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;
