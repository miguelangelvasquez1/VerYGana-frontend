import React from 'react';
import { DashboardLayout } from '@/components/Advertiser/layout/DashboardLayout';
import { BillingDashboard } from '@/components/Advertiser/dashboard/BillingDashboard';

export default function BillingPage() {
  return (
    <DashboardLayout title="Facturación">
      <BillingDashboard />
    </DashboardLayout>
  );
}