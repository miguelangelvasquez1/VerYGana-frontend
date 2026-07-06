"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Building2,
  MapPin,
  Star,
  Package,
  CalendarDays,
  LayoutGrid,
  AlertCircle,
  ArrowLeft,
  Tag,
  MessageCircle,
} from "lucide-react";

import { getCommercialProfile } from "@/services/CommercialService";
import { getCommercialProducts } from "@/services/ProductService";
import { CommercialProfileResponseDTO } from "@/types/Commercial.types";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import ProductCard from "@/components/consumer/products/ProductCard";
import InfiniteScroll from "@/components/consumer/products/InfiniteScroll";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CommercialProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const commercialId = Number(id);

  const [profile, setProfile] = useState<CommercialProfileResponseDTO | null>(null);
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getCommercialProfile(commercialId);
        setProfile(data);
        // Seed products from the profile response (page 0 already included)
        setProducts(data.activeProducts.data);
        setHasMore(data.activeProducts.meta.hasNext);
        setCurrentPage(0);
      } catch {
        setProfileError(true);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [commercialId]);

  const loadMoreProducts = async () => {
    if (productsLoading || !hasMore) return;
    setProductsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const res = await getCommercialProducts(commercialId, nextPage);
      setProducts((prev) => [...prev, ...res.data]);
      setHasMore(res.meta.hasNext);
      setCurrentPage(nextPage);
    } finally {
      setProductsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div
          className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#014C92", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="w-14 h-14 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">Vendedor no encontrado</p>
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold underline underline-offset-2 transition hover:opacity-70"
          style={{ color: "#014C92" }}
        >
          Volver
        </button>
      </div>
    );
  }

  const stars = Math.round(profile.averageRate ?? 0);
  const location = [profile.municipalityName, profile.departmentName].filter(Boolean).join(", ");

  return (
    <div className="bg-gray-50 min-h-screen pb-14">
      <div className="max-w-425 mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <div className="pt-5 pb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>

        {/* ── HEADER CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          {/* Gradient bar */}
          <div className="h-2 w-full" style={{ background: "linear-gradient(to right, #014C92, #1EA5BD)" }} />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-start">
              {/* Avatar */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                style={{ background: "linear-gradient(135deg, #014C92 0%, #1EA5BD 100%)" }}
              >
                <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {profile.companyName}
                </h1>

                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
                  {location && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                      {location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CalendarDays className="w-4 h-4 shrink-0 text-gray-400" />
                    Miembro desde {formatDate(profile.registeredDate)}
                  </span>
                </div>

                {/* Star rating + review count */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < stars ? "fill-amber-400 text-amber-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {profile.averageRate?.toFixed(1) ?? "0.0"}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({profile.reviewCount} {profile.reviewCount === 1 ? "reseña" : "reseñas"})
                  </span>
                </div>
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
                <div>
                  <p className="text-xl font-extrabold text-gray-900 leading-none">
                    {profile.averageRate?.toFixed(1) ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Valoración</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3">
                <MessageCircle className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="text-xl font-extrabold text-gray-900 leading-none">
                    {profile.reviewCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profile.reviewCount === 1 ? "Reseña" : "Reseñas"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
                <Package className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xl font-extrabold text-gray-900 leading-none">
                    {profile.totalActiveProducts}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Productos activos</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-3">
                <LayoutGrid className="w-6 h-6 text-purple-500 shrink-0" />
                <div>
                  <p className="text-xl font-extrabold text-gray-900 leading-none">
                    {profile.productCategories.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profile.productCategories.length === 1 ? "Categoría" : "Categorías"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORIES ── */}
        {profile.productCategories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Categorías
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.productCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600"
                >
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Productos de{" "}
            <span style={{ color: "#014C92" }}>{profile.companyName}</span>
          </h2>
          <span className="text-sm text-gray-400">{profile.totalActiveProducts} productos</span>
        </div>

        <InfiniteScroll
          loading={productsLoading}
          hasMore={hasMore}
          onLoadMore={loadMoreProducts}
          threshold={300}
        >
          {products.length === 0 && !productsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                Este vendedor no tiene productos disponibles aún.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} mode="consumer" />
              ))}
            </div>
          )}
        </InfiniteScroll>
      </div>
    </div>
  );
}
