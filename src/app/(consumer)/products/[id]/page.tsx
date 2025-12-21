import ProductDetail from "@/components/products/ProductDetail";
import { getProductDetail } from "@/services/ProductService";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import Footer from "@/components/Footer";
import Navbar from "@/components/bars/NavBar";
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductDetail(Number(id));

  return (
    <>
      <Navbar/>
      <div className="container mx-auto px-4 py-6">
        <ProductDetail product={product} />
        <AddToCartButton product={product} variant="primary" />
      </div>
      <Footer />
    </>
  );
}
