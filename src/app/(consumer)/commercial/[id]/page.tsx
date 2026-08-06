"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { getCommercialProfile } from "@/services/commercialService";
import { getCommercialProducts } from "@/services/ProductService";
import { CommercialProfileResponseDTO } from "@/types/Commercial.types";
import { ProductSummaryResponseDTO } from "@/types/products/Product.types";
import ConsumerProductCard from "@/components/consumer/products/ConsumerProductCard";
import CommercialStorefrontView from "@/components/shared/CommercialStorefrontView";

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
          className="text-sm font-semibold underline underline-offset-2 transition hover:opacity-70 cursor-pointer"
          style={{ color: "#014C92" }}
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
      fullPage
      renderProductCard={(product) => <ConsumerProductCard product={product} />}
    />
  );
}
