import { DashboardLayout } from "@/components/commercial/layout/DashboardLayout";
import ProductsDashboard from "@/components/commercial/products/ProductsDashboard";

export default function ProductsPage() {

  return (
      <DashboardLayout title="Mis Productos">
        <ProductsDashboard />
      </DashboardLayout>
    );
}