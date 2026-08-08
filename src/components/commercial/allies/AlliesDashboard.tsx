"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Handshake, Megaphone, ShoppingCart, X } from "lucide-react";
import toast from "react-hot-toast";

import SearchBar from "@/components/consumer/products/SearchBar";
import InfiniteScroll from "@/components/consumer/products/InfiniteScroll";
import AllyProductCard from "@/components/commercial/allies/AllyProductCard";
import { filterProducts } from "@/services/ProductService";
import { getActiveProductCategories } from "@/services/ProductCategoryService";
import { useAllyPromotions } from "@/hooks/commercial/useAllyPromotions";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { ProductCategoryResponseDTO } from "@/types/products/ProductCategory.types";
import { formatPesos } from "@/utils/currency";

type Tab = "search" | "promotions";

export default function AlliesDashboard() {
  const [tab, setTab] = useState<Tab>("search");

  // ── Búsqueda de productos ──
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [categories, setCategories] = useState<ProductCategoryResponseDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // ── Promociones ──
  const {
    promotions,
    promotionsLoading,
    promotedIds,
    togglingIds,
    handleTogglePromote,
  } = useAllyPromotions();

  useEffect(() => {
    (async () => {
      const res = await getActiveProductCategories();
      setCategories(res);
    })();
  }, []);

  const loadProducts = useCallback(
    async (pageToLoad: number, reset = false) => {
      setLoading(true);
      try {
        const res = await filterProducts({
          searchQuery: searchTerm || undefined,
          categoryId: selectedCategoryId || undefined,
          sortBy,
          sortDirection,
          page: pageToLoad,
        });
        setProducts((prev) => (reset ? res.data : [...prev, ...res.data]));
        // No confiar solo en meta.hasNext: si el backend responde una página
        // vacía o inválida (ej. 400 al pasarse del total de páginas), cortamos
        // la paginación en vez de dejar que el InfiniteScroll reintente sin fin.
        setHasMore(res.data.length > 0 && res.meta.hasNext);
      } catch {
        setHasMore(false);
        toast.error("Error al cargar productos.");
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedCategoryId, sortBy, sortDirection]
  );

  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    loadProducts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategoryId, sortBy, sortDirection]);

  const handleSortChange = (value: string) => {
    const [by, dir] = value.split(":");
    setSortBy(by);
    setSortDirection(dir);
  };


  const tabs: { id: Tab; label: string; icon: typeof Handshake }[] = useMemo(
    () => [
      { id: "search", label: "Buscar productos", icon: ShoppingCart },
      { id: "promotions", label: `Mis promociones (${promotions.length})`, icon: Megaphone },
    ],
    [promotions.length]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Handshake className="w-6 h-6 text-[#03548C]" />
          Aliados
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Busca productos de otros vendedores y elige cuáles promocionar en el pop up final de tus juegos. Al promocionar un producto, su vendedor se convierte automáticamente en tu aliado.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
                active
                  ? "border-[#03548C] text-[#03548C]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "search" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar onSearch={setSearchTerm} />
            </div>
            <select
              value={`${sortBy}:${sortDirection}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 bg-white rounded-xl text-sm font-medium focus:outline-none focus:border-[#014C92] transition"
            >
              <option value="createdAt:DESC">Más recientes</option>
              <option value="priceCents:ASC">Precio: menor a mayor</option>
              <option value="priceCents:DESC">Precio: mayor a menor</option>
              <option value="averageRate:DESC">Mejor valorados</option>
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
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
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No se encontraron productos con esos filtros.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {products.map((product) => (
                  <AllyProductCard
                    key={product.id}
                    product={product}
                    isPromoted={promotedIds.has(product.id)}
                    isToggling={togglingIds.has(product.id)}
                    onTogglePromote={handleTogglePromote}
                  />
                ))}
              </div>
            )}
          </InfiniteScroll>
        </div>
      ) : (
        <div className="space-y-3">
          {promotionsLoading && promotions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#03548C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Aún no estás promocionando ningún producto. Ve a "Buscar productos" para elegir el primero.
              </p>
            </div>
          ) : (
            promotions.map((promo) => (
              <div
                key={promo.productId}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
              >
                <img
                  src={promo.productImageUrl}
                  alt={promo.productName}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{promo.productName}</p>
                  <p className="text-xs text-gray-500 truncate">{promo.allyCommercialName}</p>
                  <p className="text-sm font-bold text-[#03548C] mt-0.5">
                    ${formatPesos(promo.priceCents)}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePromote(promo.productId)}
                  disabled={togglingIds.has(promo.productId)}
                  className="shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                  title="Quitar promoción"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
