"use client";

import { useEffect, useState } from "react";
import { getFavorites, countFavorites } from "@/services/ProductService";
import ConsumerProductCard from "@/components/consumer/products/ConsumerProductCard";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import { Heart, Package, Loader2 } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [favorites, total] = await Promise.all([
          getFavorites(0),
          countFavorites(),
        ]);
        setProducts(favorites.data);
        setCount(total);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Heart className="w-3.5 h-3.5 text-[#FFD700]" />
            Tus productos guardados
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
            Mis favoritos
          </h1>

          <p className="text-white/70 text-sm sm:text-base max-w-lg">
            {loading
              ? "Cargando tus productos favoritos..."
              : count > 0
              ? `Tienes ${count} producto${count !== 1 ? "s" : ""} guardado${count !== 1 ? "s" : ""}`
              : "Aún no has guardado ningún producto favorito"}
          </p>
        </div>

        <div className="absolute -bottom-px left-0 right-0 leading-0">
          <svg className="block" viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 0 1080 0 1440 40 L1440 40 L0 40 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ══════════════ CONTENT ══════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#03548C]" />
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[#03548C]/10 flex items-center justify-center mb-5">
              <Heart className="w-9 h-9 text-[#03548C]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sin favoritos aún</h2>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              Explora el marketplace y guarda los productos que más te gusten con el botón ❤️
            </p>
            <Link href="/products">
              <button className="inline-flex items-center gap-2 bg-[#03548C] hover:bg-[#0b1440] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                <Package className="w-4 h-4" />
                Explorar productos
              </button>
            </Link>
          </div>
        )}

        {/* Grid de productos */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ConsumerProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
