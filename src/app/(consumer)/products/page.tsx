"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Star,
  ShoppingCart,
} from "lucide-react";

import Navbar from "@/components/bars/NavBar";
import CategoryCard from "@/components/products/ProductCategoryCard";
import ProductCard from "@/components/products/ProductCard";
import SearchBar from "@/components/products/SearchBar";
import InfiniteScroll from "@/components/products/InfiniteScroll";
import Footer from "@/components/Footer";

// SERVICES
import { filterProducts, getAllProducts} from "@/services/ProductService";
import { getProductCategories } from "@/services/ProductCategoryService";

// TYPES
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { ProductCategoryResponseDTO } from "@/types/products/ProductCategory.types";

export default function ProductsPage() {
  // Estados principales
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [categories, setCategories] = useState<ProductCategoryResponseDTO[]>([]);

  // Modal producto
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  // Paginación (scroll infinito real)
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // ================================
  // Cargar categorías
  // ================================
  useEffect(() => {
    (async () => {
      const res = await getProductCategories();
      setCategories(res);
    })();
  }, []);

  // ================================
  // Cargar productos iniciales
  // ================================
  useEffect(() => {
    loadProducts(true);
  }, [searchTerm, selectedCategoryId, sortBy, sortDirection, maxPrice, minRating]);

  const loadProducts = async (reset = false) => {
    if (loading) return;

    setLoading(true);

    const res = await filterProducts({
      searchQuery: searchTerm || undefined,
      categoryId: selectedCategoryId || undefined,
      minRating: minRating || undefined,
      maxPrice: maxPrice || undefined,
      sortBy,
      sortDirection,
      page: reset ? 0 : currentPage,
    });

    if (reset) {
      setProducts(res.content);
      setCurrentPage(1);
    } else {
      setProducts((prev) => [...prev, ...res.content]);
      setCurrentPage((prev) => prev + 1);
    }

    setHasMore(!res.last);
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Navbar />

      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Descubre Productos</h1>
          <p className="text-lg mb-6">
            Encuentra miles de productos al mejor precio
          </p>

          <div className="max-w-2xl mx-auto">
            <SearchBar onSearch={setSearchTerm} />
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ================================
            CATEGORÍAS
        ================================= */}
        <h2 className="text-3xl font-bold mb-6">Categorías</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() =>
                setSelectedCategoryId(
                  selectedCategoryId === cat.id ? null : cat.id
                )
              }
              className={`cursor-pointer transition-all ${
                selectedCategoryId === cat.id
                  ? "ring-2 ring-blue-500 scale-105"
                  : "hover:scale-105"
              }`}
            >
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>

        {/* ================================
            FILTROS SUPERIORES
        ================================= */}
        <div className="bg-white border shadow-sm p-4 rounded-xl mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg"
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown
                className={`w-4 h-4 transition ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Right */}
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="createdAt">Más nuevos</option>
                <option value="price">Precio</option>
                <option value="averageRate">Mejor valorados</option>
              </select>

              {/* Vistas */}
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>

                <button
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* PANEL EXPANDIBLE */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block mb-2 font-medium">
                  Precio máximo: {maxPrice ? formatPrice(maxPrice) : "—"}
                </label>
                <input
                  type="range"
                  min={1000}
                  max={500000}
                  step={1000}
                  value={maxPrice ?? 500000}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Valoración mínima
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      onClick={() => setMinRating(n)}
                      className={`w-6 h-6 cursor-pointer ${
                        minRating && minRating >= n
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSearchTerm("");
                  setMaxPrice(undefined);
                  setMinRating(undefined);
                }}
                className="self-end px-4 py-2 border rounded-lg"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* ================================
            LISTADO DE PRODUCTOS (GRID 4x)
        ================================= */}
        <InfiniteScroll
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => loadProducts(false)}
          threshold={300}
        >
          {products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-300" />
              <h3 className="text-xl font-semibold mt-4">
                No hay productos disponibles
              </h3>
            </div>
          ) : (
            <div
              className={`grid gap-5 ${
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  mode="consumer"
                />
              ))}
            </div>
          )}
        </InfiniteScroll>
      </div>

      <Footer />
    </>
  );
}
