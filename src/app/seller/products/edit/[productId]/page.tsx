"use client";

import { useParams, useRouter } from "next/navigation";
import EditProductForm from "@/components/forms/EditProductForm";
import ProductStockSection from "@/components/products/stock/ProductStockSection";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = Number(params.productId);

  if (isNaN(productId)) {
    return <p className="p-6 text-red-600">Producto inválido</p>;
  }

  return (
    <div className="space-y-10">
      <EditProductForm
        productId={productId}
        onSuccess={() => router.push("/seller/products")}
        onCancel={() => router.back()}
      />

      <ProductStockSection productId={productId} />
    </div>
  );
}
