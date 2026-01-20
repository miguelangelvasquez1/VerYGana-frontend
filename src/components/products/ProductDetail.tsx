"use client";

import React, { useState } from "react";
import {
  Star,
  Minus,
  Plus,
  Heart,
} from "lucide-react";
import { ProductResponseDTO } from "@/types/products/Product.types";
import { AddToCartButton } from "./AddToCartButton";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

interface Props {
  product: ProductResponseDTO;
  mode?: "consumer" | "seller";
}

const ProductDetail: React.FC<Props> = ({
  product,
  mode = "consumer",
}) => {
  const { role, isAuthenticated } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const { isFavorite, toggleFavorite } = useFavorites();


  return (
    <div className="space-y-12">
      {/* ===== MAIN PRODUCT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT – Images */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {mode === "consumer" && role === "CONSUMER" && (
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-4 right-4 bg-white p-3 rounded-full shadow hover:scale-105 transition"
              >
                <Heart
                  className={`w-6 h-6 ${isFavorite(product.id)
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
              className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === product.imageUrl
                  ? "border-blue-500"
                  : "border-gray-300"
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
        <div className="bg-white rounded-2xl shadow p-6 space-y-6">

          {/* Category */}
          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
            {product.categoryName}
          </span>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < product.averageRate
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {product.averageRate} ({product.reviewCount} reseñas)
            </span>
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(product.price)}
          </div>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed">
            {product.description}
          </p>

          {/* Stock */}
          <span
            className={`inline-block text-sm px-3 py-1 rounded-full ${product.stock > 10
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
              <span className="text-sm font-medium">Cantidad</span>

              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2"
                >
                  <Minus />
                </button>

                <span className="px-4 border-x">{quantity}</span>

                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="p-2"
                >
                  <Plus />
                </button>
              </div>
            </div>
          )}

          {/* CTA */}
          {mode === "consumer" && (
            <AddToCartButton
              product={product}
              quantity={quantity}
              variant="primary"
            />
          )}
        </div>
      </div>

      {/* ===== REVIEWS ===== */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-6">
          Reseñas del producto
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.reviews.length === 0 && (
            <p className="text-gray-500">
              Este producto aún no tiene reseñas.
            </p>
          )}

          {product.reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border rounded-xl bg-gray-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{review.consumerName}</h3>

                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                        }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 text-sm">{review.comment}</p>

              <p className="text-xs text-gray-500 mt-2">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
