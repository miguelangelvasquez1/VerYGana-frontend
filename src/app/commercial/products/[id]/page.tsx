import ProductDetailCommercial from "@/components/commercial/products/ProductDetailCommercial";
import { getProductDetail } from "@/services/ProductService";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function CommercialProductPage({ params }: ProductPageProps) {
  const product = await getProductDetail(Number(params.id));

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductDetailCommercial product={product} />
      </div>
    </main>
  );
}
