"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Building2,
  MapPin,
  CalendarDays,
  Star,
  Package,
  LayoutGrid,
  Tag,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCommercialProfile } from "@/services/commercialService";
import {
  deleteProduct,
  markProductAsReward,
  getCommercialProducts,
} from "@/services/ProductService";
import { CommercialProfileResponseDTO } from "@/types/Commercial.types";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import CommercialProductCard from "@/components/commercial/products/CommercialProductCard";
import toast from "react-hot-toast";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CommercialProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const commercialId = Number(user?.id);

  const [profile, setProfile] = useState<CommercialProfileResponseDTO | null>(null);
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!commercialId || isNaN(commercialId)) return;
    const load = async () => {
      try {
        const data = await getCommercialProfile(commercialId);
        setProfile(data);
        setProducts(data.activeProducts.data);
        setHasMore(data.activeProducts.meta.hasNext);
        setCurrentPage(0);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [commercialId]);

  const loadMore = async () => {
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

  const handleDelete = async (productId: number) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setProfile((prev) =>
        prev ? { ...prev, totalActiveProducts: prev.totalActiveProducts - 1 } : prev
      );
      toast.success("Producto eliminado correctamente");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al eliminar el producto");
    }
  };

  const handleMarkAsReward = async (productId: number) => {
    const target = products.find((p) => p.id === productId);
    const isReward = target?.isGameReward ?? false;
    const rewardCount = products.filter((p) => p.isGameReward).length;
    if (!isReward && rewardCount >= 3) {
      toast.error("Solo puedes tener máximo 3 productos como recompensa.");
      return;
    }
    try {
      await markProductAsReward(productId);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isGameReward: !p.isGameReward } : p))
      );
      toast.success(isReward ? "Recompensa desactivada" : "Producto marcado como recompensa");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al actualizar la recompensa");
    }
  };

  // ── Estados de carga / error ───────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-9 h-9 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const stars = Math.round(profile.averageRate ?? 0);
  const location = [profile.municipalityName, profile.departmentName]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-14">

      {/* ── TARJETA DE PERFIL ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-2 w-full bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440]" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-start">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shrink-0 shadow-md bg-linear-to-br from-[#0b1440] to-[#03548C]">
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>

            {/* Nombre y metadatos */}
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

              {/* Estrellas */}
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
                  ({profile.reviewCount}{" "}
                  {profile.reviewCount === 1 ? "reseña" : "reseñas"})
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
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

      {/* ── CATEGORÍAS ── */}
      {profile.productCategories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Categorías en las que vendes
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

      {/* ── PRODUCTOS ACTIVOS ── */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Tus productos activos</h2>
          <span className="text-sm text-gray-400">
            {profile.totalActiveProducts} productos
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aún no tienes productos activos.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <CommercialProductCard
                  key={product.id}
                  product={product}
                  onView={() => router.push(`/commercial/products/${product.id}`)}
                  onEdit={() => router.push(`/commercial/products/edit/${product.id}`)}
                  onDelete={() => handleDelete(product.id)}
                  onMarkAsReward={() => handleMarkAsReward(product.id)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={productsLoading}
                  className="px-8 py-2.5 rounded-xl bg-[#03548C] text-white font-semibold text-sm hover:bg-[#0b1440] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {productsLoading ? "Cargando..." : "Cargar más productos"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
