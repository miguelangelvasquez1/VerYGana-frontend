// app/(dashboard)/campaigns/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/AdvertiserComponents/layout/DashboardLayout';
import { CampaignManager } from '@/components/AdvertiserComponents/dashboard/CampaignManager';

export default function CampaignsPage() {
  return (
    <DashboardLayout title="Campañas">
      <CampaignManager />
    </DashboardLayout>
  );
}