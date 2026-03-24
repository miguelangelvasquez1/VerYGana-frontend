// app/(dashboard)/campaigns/page.tsx
import React from 'react';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';
import { CampaignManager } from '@/components/commercial/campaigns/CampaignManager';

export default function CampaignsPage() {
  return (
    <DashboardLayout title="Mis Campañas">
      <CampaignManager />
    </DashboardLayout>
  );
}