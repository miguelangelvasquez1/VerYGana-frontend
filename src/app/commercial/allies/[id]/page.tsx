"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { getCommercialProfile } from "@/services/commercialService";
import { getCommercialProducts } from "@/services/ProductService";
import { CommercialProfileResponseDTO } from "@/types/Commercial.types";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import CommercialStorefrontView from "@/components/shared/CommercialStorefrontView";
import AllyProductCard from "@/components/commercial/allies/AllyProductCard";
import { useAllyPromotions } from "@/hooks/commercial/useAllyPromotions";

export default function AllyStorefrontPage() {
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

  const { promotedIds, togglingIds, handleTogglePromote } = useAllyPromotions();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getCommercialProfile(commercialId);
        setProfile(data);
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
      <div className="flex items-center justify-center py-24">
        <div className="w-9 h-9 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">Vendedor no encontrado</p>
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold underline underline-offset-2 transition hover:opacity-70 text-[#03548C] cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <CommercialStorefrontView
      profile={profile}
      products={products}
      productsLoading={productsLoading}
      hasMore={hasMore}
      onLoadMore={loadMoreProducts}
      onBack={() => router.back()}
      renderProductCard={(product) => (
        <AllyProductCard
          product={product}
          isPromoted={promotedIds.has(product.id)}
          isToggling={togglingIds.has(product.id)}
          onTogglePromote={handleTogglePromote}
        />
      )}
    />
  );
}
