// app/(dashboard)/campaigns/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/Advertiser/layout/DashboardLayout';
import { CampaignManager } from '@/components/Advertiser/dashboard/CampaignManager';

export default function CampaignsPage() {
  return (
    <DashboardLayout title="Campañas">
      <CampaignManager />
    </DashboardLayout>
  );
}