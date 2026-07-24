"use client";

import { useState, useEffect } from "react";
import { Star, ShoppingCart, Package, X, SlidersHorizontal, ChevronRight } from "lucide-react";

import ConsumerProductCard from "@/components/consumer/products/ConsumerProductCard";
import SearchBar from "@/components/consumer/products/SearchBar";
import InfiniteScroll from "@/components/consumer/products/InfiniteScroll";
import { filterProducts } from "@/services/ProductService";
import { getActiveProductCategories } from "@/services/ProductCategoryService";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { ProductCategoryResponseDTO } from "@/types/products/ProductCategory.types";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [categories, setCategories] = useState<ProductCategoryResponseDTO[]>([]);

  // Reactive – trigger fetch immediately on change
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Draft – staged in sidebar/drawer, applied on button click or search
  const [draftSortBy, setDraftSortBy] = useState("createdAt");
  const [draftSortDirection, setDraftSortDirection] = useState("DESC");
  const [draftMaxPrice, setDraftMaxPrice] = useState<number | undefined>();
  const [draftMinRating, setDraftMinRating] = useState<number | undefined>();

  // Applied – these actually drive the fetch
  const [appliedSortBy, setAppliedSortBy] = useState("createdAt");
  const [appliedSortDirection, setAppliedSortDirection] = useState("DESC");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>();
  const [appliedMinRating, setAppliedMinRating] = useState<number | undefined>();

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimateHero(true), 50);
    return () => clearTimeout(t);
  }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategoryId, appliedSortBy, appliedSortDirection, appliedMaxPrice, appliedMinRating]);

  const loadProducts = async (pageToLoad: number, reset = false) => {
    if (loading) return;
    setLoading(true);
    const res = await filterProducts({
      searchQuery: searchTerm || undefined,
      categoryId: selectedCategoryId || undefined,
      minRating: appliedMinRating,
      maxPrice: appliedMaxPrice,
      sortBy: appliedSortBy,
      sortDirection: appliedSortDirection,
      page: pageToLoad,
    });
    if (reset) setProducts(res.data);
    else setProducts((prev) => [...prev, ...res.data]);
    setHasMore(res.meta.hasNext);
    setLoading(false);
  };

  const handleDraftSortChange = (value: string) => {
    const [by, dir] = value.split(":");
    setDraftSortBy(by);
    setDraftSortDirection(dir);
  };

  const applyAllDrafts = () => {
    setAppliedSortBy(draftSortBy);
    setAppliedSortDirection(draftSortDirection);
    setAppliedMaxPrice(draftMaxPrice);
    setAppliedMinRating(draftMinRating);
  };

  const applyFilters = () => {
    applyAllDrafts();
    setShowMobileFilters(false);
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    applyAllDrafts();
  };

  const clearFilters = () => {
    setDraftSortBy("createdAt");
    setDraftSortDirection("DESC");
    setDraftMaxPrice(undefined);
    setDraftMinRating(undefined);
    setAppliedSortBy("createdAt");
    setAppliedSortDirection("DESC");
    setAppliedMaxPrice(undefined);
    setAppliedMinRating(undefined);
    setShowMobileFilters(false);
  };

  const hasPendingChanges =
    draftSortBy !== appliedSortBy ||
    draftSortDirection !== appliedSortDirection ||
    draftMaxPrice !== appliedMaxPrice ||
    draftMinRating !== appliedMinRating;

  const appliedFiltersCount = [
    appliedMaxPrice !== undefined,
    appliedMinRating !== undefined,
    `${appliedSortBy}:${appliedSortDirection}` !== "createdAt:DESC",
  ].filter(Boolean).length;

  const hasAnyFilters =
    draftSortBy !== "createdAt" ||
    draftSortDirection !== "DESC" ||
    draftMaxPrice !== undefined ||
    draftMinRating !== undefined ||
    appliedSortBy !== "createdAt" ||
    appliedSortDirection !== "DESC" ||
    appliedMaxPrice !== undefined ||
    appliedMinRating !== undefined;

  const renderPriceRatingFilters = (compact = false) => (
    <div className="space-y-5">
      <div>
        <label className={`block mb-2 font-bold text-gray-500 uppercase tracking-wider ${compact ? "text-xs" : "text-sm"}`}>
          Precio máximo
        </label>
        <input
          type="number"
          step={1000}
          value={draftMaxPrice ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw) { setDraftMaxPrice(undefined); return; }
            const val = Number(raw);
            if (!isNaN(val) && val > 0) setDraftMaxPrice(val);
          }}
          onBlur={() => {
            if (draftMaxPrice !== undefined) {
              if (draftMaxPrice < 1000) setDraftMaxPrice(1000);
              else if (draftMaxPrice >= 500000) setDraftMaxPrice(undefined);
            }
          }}
          placeholder="Sin límite"
          className={`w-full px-2.5 py-1.5 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none focus:border-[#014C92] transition mb-2.5 ${compact ? "text-xs" : "text-sm"}`}
          style={{ color: "#014C92" }}
        />
        <input
          type="range"
          min={1000}
          max={500000}
          step={1000}
          value={draftMaxPrice ?? 500000}
          onChange={(e) => {
            const val = Number(e.target.value);
            setDraftMaxPrice(val === 500000 ? undefined : val);
          }}
          className="w-full accent-[#014C92]"
        />
        <div className={`flex justify-between mt-1 text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>
          <span>$1.000</span>
          <span>$500.000</span>
        </div>
      </div>

      <div>
        <label className={`block mb-2 font-bold text-gray-500 uppercase tracking-wider ${compact ? "text-xs" : "text-sm"}`}>
          Valoración mínima
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              onClick={() => setDraftMinRating(draftMinRating === n ? undefined : n)}
              className={`cursor-pointer transition ${compact ? "w-6 h-6" : "w-7 h-7"} ${
                draftMinRating && draftMinRating >= n
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ══════════════ HERO ══════════════ */}
      <section
        className="relative overflow-hidden text-white bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440]"
        style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-cyan-400/10" />

        <div className={`relative w-full px-4 sm:px-6 lg:px-10 pt-10 pb-16 text-center transition-all duration-700 ${animateHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Package className="w-3.5 h-3.5 text-yellow-300" />
            Usa tus llaves para comprar productos exclusivos
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight">
            Descubre Productos
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mb-7 max-w-lg mx-auto">
            Encuentra miles de productos al mejor precio.
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-0">
          <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ══════════════ CONTENT ══════════════ */}
      <div>
        <div className="px-4 sm:px-6 lg:pl-0 lg:pr-8 py-5">

          {/* Mobile: category chips */}
          <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto mb-3">
            <div className="flex gap-2 w-max pb-2">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition whitespace-nowrap cursor-pointer ${
                  selectedCategoryId === null
                    ? "text-white border-[#014C92]"
                    : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                }`}
                style={selectedCategoryId === null ? { background: "#014C92" } : undefined}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)
                  }
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition whitespace-nowrap bg-white cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? "border-[#014C92] text-[#014C92] bg-blue-50"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: sort + filter button */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 border-2 rounded-xl text-sm font-semibold border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrar
              {appliedFiltersCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] text-white rounded-full flex items-center justify-center font-bold"
                  style={{ background: "#014C92" }}
                >
                  {appliedFiltersCount}
                </span>
              )}
            </button>

            <select
              value={`${draftSortBy}:${draftSortDirection}`}
              onChange={(e) => handleDraftSortChange(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-200 bg-white rounded-xl text-sm font-medium focus:outline-none focus:border-[#014C92] transition"
            >
              <option value="createdAt:DESC">Más recientes</option>
              <option value="priceCents:ASC">Precio: menor a mayor</option>
              <option value="priceCents:DESC">Precio: mayor a menor</option>
              <option value="averageRate:DESC">Mejor valorados</option>
            </select>
          </div>

          <div className="flex gap-5">

            {/* ══ DESKTOP SIDEBAR ══ */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-4 space-y-4">

                {/* Categories */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-base">Categorías</h3>
                  </div>
                  <ul className="py-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    <li>
                      <button
                        onClick={() => setSelectedCategoryId(null)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50 ${
                          selectedCategoryId === null
                            ? "text-[#014C92] font-semibold bg-blue-50/70"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0">
                          🛒
                        </span>
                        <span className="flex-1 text-left text-sm">Todas</span>
                        {selectedCategoryId === null && (
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() =>
                            setSelectedCategoryId(
                              selectedCategoryId === cat.id ? null : cat.id
                            )
                          }
                          className={`w-full flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50 ${
                            selectedCategoryId === cat.id
                              ? "text-[#014C92] font-semibold bg-blue-50/70"
                              : "text-gray-700"
                          }`}
                        >
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <span className="flex-1 text-left text-sm line-clamp-1">
                            {cat.name}
                          </span>
                          {selectedCategoryId === cat.id && (
                            <ChevronRight className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sort + Filters + Apply */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-900 text-base">Ordenar y filtrar</h3>
                    {appliedFiltersCount > 0 && (
                      <span
                        className="text-[10px] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0"
                        style={{ background: "#014C92" }}
                      >
                        {appliedFiltersCount}
                      </span>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="mb-5">
                    <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Ordenar por
                    </label>
                    <select
                      value={`${draftSortBy}:${draftSortDirection}`}
                      onChange={(e) => handleDraftSortChange(e.target.value)}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#014C92] transition bg-white"
                    >
                      <option value="createdAt:DESC">Más recientes</option>
                      <option value="priceCents:ASC">Precio: menor → mayor</option>
                      <option value="priceCents:DESC">Precio: mayor → menor</option>
                      <option value="averageRate:DESC">Mejor valorados</option>
                    </select>
                  </div>

                  <div className="border-t border-gray-100 mb-5" />

                  {renderPriceRatingFilters()}

                  {/* Action buttons */}
                  <div className="mt-6 space-y-2.5">
                    <button
                      onClick={applyFilters}
                      disabled={!hasPendingChanges}
                      className="w-full py-3 rounded-xl text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #014C92, #1EA5BD)" }}
                    >
                      Aplicar filtros
                    </button>
                    {hasAnyFilters && (
                      <button
                        onClick={clearFilters}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-200 hover:bg-red-50 transition"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* ══ MAIN CONTENT ══ */}
            <main className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-3">
                {products.length} productos encontrados
              </p>

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
                {products.length === 0 && !loading ? (
                  <div
                    className="relative rounded-2xl overflow-hidden py-20 flex flex-col items-center justify-center text-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #014C92 0%, #1EA5BD 60%, #7c3aed 100%)",
                    }}
                  >
                    <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
                    <ShoppingCart className="w-14 h-14 text-white/50 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No hay productos disponibles
                    </h3>
                    <p className="text-white/70 text-sm">
                      Intenta con otros filtros o busca en otra categoría.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {products.map((product) => (
                      <ConsumerProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </InfiniteScroll>
            </main>
          </div>
        </div>
      </div>

      {/* ══ MOBILE FILTER BOTTOM DRAWER ══ */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Filtros</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-5 pt-5 pb-6 overflow-y-auto max-h-[65vh]">
              {renderPriceRatingFilters(true)}

              <button
                onClick={applyFilters}
                className="mt-6 w-full py-3 rounded-xl text-white font-bold text-sm transition"
                style={{ background: "linear-gradient(135deg, #014C92, #1EA5BD)" }}
              >
                Aplicar filtros
              </button>

              {hasAnyFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-200 hover:bg-red-50 transition"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
