// app/advertiser/campaigns/create/page.tsx
import { CreateCampaignForm } from "@/components/advertiser/campaigns/CreateCampaignForm";
import { DashboardLayout } from "@/components/advertiser/layout/DashboardLayout";

export default function CreateCampaignPage() {
  return (
    <DashboardLayout title="Crear Nueva Campaña">
      <div className="py-6">
        <CreateCampaignForm />
      </div>
    </DashboardLayout>
  );
}