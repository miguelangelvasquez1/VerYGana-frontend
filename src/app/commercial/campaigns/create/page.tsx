import { CreateCampaignForm } from "@/components/commercial/campaigns/CreateCampaignForm";
import { DashboardLayout } from "@/components/commercial/layout/DashboardLayout";

export default function CreateCampaignPage() {
  return (
    <DashboardLayout title="Crear Nueva Campaña">
      <div className="py-6">
        <CreateCampaignForm />
      </div>
    </DashboardLayout>
  );
}