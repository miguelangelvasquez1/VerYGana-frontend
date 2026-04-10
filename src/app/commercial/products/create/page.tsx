
import { DashboardLayout } from "@/components/commercial/layout/DashboardLayout";
import CreateProductForm from "@/components/commercial/products/CreateProductForm";

export default function CreateCampaignPage() {
  return (
    <DashboardLayout title="Crear Nuevo producto">
      <div className="py-6">
        <CreateProductForm />
      </div>
    </DashboardLayout>
  );
}