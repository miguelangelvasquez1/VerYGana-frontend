"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Package, Search, Filter, Grid, List } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { ProductStatus, ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { DashboardStats } from "@/types/Commercial.types";
import ProductCard from "@/components/consumer/products/ProductCard";
import { useRouter, useSearchParams } from "next/navigation";
import TopSellingProducts from "@/components/commercial/products/commercialStats/TopSellingProducts";

// Servicios
import * as productService from "@/services/ProductService";
import * as productReviewService from "@/services/ProductReviewService";
import * as purchaseItemService from "@/services/PurchaseItemService";
import toast from "react-hot-toast";

export default function ProductsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "dashboard";
  const { isAuthenticated } = useAuth();

  const hasLoaded = useRef(false);

  // ================== Estados ==================
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPendingProducts: 0,
    totalActiveProducts: 0,
    totalRejectedProducts: 0,
    totalSales: 0,
    averageRating: 0,
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // ================== Cargar datos ==================
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        productService.getTotalCommercialProducts(ProductStatus.PENDING),
        productService.getTotalCommercialProducts(ProductStatus.ACTIVE),
        productService.getTotalCommercialProducts(ProductStatus.REJECTED),
        purchaseItemService.getTotalCommercialSales(),
        productReviewService.getCommercialAvgRating(),
        productService.getMyProducts(0),
      ]);

      const [
        totalPendingProductsRes,
        totalActiveProductsRes,
        totalRejectedProductsRes,
        totalSalesRes,
        ratingRes,
        productsRes,
      ] = results;

      // ===== Stats =====
      setStats({
        totalActiveProducts:
          totalActiveProductsRes.status === "fulfilled"
            ? totalActiveProductsRes.value
            : 0,
        totalPendingProducts:
          totalPendingProductsRes.status === "fulfilled"
            ? totalPendingProductsRes.value
            : 0,
        totalRejectedProducts:
          totalRejectedProductsRes.status === "fulfilled"
            ? totalRejectedProductsRes.value
            : 0,
        totalSales:
          totalSalesRes.status === "fulfilled"
            ? totalSalesRes.value
            : 0,
        averageRating:
          ratingRes.status === "fulfilled" ? ratingRes.value : 0,
      });

      // ===== Productos =====
      if (productsRes.status === "fulfilled") {
        const content = productsRes.value?.data ?? [];

        if (process.env.NODE_ENV === "development") {
          console.log("📦 Products:", content);
        }

        const mapped = content.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          price: p.price,
          maxKeysAllowed: p.maxKeysAllowed,
          maxKeysPct: p.maxKeysPct,
          minCashCents: p.minCashCents,
          averageRate: p.averageRate,
          reviewCount: p.reviewCount,
          stock: p.stock,
          categoryName: p.categoryName,
          status: p.status,
          commercialId: p.commercialId,
          companyName: p.companyName,
          gameReward: p.gameReward,
        }));
        setProducts(mapped);
      }
    } catch (err: any) {
      console.error("❌ Error loading dashboard:", err);
      setError(err?.response?.data?.message || "Error al cargar dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ================== EFFECT ==================
  useEffect(() => {
    if (!isAuthenticated || hasLoaded.current) return;

    hasLoaded.current = true;
    loadDashboardData();
  }, [isAuthenticated, loadDashboardData]);

  // ================== Toggle recompensa (máx. 3) ==================
  const handleToggleReward = async (productId: number) => {
    const target = products.find((p) => p.id === productId);
    const isCurrentlyReward = target?.gameReward ?? false;
    const rewardCount = products.filter((p) => p.gameReward).length;

    if (!isCurrentlyReward && rewardCount >= 3) {
      toast.error("Solo puedes tener máximo 3 productos como recompensa de juego.");
      return;
    }

    try {
      await productService.markProductAsReward(productId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, gameReward: !p.gameReward } : p
        )
      );
      toast.success(
        isCurrentlyReward
          ? "Recompensa desactivada correctamente."
          : "Producto marcado como recompensa de juego."
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al actualizar la recompensa.");
    }
  };

  // ================== Eliminar producto ==================
  const handleDeleteProduct = async (productId: number) => {
    const confirmed = window.confirm("¿Estás seguro de eliminar este producto?");
    if (!confirmed) return;

    try {
      await productService.deleteProduct(productId);
      await loadDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al eliminar el producto.");
    }
  };

  // ================== Filtros ==================
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // ================== LOADING ==================
  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // ================== ERROR ==================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ================== UI ==================

  const renderProducts = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">
        Todos tus productos
      </h2>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          <button className="border px-4 py-2 rounded-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </button>

          <button
            onClick={() =>
              setViewMode(viewMode === "grid" ? "list" : "grid")
            }
            className="border px-4 py-2 rounded-lg"
          >
            {viewMode === "grid" ? <List /> : <Grid />}
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery
              ? "No se encontraron productos con ese nombre"
              : "No tienes productos publicados"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              mode="commercial"
              isGameReward={product.gameReward}
              onDelete={() => handleDeleteProduct(product.id)}
              onEdit={() => router.push(`/commercial/products/edit/${product.id}`)}
              onMarkAsReward={() => handleToggleReward(product.id)}
              onView={() => router.push(`/commercial/products/${product.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              mode="commercial"
              isGameReward={product.gameReward}
              onDelete={() => handleDeleteProduct(product.id)}
              onEdit={() => router.push(`/commercial/products/edit/${product.id}`)}
              onMarkAsReward={() => handleToggleReward(product.id)}
              onView={() => router.push(`/products/${product.id}?mode=commercial`)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p className="text-gray-600">Vista general de tu negocio</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-yellow-500 rounded-xl p-6 text-white">
          <p className="text-sm">Productos pendientes</p>
          <p className="text-3xl font-bold mt-2">
            {stats.totalPendingProducts}
          </p>
        </div>

        <div className="bg-blue-500 rounded-xl p-6 text-white">
          <p className="text-sm">Productos activos</p>
          <p className="text-3xl font-bold mt-2">
            {stats.totalActiveProducts}
          </p>
        </div>

        <div className="bg-red-500 rounded-xl p-6 text-white">
          <p className="text-sm">Productos rechazados</p>
          <p className="text-3xl font-bold mt-2">
            {stats.totalRejectedProducts}
          </p>
        </div>

        <div className="bg-green-500 rounded-xl p-6 text-white">
          <p className="text-sm">Ventas Totales</p>
          <p className="text-3xl font-bold mt-2">
            {stats.totalSales}
          </p>
        </div>

        <div className="bg-purple-500 rounded-xl p-6 text-white">
          <p className="text-sm">Rating Promedio</p>
          <p className="text-3xl font-bold mt-2">
            {stats.averageRating > 0
              ? `${stats.averageRating.toFixed(2)} ⭐`
              : "N/A"}
          </p>
        </div>
      </div>

      <TopSellingProducts />

      <div className="pt-6 border-t">{renderProducts()}</div>
    </div>
  );

  const renderSection = () => {
    switch (section) {
      default:
        return renderDashboard();
    }
  };

  return <>{renderSection()}</>;
}