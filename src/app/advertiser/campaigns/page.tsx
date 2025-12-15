// app/(dashboard)/campaigns/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/advertiser/layout/DashboardLayout';
import { CampaignManager } from '@/components/advertiser/dashboard/CampaignManager';

export default function CampaignsPage() {
  return (
    <DashboardLayout title="Campañas">
      <CampaignManager />
    </DashboardLayout>
  );
}