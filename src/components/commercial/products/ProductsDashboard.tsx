"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Package, Search, Filter, Grid, List, PlusCircle, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { ProductStatus, ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { DashboardStats } from "@/types/Commercial.types";
import CommercialProductCard from "@/components/commercial/products/CommercialProductCard";
import CreateProductForm from "@/components/commercial/products/CreateProductForm";
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
  const [showCreateForm, setShowCreateForm] = useState(false);

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
          isGameReward: p.isGameReward,
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
    const isCurrentlyReward = target?.isGameReward ?? false;
    const rewardCount = products.filter((p) => p.isGameReward).length;

    if (!isCurrentlyReward && rewardCount >= 3) {
      toast.error("Solo puedes tener máximo 3 productos como recompensa de juego.");
      return;
    }

    try {
      await productService.markProductAsReward(productId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isGameReward: !p.isGameReward } : p
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
          <div className="w-16 h-16 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

  const renderProducts = () => {
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold text-gray-900">
        Todos tus productos
      </h2>
      <button
        onClick={() => setShowCreateForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#03548C] text-white rounded-xl font-semibold text-sm hover:bg-[#0b1440] transition"
      >
        <PlusCircle className="w-4 h-4" />
        Crear producto
      </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#03548C]"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <CommercialProductCard
              key={product.id}
              product={product}
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
            <CommercialProductCard
              key={product.id}
              product={product}
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
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pendientes</p>
          <p className="text-3xl font-extrabold text-yellow-500">{stats.totalPendingProducts}</p>
          <div className="mt-2 h-1 rounded-full bg-yellow-100">
            <div className="h-1 rounded-full bg-yellow-400" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Activos</p>
          <p className="text-3xl font-extrabold text-[#03548C]">{stats.totalActiveProducts}</p>
          <div className="mt-2 h-1 rounded-full bg-[#03548C]/10">
            <div className="h-1 rounded-full bg-[#03548C]" style={{ width: '80%' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rechazados</p>
          <p className="text-3xl font-extrabold text-red-500">{stats.totalRejectedProducts}</p>
          <div className="mt-2 h-1 rounded-full bg-red-100">
            <div className="h-1 rounded-full bg-red-400" style={{ width: '30%' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ventas totales</p>
          <p className="text-3xl font-extrabold text-green-600">{stats.totalSales}</p>
          <div className="mt-2 h-1 rounded-full bg-green-100">
            <div className="h-1 rounded-full bg-green-500" style={{ width: '70%' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rating promedio</p>
          <p className="text-3xl font-extrabold text-[#0b1440]">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
          </p>
          <p className="text-xs text-yellow-500 mt-1">{'★'.repeat(Math.round(stats.averageRating))}{'☆'.repeat(5 - Math.round(stats.averageRating))}</p>
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

  return (
    <>
      {renderSection()}

      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Crear producto</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <CreateProductForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}