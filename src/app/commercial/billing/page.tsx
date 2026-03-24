import React from 'react';
import { DashboardLayout } from '@/components/commercial/layout/DashboardLayout';
import { BillingDashboard } from '@/components/commercial/dashboard/BillingDashboard';

export default function BillingPage() {
  return (
    <DashboardLayout title="Facturación">
      <BillingDashboard />
    </DashboardLayout>
  );
}