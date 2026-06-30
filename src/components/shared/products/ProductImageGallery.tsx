"use client";

import React, { useState } from "react";
import { ProductResponseDTO } from "@/types/products/Product.types";

interface Props {
  product: Pick<ProductResponseDTO, "imageUrl" | "name">;
  overlay?: React.ReactNode;
}

const ProductImageGallery: React.FC<Props> = ({ product, overlay }) => {
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
        <img
          src={selectedImage}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {overlay}
      </div>

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
  );
};

export default ProductImageGallery;
