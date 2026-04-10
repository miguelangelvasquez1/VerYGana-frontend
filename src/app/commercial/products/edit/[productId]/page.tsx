"use client";

import { useParams, useRouter } from "next/navigation";
import EditProductForm from "@/components/commercial/products/EditProductForm";
import ProductStockSection from "@/components/consumer/products/stock/ProductStockSection";
import { DashboardLayout } from "@/components/commercial/layout/DashboardLayout";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = Number(params.productId);

  if (isNaN(productId)) {
    return <p className="p-6 text-red-600">Producto inválido</p>;
  }

  return (
    <DashboardLayout title="Editar Producto">
      <div className="space-y-10">
        <EditProductForm
          productId={productId}
          onSuccess={() => router.push("/commercial/products")}
          onCancel={() => router.back()}
        />

        <ProductStockSection productId={productId} />
      </div>
    </DashboardLayout>
  );
}
