import { Suspense } from "react";
import ProductsDashboard from "@/components/commercial/products/ProductsDashboard";

export default function ProductsPage() {

  return (
      // useSearchParams exige un límite de Suspense para que `next build` pueda prerenderizar la página.
      <Suspense fallback={null}>
        <ProductsDashboard />
      </Suspense>
    );
}
