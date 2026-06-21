"use client";

import { useState, useEffect } from "react";
import {
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Star,
  ShoppingCart,
  Package,
} from "lucide-react";

import CategoryCard from "@/components/consumer/products/ProductCategoryCard";
import ProductCard from "@/components/consumer/products/ProductCard";
import SearchBar from "@/components/consumer/products/SearchBar";
import InfiniteScroll from "@/components/consumer/products/InfiniteScroll";

import { filterProducts } from "@/services/ProductService";
import { getActiveProductCategories } from "@/services/ProductCategoryService";

import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { ProductCategoryResponseDTO } from "@/types/products/ProductCategory.types";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [categories, setCategories] = useState<ProductCategoryResponseDTO[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getActiveProductCategories();
      setCategories(res);
    })();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    loadProducts(0, true);
  }, [searchTerm, selectedCategoryId, sortBy, sortDirection, maxPrice, minRating]);

  const loadProducts = async (pageToLoad: number, reset = false) => {
    if (loading) return;

    setLoading(true);

    const res = await filterProducts({
      searchQuery: searchTerm || undefined,
      categoryId: selectedCategoryId || undefined,
      minRating,
      maxPrice,
      sortBy,
      sortDirection,
      page: pageToLoad,
    });

    if (reset) {
      setProducts(res.data);
    } else {
      setProducts((prev) => [...prev, ...res.data]);
    }

    setHasMore(res.meta.hasNext);
    setLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <>
      {/* ══════════════ HERO ══════════════ */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #003d80 0%, #0060b8 50%, #0089d6 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-cyan-400/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Package className="w-3.5 h-3.5 text-yellow-300" />
            Usa tus llaves para comprar productos exclusivos
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
            Descubre Productos
          </h1>
          <p className="text-blue-100 text-base lg:text-lg mb-8 max-w-lg mx-auto">
            Encuentra miles de productos al mejor precio.
          </p>

          <div className="max-w-2xl mx-auto">
            <SearchBar onSearch={setSearchTerm} />
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════════════ CONTENT ══════════════ */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10">

          {/* ── Categorías ── */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ background: "linear-gradient(to bottom, #014C92, #1EA5BD)" }}
            />
            <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() =>
                  setSelectedCategoryId(
                    selectedCategoryId === cat.id ? null : cat.id
                  )
                }
                className={`cursor-pointer transition-all rounded-xl p-2 ${
                  selectedCategoryId === cat.id
                    ? "ring-2 ring-[#014C92] scale-105 bg-blue-50/50"
                    : "hover:scale-105 hover:bg-gray-50"
                }`}
              >
                <CategoryCard category={cat} />
              </div>
            ))}
          </div>

          {/* ── Filtros ── */}
          <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">

              {/* Filter toggle button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border-2 rounded-xl font-semibold text-sm transition ${
                  showFilters
                    ? "border-[#014C92] text-[#014C92] bg-blue-50"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {/* Sort + view mode */}
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#014C92] transition"
                >
                  <option value="createdAt">Más nuevos</option>
                  <option value="price">Precio</option>
                  <option value="averageRate">Mejor valorados</option>
                </select>

                {/* View toggle */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    className={`p-2 rounded-lg transition ${
                      viewMode === "grid"
                        ? "text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    style={
                      viewMode === "grid"
                        ? { background: "linear-gradient(135deg, #014C92, #1EA5BD)" }
                        : {}
                    }
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>

                  <button
                    className={`p-2 rounded-lg transition ${
                      viewMode === "list"
                        ? "text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    style={
                      viewMode === "list"
                        ? { background: "linear-gradient(135deg, #014C92, #1EA5BD)" }
                        : {}
                    }
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable filter panel */}
            {showFilters && (
              <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Precio máximo:{" "}
                    <span style={{ color: "#014C92" }}>
                      {maxPrice ? formatPrice(maxPrice) : "—"}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1000}
                    max={500000}
                    step={1000}
                    value={maxPrice ?? 500000}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#014C92]"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Valoración mínima
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        onClick={() => setMinRating(n)}
                        className={`w-6 h-6 cursor-pointer transition ${
                          minRating && minRating >= n
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setSearchTerm("");
                      setMaxPrice(undefined);
                      setMinRating(undefined);
                    }}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-red-300 hover:text-red-600 transition"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Productos ── */}
          <InfiniteScroll
            loading={loading}
            hasMore={hasMore}
            onLoadMore={() => {
              const nextPage = currentPage + 1;
              setCurrentPage(nextPage);
              loadProducts(nextPage);
            }}
            threshold={300}
          >
            {products.length === 0 ? (
              <div
                className="relative rounded-2xl overflow-hidden py-20 flex flex-col items-center justify-center text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #014C92 0%, #1EA5BD 60%, #7c3aed 100%)",
                }}
              >
                <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
                <ShoppingCart className="w-16 h-16 text-white/50 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No hay productos disponibles
                </h3>
                <p className="text-white/70 text-sm">
                  Intenta con otros filtros o busca en otra categoría.
                </p>
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
      </div>
    </>
  );
}
