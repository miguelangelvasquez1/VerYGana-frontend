// app/(dashboard)/campaigns/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/advertiser/layout/DashboardLayout';
import { CampaignManager } from '@/components/advertiser/campaigns/CampaignManager';

export default function CampaignsPage() {
  return (
    <DashboardLayout title="Mis Campañas">
      <CampaignManager />
    </DashboardLayout>
  );
}