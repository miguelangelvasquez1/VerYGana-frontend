import ProductDetail from "@/components/products/ProductDetail";
import { getProductDetail } from "@/services/ProductService";
import Footer from "@/components/Footer";
import Navbar from "@/components/bars/NavBar";

interface ProductPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    mode?: "consumer" | "seller";
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const product = await getProductDetail(Number(params.id));
  const mode = searchParams?.mode ?? "consumer";

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProductDetail product={product} mode={mode} />
        </div>
      </main>
      <Footer />
    </>
  );
}
