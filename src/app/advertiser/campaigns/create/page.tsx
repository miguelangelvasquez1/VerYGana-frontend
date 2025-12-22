import { CreateAdForm } from "@/components/advertiser/ads/CreatedAdForm";
import { CreateCampaignForm } from "@/components/advertiser/campaigns/CreateCampaignForm";
import { DashboardLayout } from "@/components/advertiser/layout/DashboardLayout";

export default function CreateCampaignPage() {
  return (
    <DashboardLayout title="Crear Campaña">
      <CreateCampaignForm />
    </DashboardLayout>
  );
}