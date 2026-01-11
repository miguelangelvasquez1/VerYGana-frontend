import ProductDetail from "@/components/products/ProductDetail";
import { getProductDetail } from "@/services/ProductService";
import { AddToCartButton } from "@/components/products/AddToCartButton";
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

export default async function ProductPage({ params, searchParams }: ProductPageProps){
  const product = await getProductDetail(Number(params.id));
  const mode = searchParams?.mode ?? "consumer";

  return (
    <>
      <Navbar/>
      <div className="container mx-auto px-4 py-6">
        <ProductDetail product={product} mode ={mode} />
        <AddToCartButton product={product} variant="primary" />
      </div>
      <Footer />
    </>
  );
}
