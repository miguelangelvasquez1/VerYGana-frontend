"use client";

import React, { useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";
import { ProductResponseDTO } from "@/types/products/Product.types";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { AddToCartButton } from "./AddToCartButton";
import ProductImageGallery from "@/components/shared/products/ProductImageGallery";
import ProductInfoCard from "@/components/shared/products/ProductInfoCard";
import ProductReviews from "@/components/shared/products/ProductReviews";

interface Props {
  product: ProductResponseDTO;
}

const ProductDetailConsumer: React.FC<Props> = ({ product }) => {
  const { role } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [quantity, setQuantity] = useState(1);

  const favoriteButton =
    role === "CONSUMER" ? (
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
    ) : null;

  const cartFooter = (
    <div className="space-y-4">
      {product.stock > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700">Cantidad</span>
          <div
            className="flex items-center border-2 rounded-xl overflow-hidden"
            style={{ borderColor: "#014C92" }}
          >
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
      <AddToCartButton product={product} quantity={quantity} variant="primary" />
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductImageGallery product={product} overlay={favoriteButton} />
        <ProductInfoCard product={product} footer={cartFooter} />
      </div>
      <ProductReviews reviews={product.reviews} />
    </div>
  );
};

export default ProductDetailConsumer;
