import React from 'react';
import { DashboardLayout } from '@/components/advertiser/layout/DashboardLayout';
import { BillingDashboard } from '@/components/advertiser/dashboard/BillingDashboard';

export default function BillingPage() {
  return (
    <DashboardLayout title="Facturación">
      <BillingDashboard />
    </DashboardLayout>
  );
}