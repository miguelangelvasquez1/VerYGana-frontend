import ProductDetailConsumer from "@/components/consumer/products/ProductDetailConsumer";
import { getProductDetail } from "@/services/ProductService";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductDetail(Number(params.id));

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductDetailConsumer product={product} />
      </div>
    </main>
  );
}
