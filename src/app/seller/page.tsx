"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  Grid,
  List,
  ShoppingBag,
  BarChart3,
  Wallet,
} from "lucide-react";

import CreateProductForm from "@/components/forms/CreateProductForm";
import { useAuth } from "@/hooks/useAuth";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { DashboardStats } from "@/types/Seller.types";
import ProductCard from "@/components/products/ProductCard";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Servicios
import * as productService from "@/services/ProductService";
import * as walletService from "@/services/WalletService";
import * as productReviewService from "@/services/ProductReviewService";
import * as purchaseItemService from "@/services/PurchaseItemService";

export default function SellerDashboard() {
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  const { role, isAuthenticated } = useAuth();
  const router = useRouter();

  // Estados UI
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? "dashboard";

  // ========== Cargar datos ==========
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [
        totalProductsData,
        totalSalesData,
        availableBalanceData,
        averageRatingData,
        myProductsData,
      ] = await Promise.all([
        productService.getTotalSellerProducts(),
        purchaseItemService.getTotalSellerSales(),
        walletService.getAvailableBalance(),
        productReviewService.getSellerAvgRating(),
        productService.getMyProducts(0),
      ]);

      console.log("📦 Backend response:", myProductsData);

      setStats({
        totalProducts: totalProductsData,
        totalSales: totalSalesData,
        totalRevenue: availableBalanceData,
        averageRating: averageRatingData,
      });

      const content = myProductsData?.data ?? [];
      console.log("📋 Content array:", content);
      console.log("📋 Content length:", content.length);

      setProducts(
        content.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          stock: p.stock,
          categoryName: p.categoryName,
          averageRate: p.averageRate,
          isFavorite: p.isFavorite,
        }))
      );
    } catch (err: any) {
      console.error("❌ Error loading dashboard:", err);
      setError(err.response?.data?.message || "Error al cargar dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== EFFECT: Cargar datos al montar y cuando cambie la sección ==========
  useEffect(() => {
    if (isAuthenticated && role === "SELLER") {
      loadDashboardData();
    }
  }, [isAuthenticated, role, section]);

  // ========== Eliminar producto ==========
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      await productService.deleteProduct(productId);
      await loadDashboardData();
      alert("Producto eliminado correctamente");
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar");
    }
  };

  // ========== Retiros ==========
  const handleWithdrawal = async () => {
    const amount = prompt("¿Cuánto deseas retirar?");
    const paymentMethod = prompt("Cuenta bancaria para recibir el pago:");

    const value = Number(amount);

    if (!value || isNaN(value) || value <= 0) {
      alert("Cantidad inválida");
      return;
    }

    if (!paymentMethod) {
      alert("Selecciona un método de pago antes de continuar");
      return;
    }

    try {
      await walletService.doWithdrawal({ amount: value, paymentMethod });
      alert("Solicitud realizada con éxito");
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error en el retiro");
    }
  };

  // ========== Filtros ==========
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log("🔍 Filtered products count:", filteredProducts.length);

  // ========== LOADING ==========
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

  // ========== ERROR ==========
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

  // ========== SECCIONES ==========
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p className="text-gray-600">Vista general de tu negocio</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm">Total Productos</p>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm">Ventas Totales</p>
          <p className="text-3xl font-bold mt-2">{stats.totalSales}</p>
          <p className="text-green-100 text-xs">Próximamente</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-purple-100 text-sm">Balance Disponible</p>
          <p className="text-3xl font-bold mt-2">
            ${stats.totalRevenue.toLocaleString("es-CO")}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <p className="text-yellow-100 text-sm">Rating Promedio</p>
          <p className="text-3xl font-bold mt-2">
            {stats.averageRating > 0 ? `${stats.averageRating} ⭐` : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Mis Productos</h2>

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
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
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
              mode="seller"
              onDelete={() => handleDeleteProduct(product.id)}
              onEdit={() => router.push(`/seller/products/edit/${product.id}`)}
              onView={() => router.push(`/products/${product.id}?mode=seller`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              mode="seller"
              onDelete={() => handleDeleteProduct(product.id)}
              onEdit={() => router.push(`/seller/products/edit/${product.id}`)}
              onView={() => router.push(`/products/${product.id}?mode=seller`)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateProduct = () => (
    <div className="p-4">
      <CreateProductForm />
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Análisis de Ventas</h2>
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto" />
        <p className="text-gray-500 mt-4">
          Próximamente gráficos y estadísticas...
        </p>
      </div>
    </div>
  );

  const renderWithdrawals = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Retiros</h2>
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <Wallet className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <p className="text-gray-500">Saldo disponible</p>
        <p className="text-5xl font-bold">
          ${stats.totalRevenue.toLocaleString("es-CO")}
        </p>
        <button
          onClick={handleWithdrawal}
          className="w-full mt-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          Solicitar Retiro
        </button>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (section) {
      case "products":
        return renderProducts();
      case "create":
        return renderCreateProduct();
      case "analytics":
        return renderAnalytics();
      case "withdrawals":
        return renderWithdrawals();
      default:
        return renderDashboard();
    }
  };

  return <>{renderSection()}</>;
}