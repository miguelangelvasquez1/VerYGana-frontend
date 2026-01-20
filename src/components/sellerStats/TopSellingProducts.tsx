"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

import { FeaturedProductResponseDTO } from "@/types/purchases/purchaseItem.types";
import { PagedResponse } from "@/types/GenericTypes";
import * as purchaseItemService from "@/services/PurchaseItemService";

export default function TopSellingProducts() {
  const [products, setProducts] = useState<FeaturedProductResponseDTO[]>([]);
  const [meta, setMeta] = useState<PagedResponse<any>["meta"] | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const pageSize = 5;

  const loadTopProducts = async (currentPage: number) => {
    try {
      setLoading(true);
      const response = await purchaseItemService.getTopSellingProductsPage(
        pageSize,
        currentPage
      );

      setProducts(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error("Error loading top selling products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopProducts(page);
  }, [page]);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Productos más vendidos
          </h3>
        </div>

        {/* PAGINADOR */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!meta?.hasPrevious || loading}
            className="p-2 border rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta?.hasNext || loading}
            className="p-2 border rounded-lg disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">Cargando productos...</p>
      )}

      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-4 border rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {product.name}
              </p>
              <p className="text-sm text-gray-500">
                ${product.price.toLocaleString("es-CO")}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-green-600">
                {product.totalSales} ventas
              </p>
              <p className="text-sm text-yellow-500">
                ⭐ {product.averageRate}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
