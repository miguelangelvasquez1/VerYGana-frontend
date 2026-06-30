"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pencil, Package, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { ProductResponseDTO } from "@/types/products/Product.types";
import ProductImageGallery from "@/components/shared/products/ProductImageGallery";
import ProductInfoCard from "@/components/shared/products/ProductInfoCard";
import ProductReviews from "@/components/shared/products/ProductReviews";
import { markProductAsReward } from "@/services/ProductService";

interface Props {
  product: ProductResponseDTO;
}

const ProductDetailCommercial: React.FC<Props> = ({ product }) => {
  const [isReward, setIsReward] = useState(product.gameReward ?? false);
  const [rewardLoading, setRewardLoading] = useState(false);

  const handleToggleReward = async () => {
    setRewardLoading(true);
    try {
      await markProductAsReward(product.id);
      setIsReward((prev) => !prev);
      toast.success(
        isReward
          ? "Recompensa desactivada correctamente."
          : "Producto marcado como recompensa de juego."
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al actualizar la recompensa.");
    } finally {
      setRewardLoading(false);
    }
  };

  const managementFooter = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/commercial/products/edit/${product.id}`}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }}
        >
          <Pencil className="w-4 h-4" />
          Editar producto
        </Link>
        <Link
          href={`/commercial/products/${product.id}/stock`}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold border-2 transition hover:bg-blue-50"
          style={{ borderColor: "#014C92", color: "#014C92" }}
        >
          <Package className="w-4 h-4" />
          Gestionar stock
        </Link>
      </div>

      <button
        onClick={handleToggleReward}
        disabled={rewardLoading}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold border-2 transition disabled:opacity-60 disabled:cursor-not-allowed ${
          isReward
            ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
            : "border-purple-600 text-purple-600 hover:bg-purple-50"
        }`}
      >
        <Trophy className="w-4 h-4" />
        {rewardLoading
          ? "Procesando..."
          : isReward
          ? "Recompensa activa"
          : "Marcar como recompensa"}
      </button>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductImageGallery product={product} />
        <ProductInfoCard product={product} footer={managementFooter} />
      </div>
      <ProductReviews reviews={product.reviews} />
    </div>
  );
};

export default ProductDetailCommercial;
