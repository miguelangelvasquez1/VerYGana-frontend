import React from 'react';
import { DashboardLayout } from '@/components/AdvertiserComponents/layout/DashboardLayout';
import { BillingDashboard } from '@/components/AdvertiserComponents/dashboard/BillingDashboard';

export default function BillingPage() {
  return (
    <DashboardLayout title="Facturación">
      <BillingDashboard />
    </DashboardLayout>
  );
}